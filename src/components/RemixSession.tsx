import { useReducer, useCallback, useEffect } from 'react';
import { remixReducer, initialState } from '../hooks/useRemixReducer';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { DJBoard } from './DJBoard';
import { InputDeck } from './InputDeck';
import { MixButton } from './MixButton';
import { MergeTransition } from './MergeTransition';
import { RemixPlayer } from './RemixPlayer';
import { createRemix, submitYouTubeRemix } from '../api/client';
import { useRemixProgress } from '../hooks/useRemixProgress';
import type { CreateRemixError, SongInput } from '../types';

function formatError(error: CreateRemixError): string {
  switch (error.type) {
    case 'network':
      return 'Request failed. Check your connection and try again.';
    case 'timeout':
      return 'Request timed out. Please try again.';
    case 'http':
      if (error.status === 429) {
        return 'Another remix is being created. Please wait and try again.';
      } else if (error.status === 413) {
        return error.body.detail || 'File too large. Maximum 50MB per song.';
      } else if (error.status === 422) {
        return error.body.detail || 'Invalid input. Please check your uploads.';
      } else {
        return error.body.detail || 'Something went wrong. Please try again.';
      }
    default:
      return 'Something went wrong. Please try again.';
  }
}

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

type SessionProps = {
  onSessionReady?: (sessionId: string | null) => void;
};

