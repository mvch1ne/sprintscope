import { useRef, useState, useCallback, useEffect } from 'react';

interface ImportMetaEnv {
  VITE_POSE_BACKEND_URL?: string;
}
const BACKEND_URL =
  (import.meta as unknown as { env: ImportMetaEnv }).env
    ?.VITE_POSE_BACKEND_URL ?? 'http://localhost:8080';

// 2D keypoint — pixel coords in inference frame
export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

export type LandmarkerStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface PoseProgress {
  frame: number;
  total: number;
  pct: number;
  fps: number;
  elapsed: number;
  eta: number;
}

interface UsePoseLandmarkerReturn {
  status: LandmarkerStatus;
  progress: PoseProgress | null;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  poseFps: number;
  backendReachable: boolean;
  getKeypoints: (frame: number) => Keypoint[];
  analyseVideo: (videoSrc: string) => Promise<void>;
  reset: () => void;
}

export function usePoseLandmarker(): UsePoseLandmarkerReturn {
  const [status, setStatus] = useState<LandmarkerStatus>('idle');
  const [progress, setProgress] = useState<PoseProgress | null>(null);
  const [backendReachable, setBackendReachable] = useState(false);
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [poseFps, setPoseFps] = useState(0);

  // Poll /health on mount until the backend wakes up (handles cold-start / hibernation).
  // Retries every 5 s indefinitely; stops as soon as a 200 is received.
  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      while (!cancelled) {
        try {
          const r = await fetch(`${BACKEND_URL}/health`, { method: 'GET' });
          if (r.ok) { setBackendReachable(true); return; }
        } catch {
          // not yet reachable — keep waiting
        }
        await new Promise((res) => setTimeout(res, 5000));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, []);

  const map2dRef = useRef<Map<number, Keypoint[]>>(new Map());

  const getKeypoints = useCallback((frame: number): Keypoint[] => {
    const clamped = Math.max(0, Math.min(frame, map2dRef.current.size - 1));
    return map2dRef.current.get(clamped) ?? [];
  }, []);

  const reset = useCallback(() => {
    map2dRef.current.clear();
    setStatus('idle');
    setProgress(null);
    setFrameWidth(0);
    setFrameHeight(0);
    setTotalFrames(0);
    setPoseFps(0);
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
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const msg = JSON.parse(line.slice(6));

            if (msg.type === 'progress') {
              setProgress({
                frame: msg.frame,
                total: msg.total,
                pct: msg.pct,
                fps: msg.fps,
                elapsed: msg.elapsed,
                eta: msg.eta,
              });
            } else if (msg.type === 'result') {
              const nKpts = msg.n_kpts as number;
              const stride2d = nKpts * 3; // x,y,s per keypoint

              const new2d = new Map<number, Keypoint[]>();

              (msg.frames as number[][]).forEach((flat, i) => {
                const kps2d: Keypoint[] = [];
                for (let j = 0; j < stride2d; j += 3)
                  kps2d.push({
                    x: flat[j],
                    y: flat[j + 1],
                    score: flat[j + 2],
                  });
                new2d.set(i, kps2d);
              });

              map2dRef.current = new2d;
              setFrameWidth(msg.frame_width);
              setFrameHeight(msg.frame_height);
              setTotalFrames(msg.total_frames);
              setPoseFps(msg.fps);
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
    totalFrames,
    poseFps,
    backendReachable,
    getKeypoints,
    analyseVideo,
    reset,
  };
}
