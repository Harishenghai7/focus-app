/**
 * Debounces a function to run after a delay.
 * @param {function} fn - Function to debounce.
 * @param {number} delay - Delay in ms.
 * @returns {function}
 * @example
 * const debounced = debounceFunction(fn, 300);
 */
export function debounceFunction(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
