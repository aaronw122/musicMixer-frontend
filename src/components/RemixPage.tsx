import { useReducer, useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProgressDisplay } from './ProgressDisplay';
import { RemixPlayer } from './RemixPlayer';
import { useRemixProgress } from '../hooks/useRemixProgress';
import {
  clearPersistedSelections,
  loadPersistedSelections,
  type PersistedSelections,
} from '../hooks/useFormPersistence';
import { getPublicRemix, createRemix, submitYouTubeRemix } from '../api/client';
import type { AppAction, ProgressEvent, ErrorClass, FailedSong } from '../types';

type PagePhase =
  | { kind: 'loading' }
  | { kind: 'processing'; progress: ProgressEvent }
  | { kind: 'ready'; explanation: string; warnings: string[]; usedFallback: boolean; keyWarning?: string }
  | { kind: 'expired' }
  | { kind: 'error'; message: string; errorClass?: ErrorClass; failedSong?: FailedSong };

/**
 * Reducer compatible with AppAction (so useRemixProgress can dispatch into it).
 * REMIX_READY is accepted from both loading and processing — the listener flow
 * may resolve the public endpoint before SSE connects, so we allow the direct
 * loading → ready transition.
 */
function pageReducer(state: PagePhase, action: AppAction): PagePhase {
  switch (action.type) {
    case 'PROGRESS_EVENT':
      if (state.kind === 'loading') {
        return { kind: 'processing', progress: action.event };
      }
      if (state.kind !== 'processing') return state;
      return { ...state, progress: action.event };

    case 'REMIX_READY':
      if (state.kind !== 'processing' && state.kind !== 'loading') return state;
      return {
        kind: 'ready',
        explanation: action.explanation,
        warnings: action.warnings,
        usedFallback: action.usedFallback,
        keyWarning: action.keyWarning,
      };

    case 'ERROR':
      return {
        kind: 'error',
        message: action.message,
        errorClass: action.errorClass,
        failedSong: action.failedSong,
      };

    default:
      return state;
  }
}

// Missing error_class → treat as permanent (don't auto-retry something we
// can't prove is transient).
function isTransient(errorClass?: ErrorClass): boolean {
  return errorClass === 'transient';
}

function songLabel(slot: FailedSong): string {
  return slot === 'A' ? 'the first song' : 'the second song';
}

