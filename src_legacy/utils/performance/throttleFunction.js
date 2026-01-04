/**
 * Throttles a function to run at most once per interval.
 * @param {function} fn - Function to throttle.
 * @param {number} interval - Interval in ms.
 * @returns {function}
 * @example
 * const throttled = throttleFunction(fn, 200);
 */
export function throttleFunction(fn, interval) {
  let lastCall = 0;
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn(...args);
    }
  };
}
