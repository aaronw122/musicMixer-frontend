import { useReducer, useCallback, useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation, type NavigateFunction } from 'react-router-dom';
import { MixProcess } from './MixProcess';
import { RemixPlayer } from './RemixPlayer';
import { ShareButton } from './ShareButton';
import { useRemixProgress } from '../hooks/useRemixProgress';
import {
  clearPersistedSelections,
  loadPersistedSelections,
  type PersistedSelections,
} from '../hooks/useFormPersistence';
import { getPublicRemix } from '../api/client';
import { formatCreateRemixError } from '../utils/remixErrors';
import { submitRemixSongs } from '../utils/remixSubmit';
import type {
  AppAction,
  ClientErrorSource,
  CreateRemixError,
  ErrorClass,
  FailedSong,
  ProgressEvent,
  RouteSongState,
  SongInput,
} from '../types';

type PagePhase =
  | { kind: 'loading' }
  | { kind: 'processing'; progress: ProgressEvent }
  | { kind: 'ready'; explanation: string; warnings: string[]; usedFallback: boolean; keyWarning?: string }
  | {
      kind: 'error';
      message: string;
      errorClass?: ErrorClass;
      failedSong?: FailedSong;
      source?: ClientErrorSource;
    };

type RemixRouteState = {
  creator?: boolean;
  songA?: RouteSongState;
  songB?: RouteSongState;
  autoRetryAttempt?: number;
} | null;

type RetryResult =
  | { ok: true; sessionId: string; selections: PersistedSelections }
  | { ok: false; message: string; source: ClientErrorSource };

type RetryOptions = {
  autoRetryAttempt?: number;
};

function pageReducer(state: PagePhase, action: AppAction): PagePhase {
  switch (action.type) {
    case 'START_PROCESSING':
      return { kind: 'processing', progress: action.progress };

    case 'START_LISTENING':
      return { kind: 'loading' };

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
        source: action.source,
      };

    default:
      return state;
  }
}

function creatorInitialProgress(songA?: RouteSongState, songB?: RouteSongState): ProgressEvent {
  if (songA?.type === 'youtube' && songB?.type === 'youtube') {
    return { step: 'downloading', detail: 'Starting download...', progress: 0.02 };
  }
  return { step: 'separating', detail: 'Starting pipeline...', progress: 0.02 };
}

function isTransient(errorClass?: ErrorClass): boolean {
  return errorClass === 'transient';
}

function isRetryableClientError(source?: ClientErrorSource): boolean {
  return source === 'timeout' || source === 'connection' || source === 'retry-submit';
}

function canRetryCreatorError(state: Extract<PagePhase, { kind: 'error' }>): boolean {
  if (isRetryableClientError(state.source)) return true;
  return isTransient(state.errorClass);
}

function songLabel(slot: FailedSong): string {
  return slot === 'A' ? 'the first song' : 'the second song';
}

function getCreatorErrorCopy(state: Extract<PagePhase, { kind: 'error' }>) {
  if (isRetryableClientError(state.source)) {
    return {
      heading: 'That did not go through',
      body: `${state.message} Your songs are saved, so you can try again without reselecting them.`,
    };
  }

  if (state.source === 'retry-unavailable') {
    return {
      heading: 'Pick your songs again',
      body: state.message,
    };
  }

  if (isTransient(state.errorClass)) {
    return {
      heading: 'That did not go through',
      body: state.failedSong
        ? `Loading ${songLabel(state.failedSong)} hit a temporary snag. Your songs are saved, so you can try again.`
        : 'A temporary snag interrupted your remix. Your songs are saved, so you can try again.',
    };
  }

  return {
    heading: state.failedSong ? `We could not use ${songLabel(state.failedSong)}` : 'Something went wrong',
    body: state.failedSong
      ? `That video appears to be unavailable. Swap ${songLabel(state.failedSong)} for another and try again.`
      : `${state.message} Your songs are still saved if you want to pick new inputs and try again.`,
  };
}

function toRouteSongState(song: SongInput | null): RouteSongState | undefined {
  if (!song) return undefined;
  if (song.type === 'youtube') {
    return {
      type: 'youtube',
      url: song.url,
      title: song.title,
      thumbnailUrl: song.thumbnailUrl,
    };
  }
  return { type: 'file' };
}

