// ─── RTMPose Backend Hook ─────────────────────────────────────────────────────
// Uploads video as multipart, reads SSE stream for progress then final result.

import { useRef, useState, useCallback } from 'react';

interface ImportMetaEnv {
  VITE_POSE_BACKEND_URL?: string;
}
const BACKEND_URL =
  (import.meta as unknown as { env: ImportMetaEnv }).env
    ?.VITE_POSE_BACKEND_URL ?? 'http://localhost:8080';

export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

export type LandmarkerStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UsePoseLandmarkerReturn {
  status: LandmarkerStatus;
  progress: { frame: number; total: number; pct: number } | null;
  frameWidth: number;
  frameHeight: number;
  getKeypoints: (frame: number) => Keypoint[];
  analyseVideo: (videoSrc: string) => Promise<void>;
  reset: () => void;
}

export function usePoseLandmarker(): UsePoseLandmarkerReturn {
  const [status, setStatus] = useState<LandmarkerStatus>('idle');
  const [progress, setProgress] = useState<{
    frame: number;
    total: number;
    pct: number;
  } | null>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);
  const frameMapRef = useRef<Map<number, Keypoint[]>>(new Map());

  const getKeypoints = useCallback((frame: number): Keypoint[] => {
    return frameMapRef.current.get(frame) ?? [];
  }, []);

  const reset = useCallback(() => {
    frameMapRef.current.clear();
    setStatus('idle');
    setProgress(null);
    setFrameWidth(0);
    setFrameHeight(0);
  }, []);

  const analyseVideo = useCallback(
    async (videoSrc: string) => {
      reset();
      setStatus('loading');

      try {
        const blob = await fetch(videoSrc).then((r) => r.blob());
        const form = new FormData();
        form.append('file', blob, 'video');

        const res = await fetch(`${BACKEND_URL}/infer/video`, {
          method: 'POST',
          body: form,
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // keep incomplete line

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const msg = JSON.parse(line.slice(6));

            if (msg.type === 'progress') {
              setProgress({ frame: msg.frame, total: msg.total, pct: msg.pct });
            } else if (msg.type === 'result') {
              const map = new Map<number, Keypoint[]>();
              (msg.frames as number[][]).forEach((flat, frameIdx) => {
                const kps: Keypoint[] = [];
                for (let i = 0; i < flat.length; i += 3) {
                  kps.push({ x: flat[i], y: flat[i + 1], score: flat[i + 2] });
                }
                map.set(frameIdx, kps);
              });
              frameMapRef.current = map;
              setFrameWidth(msg.frame_width);
              setFrameHeight(msg.frame_height);
              setProgress(null);
              setStatus('ready');
            }
          }
        }
      } catch (err) {
        console.error('[RTMPose]', err);
        setStatus('error');
        setProgress(null);
      }
    },
    [reset],
  );

  return {
    status,
    progress,
    frameWidth,
    frameHeight,
    getKeypoints,
    analyseVideo,
    reset,
  };
}
