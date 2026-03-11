import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Play } from 'lucide-react';

// Sample video
import sampleVideoUrl from '/sampleVideo.mp4';

// ── Config — fill in when you have real URLs ────────────────────────────────
const YOUTUBE_DEMO_URL = 'https://youtu.be/4RrcAlu0W9Q';

const STEPS = [
  {
    n: 1,
    title: 'Upload video',
    body: 'Click the upload icon or drag-and-drop an MP4/MOV onto the viewport.',
  },
  {
    n: 2,
    title: 'Calibrate scale',
    body: 'Place two calibration points a known distance apart to convert pixels to metres.',
  },
  {
    n: 3,
    title: 'Run pose analysis',
    body: 'Enable pose to detect the skeleton on every frame. All processing is local.',
  },
  {
    n: 4,
    title: 'Annotate markers',
    body: 'Draw Start and (for Flying mode) Finish lines using Annotate in the toolbar.',
  },
  {
    n: 5,
    title: 'Confirm first movement',
    body: 'Static mode: seek to first movement and confirm the proposed frame with the Flag button.',
  },
  {
    n: 6,
    title: 'Read telemetry',
    body: 'Open the telemetry panel — CoM velocity, joint angles, ground contacts and more.',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  showOnStartup: boolean;
  onToggleShowOnStartup: (v: boolean) => void;
}

export const HelpModal = ({
  isOpen,
  onClose,
  showOnStartup,
  onToggleShowOnStartup,
}: Props) => {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );
  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Card — wide, no scroll */}
      <div className="relative z-10 w-full max-w-2xl mx-4 flex flex-col bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300 font-sans">
            Getting started with SprintLab
          </span>
          <button
            onClick={onClose}
            className="ml-auto text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>

        {/* Body — fixed, no scroll */}
        <div className="px-4 py-3 space-y-3">
          {/* Intro + action buttons on one row */}
          <div className="flex items-start gap-4">
            <p className="flex-1 text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Browser-based sprint kinematics analyser. Upload a video,
              calibrate scale, run pose analysis and get instant biomechanics
              telemetry — all processed locally, no data leaves your device.
            </p>
            <div className="shrink-0 flex flex-col gap-1.5">
              <a
                href={YOUTUBE_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-sm text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:border-red-500/50 hover:text-red-500 dark:hover:text-red-400 transition-colors whitespace-nowrap"
              >
                <Play size={11} />
                Watch demo
              </a>
              <a
                href={sampleVideoUrl}
                download="sprintlab-sample.mp4"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-sm text-[11px] font-mono text-zinc-500 dark:text-zinc-400 hover:border-sky-500/50 hover:text-sky-500 dark:hover:text-sky-400 transition-colors whitespace-nowrap"
              >
                <Download size={11} />
                Sample video
              </a>
            </div>
          </div>

          {/* Divider + section label */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-400">
              Quick-start guide
            </span>
            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
          </div>

          {/* Steps — 2-column grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            {STEPS.map((s) => (
              <div key={s.n} className="flex gap-2.5 items-start">
                <span className="shrink-0 w-4 h-4 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-[9px] font-mono text-zinc-500 flex items-center justify-center mt-px">
                  {s.n}
                </span>
                <div>
                  <div className="text-[11px] font-sans font-medium text-zinc-700 dark:text-zinc-300 leading-tight mb-0.5">
                    {s.title}
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-snug">
                    {s.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showOnStartup}
              onChange={(e) => onToggleShowOnStartup(e.target.checked)}
              className="w-3 h-3 accent-sky-500 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-500 font-mono">
              Show on startup
            </span>
          </label>
          <button
            onClick={onClose}
            className="ml-auto px-3 py-1 text-[11px] font-mono bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 rounded-sm hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
