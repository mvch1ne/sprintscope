import { useEffect, useRef, useCallback } from 'react';

interface VideoLayerProps {
  src: string;
  fps: number;
  totalFrames: number;
  currentFrame: number;
  playbackRate: number;
  isPlaying: boolean;
  onFrameChange: (frame: number) => void;
  onEnded: () => void;
  onReady: (videoEl: HTMLVideoElement) => void;
}

export const VideoLayer = ({
  src,
  fps,
  totalFrames,
  currentFrame,
  playbackRate,
  isPlaying,
  onFrameChange,
  onEnded,
  onReady,
}: VideoLayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const rafRef = useRef<number | null>(null);

  // Refs read by the rAF loop — never stale, never cause loop restarts
  const fpsRef = useRef(fps);
  const totalFramesRef = useRef(totalFrames);
  const isPlayingRef = useRef(isPlaying);
  const playbackRateRef = useRef(playbackRate);
  const currentFrameRef = useRef(currentFrame);

  useEffect(() => {
    fpsRef.current = fps;
  }, [fps]);
  useEffect(() => {
    totalFramesRef.current = totalFrames;
  }, [totalFrames]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // ── Draw whatever frame the video element is currently on ─────────────────
  const draw = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!video || !canvas || !ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }, []);

  // ── Load new src ──────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Stop any running loop before changing src
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    video.pause();
    video.src = src;
    video.muted = true;
    video.preload = 'auto';
    video.load();

    const onMeta = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctxRef.current = canvas.getContext('2d');
      }
      onReady(video);
      video.currentTime = 0;
    };

    video.addEventListener('loadedmetadata', onMeta, { once: true });
    video.addEventListener('seeked', draw);
    return () => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('seeked', draw);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // ── Sync playbackRate ─────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = playbackRate;
  }, [playbackRate]);

  // ── Always keep currentFrameRef in sync with the prop ────────────────────
  useEffect(() => {
    currentFrameRef.current = currentFrame;
  }, [currentFrame]);

  // ── Seek on scrub / step (only when paused) ───────────────────────────────
  useEffect(() => {
    if (isPlaying) return;
    const video = videoRef.current;
    if (!video || !fps) return;
    // Seek to the centre of the frame window to avoid boundary ambiguity
    const target = (currentFrame + 0.5) / fps;
    if (Math.abs(video.currentTime - target) > 0.5 / fps) {
      video.currentTime = target;
      // draw() fires via the 'seeked' listener
    }
  }, [currentFrame, isPlaying, fps]);

  // ── Playback ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!isPlaying) {
      video.pause();
      return;
    }

    const tick = () => {
      if (!isPlayingRef.current) return;

      const raw = Math.round(video.currentTime * fpsRef.current);
      const frame = Math.min(raw, totalFramesRef.current - 1);

      if (frame !== currentFrameRef.current) {
        currentFrameRef.current = frame;
        draw();
        onFrameChange(frame);
      }

      if (video.ended || frame >= totalFramesRef.current - 1) {
        currentFrameRef.current = totalFramesRef.current - 1;
        draw();
        onFrameChange(totalFramesRef.current - 1);
        onEnded();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    // Always seek to exactly where currentFrame says before playing.
    // This resolves both the "ended" restart and any mid-seek race condition.
    const targetTime = currentFrameRef.current / fpsRef.current;
    video.currentTime = targetTime;
    video.addEventListener(
      'seeked',
      () => {
        if (!isPlayingRef.current) return;
        video.playbackRate = playbackRateRef.current;
        video.play().catch(() => {});
        rafRef.current = requestAnimationFrame(tick);
      },
      { once: true },
    );

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      video.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  return (
    <>
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        preload="auto"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain"
      />
    </>
  );
};
