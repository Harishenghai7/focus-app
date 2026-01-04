import { useCallback } from 'react';

/**
 * useEventTracking
 * Track custom user events (mocked for demo).
 * @returns {Function} trackEvent
 * @example
 * const trackEvent = useEventTracking();
 * trackEvent('click', { id: 1 });
 */
export default function useEventTracking() {
  return useCallback((event, data) => {
    // Replace with analytics logic
    window.console.log('Event:', event, data);
  }, []);
}
