import { useReducer, useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ProgressDisplay } from './ProgressDisplay';
import { RemixPlayer } from './RemixPlayer';
import { ShareButton } from './ShareButton';
import { useRemixProgress } from '../hooks/useRemixProgress';
import { getPublicRemix } from '../api/client';
import type { AppAction, ProgressEvent } from '../types';

type PagePhase =
  | { kind: 'loading' }
  | { kind: 'processing'; progress: ProgressEvent }
  | { kind: 'ready'; explanation: string; warnings: string[]; usedFallback: boolean; keyWarning?: string }
  | { kind: 'expired' }
  | { kind: 'error'; message: string };

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
      return { kind: 'error', message: action.message };

    default:
      return state;
  }
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

  const goHome = useCallback(() => navigate('/'), [navigate]);

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
        <div className="space-y-4">
          <div className="flex justify-end">
            <ShareButton sessionId={sessionId} />
          </div>
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
        </div>
      );

    case 'expired':
      return null; // Handled by expired flag above

    case 'error':
      return (
        <div className="text-center space-y-4 py-4">
          <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6">
            <p className="text-red-300">{state.message}</p>
          </div>
          <button
            className="rounded-lg bg-gray-700 px-6 py-2 text-sm text-gray-300 hover:bg-gray-600"
            onClick={goHome}
          >
            {isCreator ? 'Try Again' : 'Create Your Own Remix'}
          </button>
        </div>
      );
  }
}
