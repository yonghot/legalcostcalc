"use client";

import { useRef, useCallback, useState } from "react";

/**
 * Tracks the latest async request to prevent stale responses
 * from overwriting newer ones (race condition prevention).
 */
export function useRequestTracker() {
  const requestIdRef = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async <T>(
      fn: () => Promise<T>,
      opts?: { errorMessage?: string }
    ): Promise<{ data: T; stale: false } | { data: null; stale: true } | { data: null; stale: false }> => {
      const currentId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const result = await fn();
        if (currentId !== requestIdRef.current) {
          return { data: null, stale: true };
        }
        return { data: result, stale: false };
      } catch {
        if (currentId !== requestIdRef.current) {
          return { data: null, stale: true };
        }
        setError(opts?.errorMessage ?? "An error occurred. Please try again.");
        return { data: null, stale: false };
      } finally {
        if (currentId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, execute, clearError };
}