async function createRetrySessionFromSelections(selections: PersistedSelections): Promise<RetryResult> {
  const { songA, songB } = selections;
  if (!songA || !songB) {
    return {
      ok: false,
      message: 'Your saved songs are no longer available. Please pick them again.',
      source: 'retry-unavailable',
    };
  }

  try {
    const result = await submitRemixSongs(songA, songB);
    if (result.ok) {
      return { ok: true, sessionId: result.sessionId, selections };
    }
  } catch (error) {
    const remixError = error as CreateRemixError;
    return {
      ok: false,
      message: formatCreateRemixError(remixError),
      source: sourceForRetrySubmitError(remixError),
    };
  }

  return {
    ok: false,
    message: 'This saved song combination cannot be retried automatically. Please pick the songs again.',
    source: 'retry-unavailable',
  };
}

function sourceForRetrySubmitError(error: CreateRemixError): ClientErrorSource {
  if (error.type === 'network') return 'connection';
  if (error.type === 'timeout') return 'timeout';
  if (error.status === 429 || error.status >= 500) return 'retry-submit';
  return 'retry-unavailable';
}

function useClearSelectionsOnCreatorSuccess(state: PagePhase, isCreator: boolean) {
  useEffect(() => {
    if (state.kind === 'ready' && isCreator) {
      clearPersistedSelections().catch(() => {});
    }
  }, [state.kind, isCreator]);
}

function useCreatorRetry(
  sessionId: string | undefined,
  navigate: NavigateFunction,
  dispatch: React.Dispatch<AppAction>,
  retryingSessionId: string | null,
  setRetryingSessionId: React.Dispatch<React.SetStateAction<string | null>>,
) {
  return useCallback(async (options?: RetryOptions) => {
    if (!sessionId) return;
    const retrying = retryingSessionId === sessionId;
    if (retrying) return;
    setRetryingSessionId(sessionId);

    const result = await createRetrySessionFromSelections(await loadPersistedSelections());
    if (result.ok) {
      navigate(`/remix/${result.sessionId}`, {
        state: {
          creator: true,
          songA: toRouteSongState(result.selections.songA),
          songB: toRouteSongState(result.selections.songB),
          autoRetryAttempt: options?.autoRetryAttempt,
        },
      });
      return;
    }

    setRetryingSessionId(null);
    dispatch({
      type: 'ERROR',
      message: result.message,
      source: result.source,
    });
  }, [dispatch, navigate, retryingSessionId, sessionId, setRetryingSessionId]);
}

function ExpiredState({ onGoHome }: { onGoHome: () => void }) {
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
        onClick={onGoHome}
      >
        Create Your Own Remix
      </button>
    </div>
  );
}

function ListenerErrorState({ message, onGoHome }: { message: string; onGoHome: () => void }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6">
        <p className="text-red-300">{message}</p>
      </div>
      <button
        className="rounded-lg bg-gray-700 px-6 py-2 text-sm text-gray-300 hover:bg-gray-600"
        onClick={onGoHome}
      >
        Create Your Own Remix
      </button>
    </div>
  );
}

function CreatorErrorState({
  state,
  retrying,
  onRetry,
  onGoHome,
}: {
  state: Extract<PagePhase, { kind: 'error' }>;
  retrying: boolean;
  onRetry: () => void;
  onGoHome: () => void;
}) {
  const retryable = canRetryCreatorError(state);
  const { heading, body } = getCreatorErrorCopy(state);
  const fallbackLabel = state.failedSong ? 'Pick Another Video' : 'Pick Songs Again';

  return (
    <div className="text-center space-y-4 py-4">
      <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6 space-y-2">
        <p className="text-red-200 font-medium">{heading}</p>
        <p className="text-sm text-red-300/90">{body}</p>
        {!retryable && !state.failedSong && (
          <p className="text-xs text-red-300/60">{state.message}</p>
        )}
      </div>
      <button
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
        onClick={retryable ? onRetry : onGoHome}
        disabled={retrying}
      >
        {retryable ? (retrying ? 'Retrying...' : 'Try Again') : fallbackLabel}
      </button>
    </div>
  );
}

