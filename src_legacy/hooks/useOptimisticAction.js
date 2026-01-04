/**
 * useOptimisticAction Hook
 * @hook
 * @param {Function} action - Async action
 * @returns {Object} { run, loading, error }
 * @example
 * const { run, loading } = useOptimisticAction(action);
 */
import { useState, useCallback } from 'react';

export function useOptimisticAction(action) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      await action(...args);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [action]);
  return { run, loading, error };
}