export function RemixSession({ onSessionReady }: SessionProps) {
  const [state, dispatch] = useReducer(remixReducer, initialState);
  useFormPersistence(state, dispatch);

  // Notify parent when remix is ready (or cleared)
  useEffect(() => {
    onSessionReady?.(state.phase === 'ready' ? state.sessionId : null);
  }, [state.phase, state.phase === 'ready' ? state.sessionId : null, onSessionReady]);

  // Handle file upload submission
  const handleUpload = useCallback(async () => {
    if (state.phase !== 'uploading') return;
    if (state.songA.type !== 'file' || state.songB.type !== 'file') return;

    try {
      const response = await createRemix(
        state.songA.file,
        state.songB.file,
        (pct) => dispatch({ type: 'UPLOAD_PROGRESS', percent: pct }),
      );
      dispatch({ type: 'UPLOAD_SUCCESS', sessionId: response.session_id });
    } catch (err) {
      dispatch({ type: 'ERROR', message: formatError(err as CreateRemixError) });
    }
  }, [state]);

  // Handle YouTube URL submission
  const handleYouTubeSubmit = useCallback(async () => {
    if (state.phase !== 'submitting') return;
    if (state.songA.type !== 'youtube' || state.songB.type !== 'youtube') return;

    try {
      const response = await submitYouTubeRemix(
        state.songA.url,
        state.songB.url,
      );
      dispatch({ type: 'SUBMIT_SUCCESS', sessionId: response.session_id });
    } catch (err) {
      dispatch({ type: 'ERROR', message: formatError(err as CreateRemixError) });
    }
  }, [state]);

  // Trigger upload when entering uploading phase
  useEffect(() => {
    if (state.phase === 'uploading') {
      handleUpload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Trigger YouTube submit when entering submitting phase
  useEffect(() => {
    if (state.phase === 'submitting') {
      handleYouTubeSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // SSE progress connection
  useRemixProgress(
    state.phase === 'processing' ? state.sessionId : null,
    dispatch,
  );

  // Derive submit handler (same logic as RemixForm)
  const handleSubmit = useCallback(() => {
    if (state.phase !== 'idle') return;
    const { songA, songB } = state;
    if (!songA || !songB) return;

    if (isBothYouTube(songA, songB)) {
      dispatch({ type: 'START_SUBMIT' });
      return;
    }

    if (isAllFiles(songA, songB)) {
      dispatch({ type: 'START_UPLOAD' });
      return;
    }

    // Mixed input fallback
    dispatch({ type: 'START_UPLOAD' });
  }, [state]);

  // Derive UI state
  const songA = 'songA' in state ? state.songA : null;
  const songB = 'songB' in state ? state.songB : null;
  const bothLoaded = songA !== null && songB !== null;
  const hasMixedInput =
    bothLoaded &&
    hasAnyYouTube(songA, songB) &&
    !isBothYouTube(songA, songB);
  const canMix = bothLoaded && !hasMixedInput;

  switch (state.phase) {
    case 'idle':
      return (
        <DJBoard
          deckA={
            <InputDeck
              deckId="a"
              label="Grab vocals from..."
              song={state.songA}
              dispatch={dispatch}
            />
          }
          deckB={
            <InputDeck
              deckId="b"
              label="Use instrumentals from..."
              song={state.songB}
              dispatch={dispatch}
            />
          }
          mixControls={
            <div className="flex flex-col items-center gap-3">
              <MixButton
                canMix={canMix}
                submitting={false}
                onClick={handleSubmit}
              />
              {/* Quality info when both songs are YouTube-sourced */}
              {isBothYouTube(songA, songB) && (
                <p className="text-[10px] text-amber-400/60 text-center max-w-[140px]">
                  For best quality, upload audio files
                </p>
              )}
              {/* Mixed input warning */}
              {hasMixedInput && (
                <p className="text-[10px] text-amber-400/60 text-center max-w-[140px]">
                  Both songs must use the same input method
                </p>
              )}
            </div>
          }
        />
      );

    case 'uploading':
      return (
        <DJBoard
          deckA={
            <InputDeck
              deckId="a"
              label="Grab vocals from..."
              song={state.songA}
              dispatch={dispatch}
              disabled
            />
          }
          deckB={
            <InputDeck
              deckId="b"
              label="Use instrumentals from..."
              song={state.songB}
              dispatch={dispatch}
              disabled
            />
          }
          mixControls={
            <MixButton canMix={false} submitting={true} onClick={() => {}} />
          }
        >
          {/* Upload progress bar below the board */}
          <div className="w-full max-w-md mx-auto space-y-1">
            <div className="h-2 rounded-full bg-black/30 overflow-hidden border border-amber-900/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                style={{ width: `${state.uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-amber-200/40 text-center">
              Uploading... {state.uploadProgress}%
            </p>
          </div>
        </DJBoard>
      );

    case 'submitting':
      return (
        <DJBoard
          deckA={
            <InputDeck
              deckId="a"
              label="Grab vocals from..."
              song={state.songA}
              dispatch={dispatch}
              disabled
            />
          }
          deckB={
            <InputDeck
              deckId="b"
              label="Use instrumentals from..."
              song={state.songB}
              dispatch={dispatch}
              disabled
            />
          }
          mixControls={
            <MixButton canMix={false} submitting={true} onClick={() => {}} />
          }
        >
          <p className="text-sm text-amber-200/40 text-center">
            Submitting your songs...
          </p>
        </DJBoard>
      );

    case 'processing':
      return (
        <DJBoard
          centerContent={
            <div className="w-full max-w-2xl mx-auto py-4">
              <MergeTransition
                songA={state.songA}
                songB={state.songB}
                progress={state.progress}
                sessionId={state.sessionId}
                onCancel={() => dispatch({ type: 'CANCEL' })}
              />
            </div>
          }
        />
      );

    case 'ready':
      return (
        <DJBoard
          centerContent={
            <div className="w-full max-w-2xl mx-auto py-4">
              <RemixPlayer
                sessionId={state.sessionId}
                explanation={state.explanation}
                warnings={state.warnings}
                usedFallback={state.usedFallback}
                keyWarning={state.keyWarning}
                onNewRemix={() => dispatch({ type: 'RESET' })}
              />
            </div>
          }
        />
      );

    case 'error':
      return (
        <DJBoard
          centerContent={
            <div className="w-full max-w-md mx-auto text-center space-y-4 py-4">
              <div className="rounded-lg border border-amber-700/50 bg-amber-950/25 p-6">
                <p className="text-amber-200/80">{state.message}</p>
              </div>
              <button
                className="rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 px-6 py-3 text-sm font-medium text-amber-50 hover:from-amber-500 hover:to-amber-700 transition-colors min-h-[44px]"
                onClick={() => dispatch({ type: 'RETRY' })}
              >
                Try Again
              </button>
            </div>
          }
        />
      );
  }
}
