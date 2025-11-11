/**
 * Web Vitals Reporting
 * Tracks Core Web Vitals for performance monitoring
 */

import { trackWebVitals } from './analytics';
import { trackPerformance } from './errorTracking';

/**
 * Report Web Vitals to analytics and error tracking
 */
export const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Cumulative Layout Shift
      getCLS((metric) => {
        onPerfEntry(metric);
        trackWebVitals(metric);
        trackPerformance('CLS', metric.value);
      });

      // First Input Delay
      getFID((metric) => {
        onPerfEntry(metric);
        trackWebVitals(metric);
        trackPerformance('FID', metric.value);
      });

      // First Contentful Paint
      getFCP((metric) => {
        onPerfEntry(metric);
        trackWebVitals(metric);
        trackPerformance('FCP', metric.value);
      });

      // Largest Contentful Paint
      getLCP((metric) => {
        onPerfEntry(metric);
        trackWebVitals(metric);
        trackPerformance('LCP', metric.value);
      });

      // Time to First Byte
      getTTFB((metric) => {
        onPerfEntry(metric);
        trackWebVitals(metric);
        trackPerformance('TTFB', metric.value);
      });
    });
  }
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = () => {
  if (!window.performance) {
    return null;
  }

  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    request: navigation?.responseStart - navigation?.requestStart,
    response: navigation?.responseEnd - navigation?.responseStart,
    dom: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
    load: navigation?.loadEventEnd - navigation?.loadEventStart,
    
    // Paint timing
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    
    // Total time
    total: navigation?.loadEventEnd - navigation?.fetchStart,
  };
};

/**
 * Log performance metrics to console (development only)
 */
export const logPerformanceMetrics = () => {
  if (process.env.NODE_ENV !== 'development') return;

  const metrics = getPerformanceMetrics();
  if (!metrics) return;console.groupEnd();
};

export default reportWebVitals;
