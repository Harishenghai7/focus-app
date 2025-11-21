import { useEffect } from 'react';

/**
 * usePerformanceMonitor
 * Monitor app performance metrics (mocked for demo).
 * @param {Function} onReport - Callback with metrics
 * @example
 * usePerformanceMonitor(metrics => { ... });
 */
export default function usePerformanceMonitor(onReport) {
  useEffect(() => {
    // Replace with real performance monitoring
    const metrics = { ttfb: 120, fcp: 800 };
    onReport(metrics);
  }, [onReport]);
}
