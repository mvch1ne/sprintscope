import { VideoLayer } from './VideoLayer';
import { FilePlayIcon } from 'lucide-react';
import { Clock } from 'lucide-react';
import { IconDimensions } from '@tabler/icons-react';

import { ControlPanel } from './ControlPanel';

export const Viewport = () => {
  const sectionHeights = {
    header: '1.25rem',
    controlSection: '10rem',
  };

  return (
    <div className="viewport-container flex flex-col h-full">
      <header
        style={{ height: sectionHeights.header }}
        className="flex items-center shrink-0 border border-t-0 border-zinc-400 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 gap-3"
      >
        {/* Section label */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-sans">
            Viewport
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-950" />

        {/* Metadata readouts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <FilePlayIcon className="h-3 w-3 text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950" />
            <span className="text-[9px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-sans">
              Title
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <IconDimensions className="h-3 w-3 text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950" />
            <span className="text-[9px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-sans">
              Dimensions
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950" />
            <span className="text-[9px] uppercase tracking-widest text-zinc-700 dark:text-zinc-300 dark:bg-zinc-950 font-sans">
              Framerate
            </span>
          </div>
        </div>

        <div className="ml-auto flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full bg-zinc-300 dark:text-zinc-300"
            />
          ))}
        </div>
      </header>

      <main className="flex-1 border border-zinc-400 dark:border-zinc-600 overflow-hidden flex justify-center items-center bg-black">
        <VideoLayer />
      </main>

      <div
        style={{ height: sectionHeights.controlSection }}
        className="border shrink-0"
      >
        <ControlPanel />
      </div>
    </div>
  );
};
