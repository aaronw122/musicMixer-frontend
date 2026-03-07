import { useReducer, useCallback, useEffect } from 'react';
import { remixReducer, initialState } from '../hooks/useRemixReducer';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { RemixForm } from './RemixForm';
import { ProgressDisplay } from './ProgressDisplay';
import { RemixPlayer } from './RemixPlayer';
import { createRemix, submitYouTubeRemix } from '../api/client';
import { useRemixProgress } from '../hooks/useRemixProgress';
import type { CreateRemixError } from '../types';

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

  switch (state.phase) {
    case 'idle':
      return (
        <RemixForm
          songA={state.songA}
          songB={state.songB}
          dispatch={dispatch}
        />
      );

    case 'uploading':
      return (
        <RemixForm
          songA={state.songA}
          songB={state.songB}
          dispatch={dispatch}
          submitting={true}
          uploadProgress={state.uploadProgress}
        />
      );

    case 'submitting':
      return (
        <RemixForm
          songA={state.songA}
          songB={state.songB}
          dispatch={dispatch}
          submitting={true}
        />
      );

    case 'processing':
      return (
        <ProgressDisplay
          progress={state.progress}
          sessionId={state.sessionId}
          onCancel={() => dispatch({ type: 'CANCEL' })}
        />
      );

    case 'ready':
      return (
        <RemixPlayer
          sessionId={state.sessionId}
          explanation={state.explanation}
          warnings={state.warnings}
          usedFallback={state.usedFallback}
          keyWarning={state.keyWarning}
          onNewRemix={() => dispatch({ type: 'RESET' })}
        />
      );

    case 'error':
      return (
        <div className="text-center space-y-4">
          <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6">
            <p className="text-red-300">{state.message}</p>
          </div>
          <button
            className="rounded-lg bg-gray-700 px-6 py-2 text-sm text-gray-300 hover:bg-gray-600"
            onClick={() => dispatch({ type: 'RETRY' })}
          >
            Try Again
          </button>
        </div>
      );
  }
}
