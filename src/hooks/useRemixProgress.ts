import { useEffect, useRef } from 'react';
import { connectProgress } from '../api/client';
import type { AppAction, ProgressEvent } from '../types';

const TIMEOUT_BY_STEP: Record<string, number> = {
  separating: 180_000, // 3 minutes (cold start + separation)
  analyzing: 60_000,
  interpreting: 60_000,
  processing: 120_000,
  rendering: 120_000,
};
const DEFAULT_TIMEOUT = 120_000;

export function useRemixProgress(
  sessionId: string | null,
  dispatch: React.Dispatch<AppAction>,
) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorCountRef = useRef(0);
  const currentStepRef = useRef<string>('separating');

  useEffect(() => {
    if (!sessionId) return;

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const ms = TIMEOUT_BY_STEP[currentStepRef.current] ?? DEFAULT_TIMEOUT;
      timeoutRef.current = setTimeout(() => {
        dispatch({
          type: 'ERROR',
          message: 'Processing is taking longer than expected. Please try again.',
        });
        eventSourceRef.current?.close();
      }, ms);
    };

    const es = connectProgress(sessionId);
    eventSourceRef.current = es;
    errorCountRef.current = 0;

    es.onmessage = (event) => {
      errorCountRef.current = 0; // Reset on any successful message
      try {
        const data: ProgressEvent = JSON.parse(event.data);

        // Keepalive -- reset timeout but don't update UI
        if (data.step === 'keepalive') {
          resetTimeout();
          return;
        }

        currentStepRef.current = data.step;
        resetTimeout();

        if (data.step === 'complete') {
          dispatch({
            type: 'REMIX_READY',
            explanation: data.explanation ?? '',
            warnings: data.warnings ?? [],
            usedFallback: data.usedFallback ?? false,
          });
          es.close();
          return;
        }

        if (data.step === 'error') {
          dispatch({ type: 'ERROR', message: data.detail || 'Something went wrong.' });
          es.close();
          return;
        }

        dispatch({ type: 'PROGRESS_EVENT', event: data });
      } catch {
        // Malformed event -- log and ignore
        console.warn('Malformed SSE event:', event.data);
      }
    };

    es.onerror = () => {
      errorCountRef.current++;
      if (errorCountRef.current >= 5) {
        dispatch({
          type: 'ERROR',
          message: 'Lost connection to the server. Please try again.',
        });
        es.close();
      }
      // Otherwise let EventSource auto-reconnect
    };

    resetTimeout();

    return () => {
      es.close();
      eventSourceRef.current = null;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [sessionId, dispatch]);
}
