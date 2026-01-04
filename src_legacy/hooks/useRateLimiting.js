import { useRef, useCallback } from 'react';

/**
 * useRateLimiting
 * Prevent spam and abuse (mocked for demo).
 * @param {number} limit - Max calls per interval
 * @param {number} intervalMs - Interval in ms
 * @returns {Function} rateLimitedFn
 * @example
 * const rateLimited = useRateLimiting(5, 1000);
 * rateLimited(() => { ... });
 */
export default function useRateLimiting(limit = 5, intervalMs = 1000) {
  const calls = useRef([]);
  return useCallback((fn) => {
    const now = Date.now();
    calls.current = calls.current.filter(t => now - t < intervalMs);
    if (calls.current.length < limit) {
      calls.current.push(now);
      fn();
    }
  }, [limit, intervalMs]);
}
