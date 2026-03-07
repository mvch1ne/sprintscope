import cv2
import os
import pandas as pd
import time
from collections import deque
from rtmlib import BodyWithFeet, draw_skeleton

device = "cpu"
backend = "onnxruntime"

input_file = "./videos/jonielle.mp4"

cap = cv2.VideoCapture(input_file)

openpose_skeleton = False

body_with_feet = BodyWithFeet(
    to_openpose=openpose_skeleton,
    backend=backend,
    device=device,
)

# Video properties
fps = cap.get(cv2.CAP_PROP_FPS)
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

if fps <= 0:
    fps = 30

# Output paths
base_name = os.path.splitext(os.path.basename(input_file))[0]

os.makedirs("./output", exist_ok=True)

video_output_path = f"./output/{base_name}_processed.avi"
data_output_path = f"./output/{base_name}_keypoints.csv"

fourcc = cv2.VideoWriter_fourcc(*"MJPG")
out = cv2.VideoWriter(video_output_path, fourcc, fps, (width, height))

# Timing helpers
def format_seconds(seconds):
    seconds = int(seconds)
    hrs = seconds // 3600
    mins = (seconds % 3600) // 60
    secs = seconds % 60

    if hrs > 0:
        return f"{hrs}h {mins}m {secs}s"
    elif mins > 0:
        return f"{mins}m {secs}s"
    return f"{secs}s"

print(f"Processing video: {base_name}")
print(f"Total frames: {total_frames}")
print("-" * 80)

frame_idx = 0
records = []

start_time = time.time()

# Performance windows
pipeline_window = deque(maxlen=30)
inference_window = deque(maxlen=30)

while cap.isOpened():
    frame_start_pipeline = time.time()

    success, frame = cap.read()
    if not success:
        break

    frame_idx += 1

    # -------- Inference timing --------
    frame_start_inference = time.time()

    keypoints, scores = body_with_feet(frame)

    inference_time = time.time() - frame_start_inference
    inference_window.append(inference_time)

    # Save pose data
    record = {"frame": frame_idx}

    if len(keypoints) > 0:
        kp = keypoints[0]
        sc = scores[0]

        for i, (pt, conf) in enumerate(zip(kp, sc)):
            record[f"x_{i}"] = float(pt[0])
            record[f"y_{i}"] = float(pt[1])
            record[f"s_{i}"] = float(conf)

    records.append(record)

    img_show = draw_skeleton(
        frame.copy(),
        keypoints,
        scores,
        openpose_skeleton=openpose_skeleton,
        kpt_thr=0.43,
    )

    out.write(img_show)

    # -------- Pipeline timing --------
    pipeline_time = time.time() - frame_start_pipeline
    pipeline_window.append(pipeline_time)

    # Smoothed FPS estimates
    inference_fps = 1.0 / (sum(inference_window) / len(inference_window)) if len(inference_window) > 0 else 0
    pipeline_fps = 1.0 / (sum(pipeline_window) / len(pipeline_window)) if len(pipeline_window) > 0 else 0

    # ETA based on pipeline speed
    remaining_frames = total_frames - frame_idx
    eta_seconds = remaining_frames / pipeline_fps if pipeline_fps > 0 else 0

    progress = (frame_idx / total_frames) * 100 if total_frames > 0 else 0
    elapsed = time.time() - start_time

    print(
        f"\rFrame {frame_idx}/{total_frames} | "
        f"Progress: {progress:.2f}% | "
        f"Inf FPS: {inference_fps:.2f} | "
        f"Pipe FPS: {pipeline_fps:.2f} | "
        f"Elapsed: {format_seconds(elapsed)} | "
        f"ETA: {format_seconds(eta_seconds)}",
        end="",
        flush=True
    )

cap.release()
out.release()

pd.DataFrame(records).to_csv(data_output_path, index=False)

total_time = time.time() - start_time

print(f"\n\n✅ Processing complete!")
print(f"📁 Video → {video_output_path}")
print(f"📊 Data → {data_output_path}")
print(f"⏱ Total time → {format_seconds(total_time)}")