import cv2
import os
import pandas as pd
from rtmlib import BodyWithFeet, draw_skeleton

device = "cpu"
backend = "onnxruntime"

# === Input file variable ===
input_file = "./videos/hadid.mp4"

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

# === Output filenames ===
base_name = os.path.splitext(os.path.basename(input_file))[0]

os.makedirs("./output", exist_ok=True)

video_output_path = f"./output/{base_name}_processed.avi"
data_output_path = f"./output/{base_name}_keypoints.csv"

fourcc = cv2.VideoWriter_fourcc(*"MJPG")
out = cv2.VideoWriter(video_output_path, fourcc, fps, (width, height))

print(f"Processing video: {base_name}")
print(f"FPS: {fps}")
print(f"Total frames: {total_frames}")
print("-" * 50)

frame_idx = 0

# Store pose data
records = []

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    frame_idx += 1

    keypoints, scores = body_with_feet(frame)

    # Save pose data
    # Flatten keypoints + scores
    record = {
        "frame": frame_idx
    }

    # Keypoints shape usually: [num_people, num_keypoints, 2]
    # Scores shape: [num_people, num_keypoints]

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

    # Progress display
    progress = (frame_idx / total_frames) * 100 if total_frames > 0 else 0

    print(
        f"\rFrame {frame_idx}/{total_frames} | Progress: {progress:.2f}%",
        end="",
        flush=True
    )

cap.release()
out.release()

# Save CSV
df = pd.DataFrame(records)
df.to_csv(data_output_path, index=False)

print(f"\n✅ Video processing complete! Saved to {video_output_path}")
print(f"✅ Pose data saved to {data_output_path}")