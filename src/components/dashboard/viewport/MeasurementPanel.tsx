import { Trash2, Ruler, X, Eye, EyeOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Measurement } from './MeasurementOverlay';

interface Props {
  measurements: Measurement[];
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  onToggleVisible: (id: string) => void;
  onToggleAllVisible: () => void;
  onClose: () => void;
}

export const MeasurementPanel = ({
  measurements,
  onDelete,
  onDeleteAll,
  onToggleVisible,
  onToggleAllVisible,
  onClose,
}: Props) => {
  const allVisible = measurements.every((m) => m.visible);
  const someVisible = measurements.some((m) => m.visible);

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
        {/* Header */}
        <div className="h-5 shrink-0 border-b border-zinc-400 dark:border-zinc-600 flex items-center px-3 gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
            Measurements
          </span>
          {measurements.length > 0 && (
            <span className="text-[9px] tabular-nums text-zinc-500">
              ({measurements.length})
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {measurements.length > 0 && (
              <>
                {/* Toggle all visibility */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleAllVisible}
                      className={`transition-colors cursor-pointer ${allVisible || someVisible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'}`}
                    >
                      {allVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {allVisible ? 'Hide all' : 'Show all'}
                  </TooltipContent>
                </Tooltip>

                {/* Delete all */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onDeleteAll}
                      className="text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 size={10} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Clear all</TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Close */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <X size={10} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Close panel</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {measurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
              <Ruler size={14} className="text-zinc-500" />
              <span className="text-[9px] uppercase tracking-widest text-zinc-500">
                No measurements
              </span>
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {measurements.map((m, i) => (
                <div
                  key={m.id}
                  className={`flex items-center px-3 py-1.5 gap-2 group hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors ${!m.visible ? 'opacity-40' : ''}`}
                >
                  {/* Index */}
                  <span className="text-[9px] tabular-nums text-zinc-400 dark:text-zinc-600 w-4 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Distance */}
                  <span className="text-xs text-sky-600 dark:text-sky-300 tabular-nums font-mono flex-1">
                    {m.meters.toFixed(3)}
                    <span className="text-[9px] text-zinc-500 ml-1">m</span>
                  </span>

                  {/* cm */}
                  <span className="text-[9px] tabular-nums text-zinc-500 shrink-0">
                    {(m.meters * 100).toFixed(1)}cm
                  </span>

                  {/* Per-row visibility toggle */}
                  <button
                    onClick={() => onToggleVisible(m.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-zinc-200 cursor-pointer shrink-0"
                  >
                    {m.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-red-400 cursor-pointer shrink-0"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};
