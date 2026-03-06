import { useRef, useState, useCallback } from 'react';
import type { CropRect, TrimPoints } from './TrimCropPanel';

import { hasRVFC, type VideoElementWithRVFC } from './videoUtils';

export type ExportStatus =
  | 'idle'
  | 'recording'
  | 'processing'
  | 'done'
  | 'error';

interface UseExportOptions {
  videoElRef: React.RefObject<HTMLVideoElement | null>;
  exportingRef: React.RefObject<boolean>;
  videoWidth: number;
  videoHeight: number;
  fps: number;
  trimPoints: TrimPoints;
  cropRect: CropRect | null;
  title: string;
}

interface UseExportReturn {
  exportStatus: ExportStatus;
  exportProgress: number;
  startExport: (
    mode: 'replace' | 'download',
    onReplace: (url: string, w: number, h: number) => void,
  ) => void;
}

function pickMime(): string {
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9'))
    return 'video/webm;codecs=vp9';
  if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8'))
    return 'video/webm;codecs=vp8';
  return 'video/webm';
}

function waitForFrame(videoEl: HTMLVideoElement): Promise<void> {
  return new Promise((res) => {
    if (hasRVFC(videoEl)) {
      videoEl.requestVideoFrameCallback(() => res());
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => res()));
    }
  });
}

// Stop recorder and wait for onstop, with a hard timeout fallback
function stopRecorder(recorder: MediaRecorder): Promise<void> {
  return new Promise((res) => {
    const timeout = setTimeout(res, 3000); // never hang forever
    recorder.onstop = () => {
      clearTimeout(timeout);
      res();
    };
    try {
      recorder.stop();
    } catch {
      res();
    }
  });
}

export function useExport({
  videoElRef,
  exportingRef,
  videoWidth,
  videoHeight,
  fps,
  trimPoints,
  cropRect,
  title,
}: UseExportOptions): UseExportReturn {
  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const abortRef = useRef(false);

  const optsRef = useRef({
    videoWidth,
    videoHeight,
    fps,
    trimPoints,
    cropRect,
    title,
  });
  optsRef.current = {
    videoWidth,
    videoHeight,
    fps,
    trimPoints,
    cropRect,
    title,
  };

  const startExport = useCallback(
    async (
      mode: 'replace' | 'download',
      onReplace: (url: string, w: number, h: number) => void,
    ) => {
      const videoEl = videoElRef.current;
      const { videoWidth, videoHeight, fps, trimPoints, cropRect, title } =
        optsRef.current;

      if (!videoEl || videoWidth === 0 || videoHeight === 0) return;

      const trimDuration = trimPoints.outPoint - trimPoints.inPoint;
      if (trimDuration <= 0) return;

      abortRef.current = false;
      exportingRef.current = true; // suppress loading indicator
      setExportStatus('recording');
      setExportProgress(0);

      videoEl.pause();

      const srcX = cropRect ? cropRect.x * videoWidth : 0;
      const srcY = cropRect ? cropRect.y * videoHeight : 0;
      const srcW = cropRect ? cropRect.w * videoWidth : videoWidth;
      const srcH = cropRect ? cropRect.h * videoHeight : videoHeight;
      const outW = Math.max(2, Math.round(srcW));
      const outH = Math.max(2, Math.round(srcH));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d')!;

      const mimeType = pickMime();

      // captureStream(0) = fully manual frame timing
      const stream = canvas.captureStream(0);
      const track = stream.getVideoTracks()[0] as MediaStreamTrack & {
        requestFrame?: () => void;
      };
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 10_000_000,
      });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // Collect data frequently so buffer doesn't grow unbounded
      recorder.start(50);

      const frameDuration = 1 / fps;
      const totalFrames = Math.round(trimDuration * fps);

      // Explicit frame list — always ends exactly at outPoint
      const frameTimestamps: number[] = [];
      for (let i = 0; i <= totalFrames; i++) {
        frameTimestamps.push(
          Math.min(trimPoints.inPoint + i * frameDuration, trimPoints.outPoint),
        );
      }
      if (frameTimestamps[frameTimestamps.length - 1] < trimPoints.outPoint) {
        frameTimestamps.push(trimPoints.outPoint);
      }

      for (let i = 0; i < frameTimestamps.length; i++) {
        if (abortRef.current) break;

        const frameReady = waitForFrame(videoEl);
        videoEl.currentTime = frameTimestamps[i];
        await frameReady;

        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(videoEl, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
        track.requestFrame?.();

        // Only reach 99% inside the loop — 100% set after recorder fully stops
        setExportProgress(Math.min(0.98, i / (frameTimestamps.length - 1)));
      }

      // Flush remaining buffered data then stop
      recorder.requestData();
      await new Promise<void>((res) => setTimeout(res, 150));
      await stopRecorder(recorder);

      setExportProgress(0.99);
      setExportStatus('processing');

      try {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);

        if (mode === 'download') {
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title}_clip.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 15_000);
        } else {
          onReplace(url, outW, outH);
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }

        setExportStatus('done');
        setExportProgress(1);
      } catch {
        setExportStatus('error');
      } finally {
        exportingRef.current = false;
      }
    },
    [videoElRef, exportingRef],
  );

  return { exportStatus, exportProgress, startExport };
}
