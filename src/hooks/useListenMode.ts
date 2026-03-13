import { useState, useEffect, useCallback } from 'react';
import type { ListenState } from '../types';
import { getPublicRemix } from '../api/client';

const LISTEN_SESSION_KEY = 'musicmixer_listen_session';
const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS = 3 * 60 * 1_000; // 3 minutes

/**
 * Read the `listen` query parameter from the URL without removing it.
 * Also checks sessionStorage as a fallback for mobile webview scenarios
 * (e.g., user taps SMS link in an in-app browser, then switches to Safari).
 */
function extractListenParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  const listenId = params.get('listen');

  if (listenId) {
    // Persist to sessionStorage as fallback for mobile webview browser-switch
    try {
      sessionStorage.setItem(LISTEN_SESSION_KEY, listenId);
    } catch {
      // sessionStorage may be unavailable in some contexts
    }
    return listenId;
  }

  // Fallback: check sessionStorage (covers webview -> real browser switch)
  try {
    return sessionStorage.getItem(LISTEN_SESSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Remove the `listen` query parameter from the URL and clear sessionStorage.
 * Called only after a successful 200 response confirms the remix is ready.
 */
function consumeListenParam(): void {
  // Strip from URL
  const url = new URL(window.location.href);
  if (url.searchParams.has('listen')) {
    url.searchParams.delete('listen');
    const cleanUrl = url.pathname + (url.search || '') + url.hash;
    window.history.replaceState({}, '', cleanUrl);
  }

  // Clear sessionStorage fallback
  try {
    sessionStorage.removeItem(LISTEN_SESSION_KEY);
  } catch {
    // sessionStorage may be unavailable
  }
}

type ListenModeResult =
  | { mode: 'create' }
  | { mode: 'listen'; state: ListenState; exitListenMode: () => void };

/**
 * Hook that manages listen mode for shared remix links.
 * Parses the `listen` query param on mount, fetches public remix data,
 * and provides state for rendering the listen experience.
 *
 * If the remix is still processing (202), polls every 5 seconds
 * with a 3-minute timeout before showing a "check back soon" message.
 */
export function useListenMode(): ListenModeResult {
  const [listenSessionId] = useState<string | null>(() => extractListenParam());
  const [listenState, setListenState] = useState<ListenState | null>(
    listenSessionId ? { substate: 'loading' } : null,
  );

  const exitListenMode = useCallback(() => {
    consumeListenParam();
    setListenState(null);
  }, []);

  useEffect(() => {
    if (!listenSessionId) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;
    let pollStartTime: number | null = null;

    async function fetchPublicRemix() {
      const { status, data } = await getPublicRemix(listenSessionId!);

      if (cancelled) return;

      if (status === 200 && data) {
        consumeListenParam();
        setListenState({
          substate: 'ready',
          sessionId: data.session_id,
          explanation: data.explanation,
          warnings: data.warnings,
          usedFallback: data.usedFallback,
          expiresAt: data.expires_at,
        });
      } else if (status === 202) {
        // Remix is still being created — enter processing state and poll
        if (pollStartTime === null) {
          pollStartTime = Date.now();
        }

        const elapsed = Date.now() - pollStartTime;
        if (elapsed >= POLL_TIMEOUT_MS) {
          // Timed out waiting — show unavailable with a helpful message
          setListenState({ substate: 'unavailable' });
          return;
        }

        setListenState({ substate: 'processing' });
        pollTimer = setTimeout(fetchPublicRemix, POLL_INTERVAL_MS);
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
      if (pollTimer !== null) {
        clearTimeout(pollTimer);
      }
    };
  }, [listenSessionId]);

  if (!listenState) {
    return { mode: 'create' };
  }

  return {
    mode: 'listen',
    state: listenState,
    exitListenMode,
  };
}
