import { useEffect, useRef } from 'react';
import { connectProgress, getSessionStatus } from '../api/client';
import type { AppAction, ProgressEvent } from '../types';

const TIMEOUT_BY_STEP: Record<string, number> = {
  downloading: 120_000, // 2 minutes per song download
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
  const delayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorCountRef = useRef(0);
  const currentStepRef = useRef<string>('separating');
  // Track the highest progress value seen so the bar never goes backward
  // (e.g. YouTube flow: download reaches 0.45, then pipeline restarts at 0.10)
  const maxProgressRef = useRef(0);

  useEffect(() => {
    if (!sessionId) return;

    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      const ms = TIMEOUT_BY_STEP[currentStepRef.current] ?? DEFAULT_TIMEOUT;
      timeoutRef.current = setTimeout(async () => {
        // Before showing an error, check if the pipeline actually finished.
        // Mobile Safari suspends timers when backgrounded — the timeout can
        // fire immediately on return even though the backend completed fine.
        try {
          const status = await getSessionStatus(sessionId);
          if (status.status === 'complete' && status.last_event) {
            dispatch({
              type: 'PROGRESS_EVENT',
              event: { step: 'rendering', detail: 'Complete!', progress: 1.0 },
            });
            delayTimeoutRef.current = setTimeout(() => {
              dispatch({
                type: 'REMIX_READY',
                explanation: status.last_event?.explanation ?? '',
                warnings: status.last_event?.warnings ?? [],
                usedFallback: status.last_event?.usedFallback ?? false,
                keyWarning: status.last_event?.keyWarning,
              });
            }, 800);
            eventSourceRef.current?.close();
            return;
          }
          if (status.status === 'processing' || status.status === 'queued') {
            // Still running — reset timeout and let SSE continue
            resetTimeout();
            return;
          }
        } catch {
          // Status endpoint unreachable — fall through to error
        }
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
    maxProgressRef.current = 0;

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
          // Push animation to full merge/glow state
          dispatch({
            type: 'PROGRESS_EVENT',
            event: { step: 'rendering', detail: 'Complete!', progress: 1.0 },
          });
          // Delay transition to ready phase so the merge animation holds
          delayTimeoutRef.current = setTimeout(() => {
            dispatch({
              type: 'REMIX_READY',
              explanation: data.explanation ?? '',
              warnings: data.warnings ?? [],
              usedFallback: data.usedFallback ?? false,
              keyWarning: data.keyWarning,
            });
          }, 800);
          es.close();
          return;
        }

        if (data.step === 'error') {
          // Forward the structured-error fields (optional, pending backend).
          dispatch({
            type: 'ERROR',
            message: data.detail || 'Something went wrong.',
            errorClass: data.error_class,
            failedSong: data.failed_song,
          });
          es.close();
          return;
        }

        // Enforce monotonic progress: never let the bar go backward.
        // This handles the YouTube flow where download progress (0.05-0.45)
        // is followed by pipeline progress starting at 0.10.
        const monotonicProgress = Math.max(maxProgressRef.current, data.progress);
        maxProgressRef.current = monotonicProgress;

        dispatch({
          type: 'PROGRESS_EVENT',
          event: { ...data, progress: monotonicProgress },
        });
      } catch {
        // Malformed event -- log and ignore
        console.warn('Malformed SSE event:', event.data);
      }
    };

    es.onerror = async () => {
      errorCountRef.current++;
      if (errorCountRef.current >= 5) {
        // Before giving up, check if the pipeline finished while we were disconnected
        try {
          const status = await getSessionStatus(sessionId);
          if (status.status === 'complete' && status.last_event) {
            dispatch({
              type: 'PROGRESS_EVENT',
              event: { step: 'rendering', detail: 'Complete!', progress: 1.0 },
            });
            delayTimeoutRef.current = setTimeout(() => {
              dispatch({
                type: 'REMIX_READY',
                explanation: status.last_event?.explanation ?? '',
                warnings: status.last_event?.warnings ?? [],
                usedFallback: status.last_event?.usedFallback ?? false,
                keyWarning: status.last_event?.keyWarning,
              });
            }, 800);
            es.close();
            return;
          }
        } catch {
          // Status endpoint unreachable — fall through to error
        }
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
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    };
  }, [sessionId, dispatch]);
}
