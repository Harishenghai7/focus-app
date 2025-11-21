import { useCallback } from 'react';

/**
 * useClipboard
 * Copy/paste with clipboard API.
 * @returns {Object} { copy, paste }
 * @example
 * const { copy, paste } = useClipboard();
 */
export default function useClipboard() {
  const copy = useCallback(async (text) => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  }, []);
  const paste = useCallback(async () => {
    if (navigator.clipboard) {
      return await navigator.clipboard.readText();
    }
    return '';
  }, []);
  return { copy, paste };
}