export function RemixPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isCreator = !!(location.state as { creator?: boolean } | null)?.creator;

  const [state, dispatch] = useReducer(pageReducer, undefined, (): PagePhase => {
    if (isCreator) {
      return {
        kind: 'processing',
        progress: { step: 'separating', detail: 'Starting pipeline...', progress: 0.02 },
      };
    }
    return { kind: 'loading' };
  });

  // Track expiresAt separately (not part of AppAction)
  const [expiresAt, setExpiresAt] = useState<string | undefined>();
  const [expired, setExpired] = useState(false);

  // Retry state (creator-only). Selections are loaded lazily from persistence
  // when an error surfaces — the route only carries { creator } and drops the
  // uploaded File, so IndexedDB/sessionStorage is the source of truth.
  const [retrying, setRetrying] = useState(false);
  // One silent auto-retry per session for transient failures.
  const autoRetriedRef = useRef(false);

  // Listener flow: check session status via public endpoint
  useEffect(() => {
    if (isCreator || state.kind !== 'loading' || !sessionId) return;

    getPublicRemix(sessionId).then(({ status, data }) => {
      if (status === 200 && data) {
        setExpiresAt(data.expires_at);
        dispatch({
          type: 'REMIX_READY',
          explanation: data.explanation,
          warnings: data.warnings,
          usedFallback: data.usedFallback,
        });
      } else if (status === 202) {
        // Still processing — push to processing so SSE connects
        dispatch({
          type: 'PROGRESS_EVENT',
          event: { step: 'processing', detail: 'Your remix is being created...', progress: 0.1 },
        });
      } else if (status === 410) {
        setExpired(true);
      } else {
        dispatch({ type: 'ERROR', message: 'This remix is no longer available.' });
      }
    });
  }, [isCreator, sessionId, state.kind]);

  // SSE progress — connects when state is processing
  useRemixProgress(
    state.kind === 'processing' && sessionId ? sessionId : null,
    dispatch,
  );

  // Clear-on-success (M8). Relocated here because the 'ready' transition under
  // two-page routing happens on this component, not RemixSession. GATED on
  // isCreator — REMIX_READY fires for listeners too, and an ungated clear would
  // wipe a listener's own draft selections (real data loss). Only the creator's
  // observed success clears their persisted selections. Mid-mix navigation, tab
  // close, partial failure, and any listener view all KEEP selections.
  useEffect(() => {
    if (state.kind === 'ready' && isCreator) {
      clearPersistedSelections().catch(() => {});
    }
  }, [state.kind, isCreator]);

  const goHome = useCallback(() => navigate('/'), [navigate]);

  // Re-submit using the creator's preserved selections. Returns to a fresh
  // /remix/{newId} (still RemixPage) so the existing processing/SSE machinery
  // resumes. With backend caching a re-submit of the same videos is fast.
  const submitWithSelections = useCallback(
    async (selections: PersistedSelections): Promise<boolean> => {
      const { songA, songB } = selections;
      if (!songA || !songB) return false;
      try {
        let newId: string;
        if (songA.type === 'file' && songB.type === 'file') {
          const res = await createRemix(songA.file, songB.file);
          newId = res.session_id;
        } else if (songA.type === 'youtube' && songB.type === 'youtube') {
          const res = await submitYouTubeRemix(songA.url, songB.url);
          newId = res.session_id;
        } else {
          // Mixed file/youtube selection is not a supported submit path today.
          return false;
        }
        navigate(`/remix/${newId}`, { state: { creator: true } });
        return true;
      } catch {
        return false;
      }
    },
    [navigate],
  );

  const handleRetry = useCallback(async () => {
    if (retrying) return;
    setRetrying(true);
    const selections = await loadPersistedSelections();
    const ok = await submitWithSelections(selections);
    if (!ok) {
      // Couldn't recover selections (or submit failed) — fall back to the form
      // screen, which still has the persisted selections via useFormPersistence.
      setRetrying(false);
      navigate('/');
    }
  }, [retrying, submitWithSelections, navigate]);

  // One silent auto-retry for transient creator failures.
  useEffect(() => {
    if (
      state.kind === 'error' &&
      isCreator &&
      isTransient(state.errorClass) &&
      !autoRetriedRef.current &&
      !retrying
    ) {
      autoRetriedRef.current = true;
      // Intentional fire-once side effect on a transient creator failure.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleRetry();
    }
  }, [state, isCreator, retrying, handleRetry]);

  if (!sessionId) return null;

  if (expired) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-8">
          <h2 className="text-lg font-semibold text-white mb-2">Remix Expired</h2>
          <p className="text-sm text-gray-400">
            This remix has expired. Remixes are only available for about 3 hours after creation.
          </p>
        </div>
        <button
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
          onClick={goHome}
        >
          Create Your Own Remix
        </button>
      </div>
    );
  }

  switch (state.kind) {
    case 'loading':
      return (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-gray-400" />
          <p className="mt-4 text-sm text-gray-400">Loading remix...</p>
        </div>
      );

    case 'processing':
      return (
        <ProgressDisplay
          progress={state.progress}
          sessionId={sessionId}
          onCancel={goHome}
        />
      );

    case 'ready':
      return (
        <RemixPlayer
          sessionId={sessionId}
          explanation={state.explanation}
          warnings={state.warnings}
          usedFallback={state.usedFallback}
          keyWarning={state.keyWarning}
          expiresAt={expiresAt}
          onNewRemix={goHome}
          listenMode={!isCreator}
        />
      );

    case 'expired':
      return null; // Handled by expired flag above

    case 'error': {
      // Listener errors are terminal — they have no selections to retry.
      if (!isCreator) {
        return (
          <div className="text-center space-y-4 py-4">
            <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6">
              <p className="text-red-300">{state.message}</p>
            </div>
            <button
              className="rounded-lg bg-gray-700 px-6 py-2 text-sm text-gray-300 hover:bg-gray-600"
              onClick={goHome}
            >
              Create Your Own Remix
            </button>
          </div>
        );
      }

      const transient = isTransient(state.errorClass);
      const failed = state.failedSong;

      // Permanent failure → the video is unavailable, the user must pick
      // another. Transient → offer a fast one-tap retry that reuses the
      // preserved selections.
      const heading = transient
        ? 'That didn’t go through'
        : failed
          ? `We couldn’t use ${songLabel(failed)}`
          : 'We couldn’t use that video';

      const body = transient
        ? failed
          ? `Loading ${songLabel(failed)} hit a temporary snag. Your songs are saved — try again.`
          : 'A temporary snag interrupted your remix. Your songs are saved — try again.'
        : failed
          ? `That video appears to be unavailable. Swap ${songLabel(failed)} for another and try again — your other song is saved.`
          : 'That video appears to be unavailable. Pick another and try again — your songs are saved.';

      return (
        <div className="text-center space-y-4 py-4">
          <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6 space-y-2">
            <p className="text-red-200 font-medium">{heading}</p>
            <p className="text-sm text-red-300/90">{body}</p>
            {!transient && !state.failedSong && (
              <p className="text-xs text-red-300/60">{state.message}</p>
            )}
          </div>
          {transient ? (
            <button
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? 'Retrying…' : 'Try Again'}
            </button>
          ) : (
            <button
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
              onClick={goHome}
              disabled={retrying}
            >
              Pick Another Video
            </button>
          )}
        </div>
      );
    }
  }
}
