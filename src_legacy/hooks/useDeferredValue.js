import { useDeferredValue } from 'react';

/**
 * useDeferredValue
 * Defer expensive computations.
 * @param {any} value - Value to defer
 * @returns {any} deferredValue
 * @example
 * const deferred = useDeferredValue(value);
 */
export default function useDeferredValueHook(value) {
  return useDeferredValue(value);
}
