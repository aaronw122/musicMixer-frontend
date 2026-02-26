import { useReducer, useCallback, useEffect } from 'react';
import { remixReducer, initialState } from '../hooks/useRemixReducer';
import { RemixForm } from './RemixForm';
import { ProgressDisplay } from './ProgressDisplay';
import { RemixPlayer } from './RemixPlayer';
import { createRemix } from '../api/client';
import { useRemixProgress } from '../hooks/useRemixProgress';
import type { CreateRemixError } from '../types';

export function RemixSession() {
  const [state, dispatch] = useReducer(remixReducer, initialState);

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (state.phase !== 'uploading') return;

    try {
      const response = await createRemix(
        state.songA,
        state.songB,
        state.prompt,
        (pct) => dispatch({ type: 'UPLOAD_PROGRESS', percent: pct }),
      );
      dispatch({ type: 'UPLOAD_SUCCESS', sessionId: response.session_id });
    } catch (err) {
      const error = err as CreateRemixError;
      let message: string;
      switch (error.type) {
        case 'network':
          message = 'Upload failed. Check your connection and try again.';
          break;
        case 'timeout':
          message = 'Upload timed out. Please try again.';
          break;
        case 'http':
          if (error.status === 429) {
            message = 'Another remix is being created. Please wait and try again.';
          } else if (error.status === 413) {
            message = 'File too large. Maximum 50MB per song.';
          } else if (error.status === 422) {
            message = error.body.detail || 'Invalid file. Please check your uploads.';
          } else {
            message = 'Something went wrong. Please try again.';
          }
          break;
        default:
          message = 'Something went wrong. Please try again.';
      }
      dispatch({ type: 'ERROR', message });
    }
  }, [state]);

  // Trigger upload when entering uploading phase
  useEffect(() => {
    if (state.phase === 'uploading') {
      handleSubmit();
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
          prompt={state.prompt}
          dispatch={dispatch}
        />
      );

    case 'uploading':
      return (
        <RemixForm
          songA={state.songA}
          songB={state.songB}
          prompt={state.prompt}
          dispatch={dispatch}
          submitting={true}
          uploadProgress={state.uploadProgress}
        />
      );

    case 'processing':
      return (
        <ProgressDisplay
          progress={state.progress}
          onCancel={() => dispatch({ type: 'RESET' })}
        />
      );

    case 'ready':
      return (
        <RemixPlayer
          sessionId={state.sessionId}
          explanation={state.explanation}
          warnings={state.warnings}
          usedFallback={state.usedFallback}
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
            onClick={() => dispatch({ type: 'RESET' })}
          >
            Try Again
          </button>
        </div>
      );
  }
}
