import { SongUpload } from './SongUpload';
import { PromptInput } from './PromptInput';
import type { AppAction } from '../types';

type Props = {
  songA: File | null;
  songB: File | null;
  prompt: string;
  dispatch: React.Dispatch<AppAction>;
  submitting?: boolean;
  uploadProgress?: number;
};

export function RemixForm({
  songA,
  songB,
  prompt,
  dispatch,
  submitting,
  uploadProgress,
}: Props) {
  const canSubmit =
    songA !== null && songB !== null && prompt.trim().length >= 5 && !submitting;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SongUpload
          label="Song A"
          file={songA}
          onFileChange={(f) => dispatch({ type: 'SET_SONG_A', file: f })}
          disabled={submitting}
        />
        <SongUpload
          label="Song B"
          file={songB}
          onFileChange={(f) => dispatch({ type: 'SET_SONG_B', file: f })}
          disabled={submitting}
        />
      </div>

      <PromptInput
        value={prompt}
        onChange={(p) => dispatch({ type: 'SET_PROMPT', prompt: p })}
        disabled={submitting}
      />

      {submitting && uploadProgress !== undefined && (
        <div className="space-y-1">
          <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">Uploading... {uploadProgress}%</p>
        </div>
      )}

      <button
        className={`w-full rounded-lg py-3 px-6 font-semibold text-white transition-colors ${
          canSubmit
            ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
            : 'bg-gray-700 cursor-not-allowed text-gray-500'
        }`}
        disabled={!canSubmit}
        onClick={() => dispatch({ type: 'START_UPLOAD' })}
      >
        {submitting ? 'Uploading...' : 'Create Remix'}
      </button>

      {!canSubmit && songA && songB && prompt.trim().length < 5 && (
        <p className="text-xs text-gray-500 text-center">
          Prompt must be at least 5 characters
        </p>
      )}
    </div>
  );
}
