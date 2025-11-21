/**
 * useScrollRestoration Hook
 * @hook
 * @param {string} key - Unique key for scroll position
 * @returns {void}
 * @example
 * useScrollRestoration('feed');
 */
import { useEffect } from 'react';

export function useScrollRestoration(key) {
  useEffect(() => {
    const pos = sessionStorage.getItem(`scroll-${key}`);
    if (pos) window.scrollTo(0, +pos);
    function saveScroll() {
      sessionStorage.setItem(`scroll-${key}`, window.scrollY);
    }
    window.addEventListener('scroll', saveScroll);
    return () => window.removeEventListener('scroll', saveScroll);
  }, [key]);
}

export default useScrollRestoration;