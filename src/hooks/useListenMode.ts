import { useState, useEffect } from 'react';
import type { ListenState } from '../types';
import { getPublicRemix } from '../api/client';

/**
 * Extract and consume the `listen` query parameter from the URL.
 * Immediately removes it from the address bar via history.replaceState.
 * Returns the session ID if present, or null.
 */
function extractListenParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  const listenId = params.get('listen');

  if (listenId) {
    // Remove the query param from the URL immediately
    const url = new URL(window.location.href);
    url.searchParams.delete('listen');
    const cleanUrl = url.pathname + (url.search || '') + url.hash;
    window.history.replaceState({}, '', cleanUrl);
  }

  return listenId || null;
}

type ListenModeResult =
  | { mode: 'create' }
  | { mode: 'listen'; state: ListenState; exitListenMode: () => void };

/**
 * Hook that manages listen mode for shared remix links.
 * Parses the `listen` query param on mount, fetches public remix data,
 * and provides state for rendering the listen experience.
 */
export function useListenMode(): ListenModeResult {
  const [listenSessionId] = useState<string | null>(() => extractListenParam());
  const [listenState, setListenState] = useState<ListenState | null>(
    listenSessionId ? { substate: 'loading' } : null,
  );

  useEffect(() => {
    if (!listenSessionId) return;

    let cancelled = false;

    async function fetchPublicRemix() {
      const { status, data } = await getPublicRemix(listenSessionId!);

      if (cancelled) return;

      if (status === 200 && data) {
        setListenState({
          substate: 'ready',
          sessionId: data.session_id,
          explanation: data.explanation,
          warnings: data.warnings,
          usedFallback: data.usedFallback,
          expiresAt: data.expires_at,
        });
      } else if (status === 400) {
        setListenState({ substate: 'invalid' });
      } else if (status === 410) {
        setListenState({ substate: 'expired' });
      } else {
        // 404, network error (0), or any other status
        setListenState({ substate: 'unavailable' });
      }
    }

    fetchPublicRemix();

    return () => {
      cancelled = true;
    };
  }, [listenSessionId]);

  if (!listenState) {
    return { mode: 'create' };
  }

  return {
    mode: 'listen',
    state: listenState,
    exitListenMode: () => setListenState(null),
  };
}
