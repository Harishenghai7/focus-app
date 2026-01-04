import { useCallback, useRef } from 'react';

/**
 * useMemoizedCallback
 * Advanced memoization for callbacks.
 * @param {Function} fn - Function to memoize
 * @param {Array} deps - Dependency array
 * @returns {Function} memoized callback
 * @example
 * const memoized = useMemoizedCallback(fn, [dep]);
 */
export default function useMemoizedCallback(fn, deps) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((...args) => fnRef.current(...args), deps);
}
