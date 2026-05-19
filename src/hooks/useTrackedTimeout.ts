import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a `safeTimeout` function that tracks all pending timeout IDs
 * and clears them automatically on unmount.
 */
export function useTrackedTimeout() {
  const pendingTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const safeTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      pendingTimeouts.current.delete(id);
      fn();
    }, ms);
    pendingTimeouts.current.add(id);
    return id;
  }, []);

  useEffect(() => {
    return () => {
      pendingTimeouts.current.forEach(clearTimeout);
      pendingTimeouts.current.clear();
    };
  }, []);

  return safeTimeout;
}
