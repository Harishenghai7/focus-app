/**
 * Measures render time for a React component.
 * @param {function} renderFn - The render function.
 * @returns {number} Render time in ms.
 * @example
 * const time = measureRenderTime(() => render(<App />));
 */
export function measureRenderTime(renderFn) {
  const start = performance.now();
  renderFn();
  return performance.now() - start;
}
