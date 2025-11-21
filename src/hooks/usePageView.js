import { useEffect } from 'react';

/**
 * usePageView
 * Track page views automatically (mocked for demo).
 * @param {string} page - Page name
 * @example
 * usePageView('Home');
 */
export default function usePageView(page) {
  useEffect(() => {
    // Replace with analytics logic
    window.console.log('Page view:', page);
  }, [page]);
}
