import cv2
import time
import json
import numpy as np
from collections import deque
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import tempfile, os

from rtmlib import BodyWithFeet

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialise model once at startup
body_with_feet = BodyWithFeet(
    to_openpose=False,
    backend="onnxruntime",
    device="cpu",
)

# Warmup
body_with_feet(np.zeros((64, 64, 3), dtype=np.uint8))
print("✅ Model ready")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/infer/video")
async def infer_video(file: UploadFile = File(...)):
    # Save upload to a temp file so OpenCV can open it
    suffix = os.path.splitext(file.filename or "video.mp4")[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    def stream():
        try:
            cap = cv2.VideoCapture(tmp_path)

            fps          = cap.get(cv2.CAP_PROP_FPS)
            width        = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height       = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

            if fps <= 0:
                fps = 30.0

            frames_data  = []
            frame_idx    = 0
            start_time   = time.time()
            fps_window   = deque(maxlen=30)

            while cap.isOpened():
                success, frame = cap.read()
                if not success:
                    break

                frame_start = time.time()

                keypoints, scores = body_with_feet(frame)

                # Compact flat array: [x0,y0,s0, x1,y1,s1, ...]
                if len(keypoints) > 0:
                    kp = keypoints[0]
                    sc = scores[0]
                    flat = []
                    for (x, y), s in zip(kp, sc):
                        flat.extend([float(x), float(y), float(s)])
                else:
                    # No detection — zeros
                    flat = [0.0] * (26 * 3)

                frames_data.append(flat)

                # Timing
                frame_time = time.time() - frame_start
                fps_window.append(frame_time)
                elapsed = time.time() - start_time

                avg_frame_time = sum(fps_window) / len(fps_window)
                real_fps       = 1.0 / avg_frame_time if avg_frame_time > 0 else 0
                remaining      = total_frames - frame_idx - 1
                eta            = remaining / real_fps if real_fps > 0 else 0
                pct            = round((frame_idx + 1) / total_frames * 100, 1) if total_frames > 0 else 0

                progress_event = {
                    "type":    "progress",
                    "frame":   frame_idx,
                    "total":   total_frames - 1,  # 0-based last index
                    "pct":     pct,
                    "fps":     round(real_fps, 2),
                    "elapsed": round(elapsed, 1),
                    "eta":     round(eta, 1),
                }
                yield f"data: {json.dumps(progress_event)}\n\n"

                frame_idx += 1

            cap.release()

            result_event = {
                "type":         "result",
                "fps":          fps,          # exact CAP_PROP_FPS — ground truth
                "frame_width":  width,
                "frame_height": height,
                "total_frames": len(frames_data),
                "frames":       frames_data,
            }
            yield f"data: {json.dumps(result_event)}\n\n"

        finally:
            os.unlink(tmp_path)

    return StreamingResponse(stream(), media_type="text/event-stream")