export function RemixPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as RemixRouteState;
  const isCreator = !!routeState?.creator;
  const routeSongA = routeState?.songA;
  const routeSongB = routeState?.songB;
  const autoRetryAttempt = routeState?.autoRetryAttempt ?? 0;

  const [state, dispatch] = useReducer(pageReducer, undefined, (): PagePhase => (
    isCreator
      ? { kind: 'processing', progress: creatorInitialProgress(routeSongA, routeSongB) }
      : { kind: 'loading' }
  ));

  const [expiresAtBySessionId, setExpiresAtBySessionId] = useState<Record<string, string>>({});
  const [expiredSessionId, setExpiredSessionId] = useState<string | null>(null);
  const [retryingSessionId, setRetryingSessionId] = useState<string | null>(null);
  const lastAutoRetriedSessionIdRef = useRef<string | null>(null);

  const goHome = useCallback(() => navigate('/'), [navigate]);
  const retrying = retryingSessionId === sessionId;
  const handleRetry = useCreatorRetry(
    sessionId,
    navigate,
    dispatch,
    retryingSessionId,
    setRetryingSessionId,
  );

  useEffect(() => {
    if (!sessionId) return;

    dispatch(
      isCreator
        ? {
            type: 'START_PROCESSING',
            progress: creatorInitialProgress(routeSongA, routeSongB),
          }
        : { type: 'START_LISTENING' },
    );
  }, [isCreator, routeSongA, routeSongB, sessionId]);

  useEffect(() => {
    if (isCreator || state.kind !== 'loading' || !sessionId) return;

    let cancelled = false;
    getPublicRemix(sessionId).then(({ status, data }) => {
      if (cancelled) return;

      if (status === 200 && data) {
        setExpiresAtBySessionId((current) => ({
          ...current,
          [sessionId]: data.expires_at,
        }));
        dispatch({
          type: 'REMIX_READY',
          explanation: data.explanation,
          warnings: data.warnings,
          usedFallback: data.usedFallback,
        });
      } else if (status === 202) {
        dispatch({
          type: 'PROGRESS_EVENT',
          event: { step: 'processing', detail: 'Your remix is being created...', progress: 0.1 },
        });
      } else if (status === 410) {
        setExpiredSessionId(sessionId);
      } else {
        dispatch({ type: 'ERROR', message: 'This remix is no longer available.' });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isCreator, sessionId, state.kind]);

  useRemixProgress(
    state.kind === 'processing' && sessionId ? sessionId : null,
    dispatch,
  );

  useClearSelectionsOnCreatorSuccess(state, isCreator);

  useEffect(() => {
    if (
      state.kind === 'error' &&
      isCreator &&
      sessionId &&
      isTransient(state.errorClass) &&
      !state.source &&
      lastAutoRetriedSessionIdRef.current !== sessionId &&
      autoRetryAttempt < 1 &&
      !retrying
    ) {
      lastAutoRetriedSessionIdRef.current = sessionId;
      handleRetry({ autoRetryAttempt: autoRetryAttempt + 1 });
    }
  }, [autoRetryAttempt, handleRetry, isCreator, retrying, sessionId, state]);

  if (!sessionId) return null;

  const expiresAt = expiresAtBySessionId[sessionId];

  const mixedRecord = {
    leftThumbnailUrl: routeSongA?.type === 'youtube' ? routeSongA.thumbnailUrl : undefined,
    rightThumbnailUrl: routeSongB?.type === 'youtube' ? routeSongB.thumbnailUrl : undefined,
  };

  if (expiredSessionId === sessionId) {
    return <ExpiredState onGoHome={goHome} />;
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
        <MixProcess
          songA={routeSongA}
          songB={routeSongB}
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
            skipPlacement={isCreator}
            mixedRecord={mixedRecord}
          />
        </div>
      );

    case 'error':
      if (!isCreator) {
        return <ListenerErrorState message={state.message} onGoHome={goHome} />;
      }
      return (
        <CreatorErrorState
          state={state}
          retrying={retrying}
          onRetry={handleRetry}
          onGoHome={goHome}
        />
      );
  }
}
