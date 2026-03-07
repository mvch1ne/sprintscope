// ─── RTMPose Backend Hook ─────────────────────────────────────────────────────
// Sends the entire video file once → gets back keypoints for every frame.
// Stores as a Map<frameNumber, keypoints> so the overlay just does a lookup.

import { useRef, useState, useCallback } from 'react';

interface ImportMetaEnv {
  VITE_POSE_BACKEND_URL?: string;
}
const BACKEND_URL =
  (import.meta as unknown as { env: ImportMetaEnv }).env
    ?.VITE_POSE_BACKEND_URL ?? 'http://localhost:8080';

export interface Keypoint {
  x: number; // raw pixel x in original video frame
  y: number; // raw pixel y in original video frame
  score: number;
}

export type LandmarkerStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UsePoseLandmarkerReturn {
  status: LandmarkerStatus;
  frameWidth: number;
  frameHeight: number;
  getKeypoints: (frame: number) => Keypoint[];
  analyseVideo: (videoSrc: string) => Promise<void>;
  reset: () => void;
}

export function usePoseLandmarker(): UsePoseLandmarkerReturn {
  const [status, setStatus] = useState<LandmarkerStatus>('idle');
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);
  const frameMapRef = useRef<Map<number, Keypoint[]>>(new Map());

  const getKeypoints = useCallback((frame: number): Keypoint[] => {
    return frameMapRef.current.get(frame) ?? [];
  }, []);

  const reset = useCallback(() => {
    frameMapRef.current.clear();
    setStatus('idle');
    setFrameWidth(0);
    setFrameHeight(0);
  }, []);

  const analyseVideo = useCallback(
    async (videoSrc: string) => {
      reset();
      setStatus('loading');

      try {
        // Fetch the blob URL and convert to base64
        const blob = await fetch(videoSrc).then((r) => r.blob());
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        const res = await fetch(`${BACKEND_URL}/infer/video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ video: base64 }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as {
          fps: number;
          frame_width: number;
          frame_height: number;
          frames: { frame: number; keypoints: Keypoint[] }[];
        };

        // Build the lookup map
        const map = new Map<number, Keypoint[]>();
        for (const f of data.frames) map.set(f.frame, f.keypoints);
        frameMapRef.current = map;

        setFrameWidth(data.frame_width);
        setFrameHeight(data.frame_height);
        setStatus('ready');
      } catch (err) {
        console.error('[RTMPose]', err);
        setStatus('error');
      }
    },
    [reset],
  );

  return { status, frameWidth, frameHeight, getKeypoints, analyseVideo, reset };
}
