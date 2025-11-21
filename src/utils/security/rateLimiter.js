/**
 * rateLimiter
 * Rate limit API calls (simple in-memory).
 * @param {Function} fn
 * @param {number} limit
 * @param {number} intervalMs
 * @returns {Function} rateLimitedFn
 * @example rateLimiter(fn, 5, 1000)
 */
export default function rateLimiter(fn, limit = 5, intervalMs = 1000) {
  let calls = [];
  return (...args) => {
    const now = Date.now();
    calls = calls.filter(t => now - t < intervalMs);
    if (calls.length < limit) {
      calls.push(now);
      fn(...args);
    }
  };
}
