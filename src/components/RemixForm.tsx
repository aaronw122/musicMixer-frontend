import { useCallback } from 'react';
import { SongUpload } from './SongUpload';
import { PromptInput } from './PromptInput';
import type { AppAction, SongInput } from '../types';

type Props = {
  songA: SongInput | null;
  songB: SongInput | null;
  prompt: string;
  dispatch: React.Dispatch<AppAction>;
  submitting?: boolean;
  uploadProgress?: number;
};

/** True when both slots have YouTube URLs (no file uploads). */
function isBothYouTube(a: SongInput | null, b: SongInput | null): boolean {
  return a?.type === 'youtube' && b?.type === 'youtube';
}

/** True when at least one slot has a YouTube URL. */
function hasAnyYouTube(a: SongInput | null, b: SongInput | null): boolean {
  return a?.type === 'youtube' || b?.type === 'youtube';
}

/** True when all non-null inputs are files (for upload flow). */
function isAllFiles(a: SongInput | null, b: SongInput | null): boolean {
  return (
    (a === null || a.type === 'file') &&
    (b === null || b.type === 'file')
  );
}

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

  const handleSubmit = useCallback(() => {
    if (!songA || !songB) return;

    // Both YouTube URLs -> use YouTube submit flow
    if (isBothYouTube(songA, songB)) {
      dispatch({ type: 'START_SUBMIT' });
      return;
    }

    // Both files -> use file upload flow
    if (isAllFiles(songA, songB)) {
      dispatch({ type: 'START_UPLOAD' });
      return;
    }

    // Mixed input not supported in v1 -- should not reach here due to canSubmit logic,
    // but handle gracefully
    dispatch({ type: 'START_UPLOAD' });
  }, [songA, songB, dispatch]);

  // v1: mixed input (one file + one YouTube) is not supported
  const hasMixedInput =
    songA !== null &&
    songB !== null &&
    hasAnyYouTube(songA, songB) &&
    !isBothYouTube(songA, songB);

  const effectiveCanSubmit = canSubmit && !hasMixedInput;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SongUpload
          label="Song A"
          song={songA}
          onFileChange={(f) => dispatch({ type: 'SET_SONG_A', file: f })}
          onYouTubeUrl={(url, title, thumbnailUrl) =>
            dispatch({ type: 'SET_YOUTUBE_URL_A', url, title, thumbnailUrl })
          }
          onClear={() => dispatch({ type: 'CLEAR_SONG_A' })}
          disabled={submitting}
        />
        <SongUpload
          label="Song B"
          song={songB}
          onFileChange={(f) => dispatch({ type: 'SET_SONG_B', file: f })}
          onYouTubeUrl={(url, title, thumbnailUrl) =>
            dispatch({ type: 'SET_YOUTUBE_URL_B', url, title, thumbnailUrl })
          }
          onClear={() => dispatch({ type: 'CLEAR_SONG_B' })}
          disabled={submitting}
        />
      </div>

      {/* Quality info when both songs are YouTube-sourced */}
      {isBothYouTube(songA, songB) && (
        <p className="text-xs text-amber-400/80 text-center">
          For best remix quality, upload high-quality audio files (WAV or 320kbps MP3)
          when available
        </p>
      )}

      {/* Mixed input warning */}
      {hasMixedInput && (
        <p className="text-xs text-amber-400/80 text-center">
          Both songs must use the same input method. Use either two files or two YouTube
          links.
        </p>
      )}

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
          effectiveCanSubmit
            ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer'
            : 'bg-gray-700 cursor-not-allowed text-gray-500'
        }`}
        disabled={!effectiveCanSubmit}
        onClick={handleSubmit}
      >
        {submitting ? 'Submitting...' : 'Create Remix'}
      </button>

      {!effectiveCanSubmit && songA && songB && !hasMixedInput && prompt.trim().length < 5 && (
        <p className="text-xs text-gray-500 text-center">
          Prompt must be at least 5 characters
        </p>
      )}
    </div>
  );
}
