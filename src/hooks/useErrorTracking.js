import { useCallback } from 'react';

/**
 * useErrorTracking
 * Send errors to monitoring service (mocked for demo).
 * @returns {Function} trackError
 * @example
 * const trackError = useErrorTracking();
 * trackError(new Error('Test'));
 */
export default function useErrorTracking() {
  return useCallback((error) => {
    // Replace with error tracking logic
    window.console.error('Tracked error:', error);
  }, []);
}
