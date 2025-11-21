/**
 * Measures page load time in milliseconds.
 * @returns {number} Load time in ms.
 * @example
 * const loadTime = measureLoadTime();
 */
export function measureLoadTime() {
  return window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
}
