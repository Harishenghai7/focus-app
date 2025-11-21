import { useTransition } from 'react';

/**
 * useTransition
 * Non-blocking state updates.
 * @returns {Object} { startTransition, isPending }
 * @example
 * const { startTransition, isPending } = useTransitionHook();
 */
export default function useTransitionHook() {
  const [isPending, startTransition] = useTransition();
  return { startTransition, isPending };
}
