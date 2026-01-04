/**
 * Gets memory usage stats if available.
 * @returns {object} Memory usage info.
 * @example
 * const mem = getMemoryUsage();
 */
export function getMemoryUsage() {
  if (performance.memory) {
    return performance.memory;
  }
  return { usedJSHeapSize: null, totalJSHeapSize: null, jsHeapSizeLimit: null };
}
