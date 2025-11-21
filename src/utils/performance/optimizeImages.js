/**
 * Optimizes image URLs for performance.
 * @param {string} url - Image URL.
 * @param {object} [options] - Optimization options.
 * @returns {string} Optimized URL.
 * @example
 * const optimized = optimizeImages(url, { width: 400 });
 */
export function optimizeImages(url, options = {}) {
  // Example: append width param for CDN
  if (options.width) {
    return `${url}?w=${options.width}`;
  }
  return url;
}
