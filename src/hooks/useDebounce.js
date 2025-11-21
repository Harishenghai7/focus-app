import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Purpose: Debounce rapid function calls to optimize performance
 * 
 * Features:
 * - Delays function execution until user stops typing/interacting
 * - Automatically cancels pending updates on new input
 * - Configurable delay period
 * - Prevents excessive API calls or expensive operations
 * 
 * @param {any} value - The value to debounce (can be string, number, object, etc.)
 * @param {number} delay - Delay in milliseconds before updating (default: 300ms)
 * @returns {any} debouncedValue - The debounced value that updates after the delay
 * 
 * @example
 * // Search input debouncing
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     // Make API call with debounced search term
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 * 
 * @example
 * // Window resize debouncing
 * const [windowWidth, setWindowWidth] = useState(window.innerWidth);
 * const debouncedWidth = useDebounce(windowWidth, 250);
 * 
 * useEffect(() => {
 *   const handleResize = () => setWindowWidth(window.innerWidth);
 *   window.addEventListener('resize', handleResize);
 *   return () => window.removeEventListener('resize', handleResize);
 * }, []);
 * 
 * @dependencies setTimeout, clearTimeout (built-in browser APIs)
 */
const useDebounce = (value, delay = 300) => {
  // State to store the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: cancel the timeout if value changes before delay expires
    // This ensures that only the last value in a rapid sequence gets debounced
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue;
};

export default useDebounce;

// Named export for compatibility
export { useDebounce };
