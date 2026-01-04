/**
 * useAITracking Hook
 * @hook
 * @param {string} event - Event name
 * @returns {Object} { tracked, error }
 * @example
 * const { tracked } = useAITracking('view');
 */
import { useState, useEffect } from 'react';

export function useAITracking(event) {
  const [tracked, setTracked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function track() {
      try {
        await fetch(`/api/ai/track?event=${event}`);
        if (!cancelled) setTracked(true);
      } catch (e) {
        if (!cancelled) setError(e);
      }
    }

    if (event) track();

    return () => {
      cancelled = true;
    };
  }, [event]);

  return { tracked, error };
}