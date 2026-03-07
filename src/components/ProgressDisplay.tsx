import type { ProgressEvent } from '../types';
import { VinylMergeAnimation } from './VinylMergeAnimation';

type Props = {
  progress: ProgressEvent;
  onCancel: () => void;
};

const STEP_LABELS: Record<string, string> = {
  downloading: 'Grabbing your tunes',
  separating: 'Taking the songs apart',
  analyzing: 'Studying the vibes',
  interpreting: 'Cooking up a plan',
  processing: 'Making things fit',
  rendering: 'Mixing it all together',
  complete: 'Done!',
};

const STEP_ORDER = ['downloading', 'separating', 'analyzing', 'interpreting', 'processing', 'rendering', 'complete'];

export function ProgressDisplay({ progress, onCancel }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.progress * 100)));
  const stepLabel = STEP_LABELS[progress.step] ?? progress.step;

  return (
    <div className="space-y-6 text-center">
      <VinylMergeAnimation progress={progress.progress} />

      <div>
        <p className="text-lg font-medium text-white">{stepLabel}</p>
        <p className="mt-1 text-sm text-gray-400">{progress.detail}</p>
      </div>

      <div className="space-y-2">
        {progress.step !== 'complete' && STEP_ORDER.includes(progress.step) && (
          <p className="text-xs text-gray-500 text-left">
            Step {STEP_ORDER.indexOf(progress.step) + 1} of {STEP_ORDER.length - 1}
          </p>
        )}

        <div className="relative h-5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
            {pct}%
          </span>
        </div>
      </div>

      <button
        className="text-sm text-gray-500 hover:text-gray-300 underline"
        onClick={onCancel}
      >
        Cancel
      </button>
    </div>
  );
}
