import { useEffect, useRef, useCallback } from 'react';

/**
 * useDebouncedCallback Hook
 * 
 * Purpose: Creates a debounced version of a callback function
 * 
 * Features:
 * - Delays function execution until user stops calling it
 * - Automatically cancels pending calls on new invocation
 * - Configurable delay period
 * - Returns a stable function reference
 * - Cleans up on unmount
 * 
 * @param {Function} callback - The function to debounce
 * @param {number} delay - Delay in milliseconds before executing (default: 300ms)
 * @returns {Function} debouncedCallback - The debounced function
 * 
 * @example
 * // Autosave functionality
 * const saveDraft = useDebouncedCallback(() => {
 *   localStorage.setItem('draft', JSON.stringify(data));
 * }, 1000);
 * 
 * useEffect(() => {
 *   saveDraft();
 * }, [data, saveDraft]);
 * 
 * @example
 * // Search API call
 * const handleSearch = useDebouncedCallback((query) => {
 *   fetchSearchResults(query);
 * }, 500);
 * 
 * <input onChange={(e) => handleSearch(e.target.value)} />
 */
const useDebouncedCallback = (callback, delay = 300) => {
  const timeoutRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Create the debounced function
  const debouncedCallback = useCallback(
    (...args) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
};

export default useDebouncedCallback;

// Named export for compatibility
export { useDebouncedCallback };
