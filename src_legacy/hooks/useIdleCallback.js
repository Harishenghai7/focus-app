import { useEffect } from 'react';

/**
 * useIdleCallback
 * Run tasks when browser is idle.
 * @param {Function} callback - Task to run
 * @param {Array} deps - Dependency array
 * @example
 * useIdleCallback(() => { ... }, [dep]);
 */
export default function useIdleCallback(callback, deps) {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(callback);
      return () => window.cancelIdleCallback(id);
    } else {
      const id = setTimeout(callback, 200);
      return () => clearTimeout(id);
    }
  }, deps);
}
