import type { ProgressEvent } from '../types';
import { VinylMergeAnimation } from './VinylMergeAnimation';

type Props = {
  progress: ProgressEvent;
  onCancel: () => void;
};

const STEP_LABELS: Record<string, string> = {
  downloading: 'Downloading from YouTube',
  separating: 'Extracting stems',
  analyzing: 'Analyzing audio',
  interpreting: 'Planning your remix',
  processing: 'Processing audio',
  rendering: 'Building your remix',
};

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
        <div className="h-3 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500">{pct}%</p>
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
