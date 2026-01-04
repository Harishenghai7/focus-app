/**
 * useStateSync Hook
 * @hook
 * @param {any} value - Value to sync
 * @param {Function} onSync - Callback on sync
 * @returns {void}
 * @example
 * useStateSync(value, cb);
 */
import { useEffect, useRef } from 'react';
export function useStateSync(value, onSync) {
  const prevRef = useRef(value);
  useEffect(() => {
    if (prevRef.current !== value) {
      onSync(value, prevRef.current);
      prevRef.current = value;
    }
  }, [value, onSync]);
}