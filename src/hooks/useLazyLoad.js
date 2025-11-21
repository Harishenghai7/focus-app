/**
 * useLazyLoad Hook
 * @hook
 * @param {string} selector - CSS selector for lazy elements
 * @returns {void}
 * @example
 * useLazyLoad('.lazy-img');
 */
import { useEffect } from 'react';
export function useLazyLoad(selector) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      if ('loading' in el) el.loading = 'lazy';
    });
  }, [selector]);
}
