/**
 * useKeyboardNavigation Hook
 * @hook
 * @param {string[]} keys - Keys to listen for
 * @param {Function} callback - Callback on key press
 * @returns {void}
 * @example
 * useKeyboardNavigation(['ArrowLeft', 'ArrowRight'], cb);
 */
import { useEffect } from 'react';
export function useKeyboardNavigation(keys, callback) {
  useEffect(() => {
    function handleKey(e) {
      if (keys.includes(e.key)) callback(e.key);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [keys, callback]);
}

/**
 * useKeyboardShortcuts Hook - alias for useKeyboardNavigation
 * @hook
 * @param {string[]} keys - Keys to listen for
 * @param {Function} callback - Callback on key press
 * @returns {void}
 */
export const useKeyboardShortcuts = useKeyboardNavigation;
