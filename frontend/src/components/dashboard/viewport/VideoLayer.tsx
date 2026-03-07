import { useEffect, useRef } from 'react';

// VideoFrameCallbackMetadata and requestVideoFrameCallback are in the TS lib.
// We just need a helper to check support at runtime without triggering
// TypeScript's narrowing (which turns else-branches into never).
function rvfcSupported(el: HTMLVideoElement): boolean {
  return (
    typeof (el as unknown as { requestVideoFrameCallback?: unknown })
      .requestVideoFrameCallback === 'function'
  );
}

interface VideoLayerProps {
  src: string;
  playbackRate: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  onTimeUpdate: (currentTime: number) => void;
  onVideoReady: (
    seek: (time: number) => void,
    getCurrentTime: () => number,
    videoEl: HTMLVideoElement,
  ) => void;
  onLoadingChange: (loading: boolean) => void;
  onEnded: () => void;
}

export const VideoLayer = ({
  src,
  playbackRate,
  isPlaying,
  volume,
  isMuted,
  onTimeUpdate,
  onVideoReady,
  onLoadingChange,
  onEnded,
}: VideoLayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rvfcRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const cancelLoop = () => {
    const video = videoRef.current;
    if (video && rvfcRef.current !== null) {
      video.cancelVideoFrameCallback(rvfcRef.current);
      rvfcRef.current = null;
    }
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    onVideoReady(
      (time: number) => {
        video.currentTime = time;
      },
      () => video.currentTime,
      video,
    );
  }, [onVideoReady]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    cancelLoop();

    if (isPlaying) {
      video.play().catch(() => {});

      if (rvfcSupported(video)) {
        const onFrame = (
          _now: DOMHighResTimeStamp,
          meta: VideoFrameCallbackMetadata,
        ) => {
          onTimeUpdate(meta.mediaTime);
          rvfcRef.current = video.requestVideoFrameCallback(onFrame);
        };
        rvfcRef.current = video.requestVideoFrameCallback(onFrame);
      } else {
        const tick = () => {
          onTimeUpdate(video.currentTime);
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    } else {
      video.pause();
      // Do NOT register rvfc here — it fires asynchronously and overwrites
      // the currentTime we just set via seekVideo, causing a visible bounce.
      // currentTime is set synchronously in handleSeekToFrame so no update needed.
    }

    return cancelLoop;
  }, [isPlaying, onTimeUpdate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.addEventListener('ended', onEnded);
    return () => video.removeEventListener('ended', onEnded);
  }, [onEnded]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const setLoading = () => onLoadingChange(true);
    const setNotLoading = () => onLoadingChange(false);
    video.addEventListener('waiting', setLoading);
    video.addEventListener('seeking', setLoading);
    video.addEventListener('loadstart', setLoading);
    video.addEventListener('canplay', setNotLoading);
    video.addEventListener('canplaythrough', setNotLoading);
    video.addEventListener('seeked', setNotLoading);
    video.addEventListener('playing', setNotLoading);
    return () => {
      video.removeEventListener('waiting', setLoading);
      video.removeEventListener('seeking', setLoading);
      video.removeEventListener('loadstart', setLoading);
      video.removeEventListener('canplay', setNotLoading);
      video.removeEventListener('canplaythrough', setNotLoading);
      video.removeEventListener('seeked', setNotLoading);
      video.removeEventListener('playing', setNotLoading);
    };
  }, [onLoadingChange]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="absolute inset-0 w-full h-full object-contain"
      playsInline
    />
  );
};
