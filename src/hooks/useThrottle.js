import { useRef, useCallback } from 'react';

/**
 * useThrottle
 * Throttle rapid function calls.
 * @param {Function} fn - Function to throttle
 * @param {number} delay - Throttle delay in ms
 * @returns {Function} throttled function
 * @example
 * const throttled = useThrottle(fn, 300);
 */
export default function useThrottle(fn, delay) {
  const lastCall = useRef(0);
  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastCall.current > delay) {
      lastCall.current = now;
      fn(...args);
    }
  }, [fn, delay]);
}
