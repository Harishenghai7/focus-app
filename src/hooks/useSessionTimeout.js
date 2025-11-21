import { useEffect, useRef } from 'react';

/**
 * useSessionTimeout
 * Auto-logout after inactivity.
 * @param {Function} onTimeout - Callback on timeout
 * @param {number} timeoutMs - Timeout in ms
 * @example
 * useSessionTimeout(onLogout, 60000);
 */
export default function useSessionTimeout(onTimeout, timeoutMs = 60000) {
  const timer = useRef();
  useEffect(() => {
    const reset = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(onTimeout, timeoutMs);
    };
    window.addEventListener('mousemove', reset);
    window.addEventListener('keydown', reset);
    reset();
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener('mousemove', reset);
      window.removeEventListener('keydown', reset);
    };
  }, [onTimeout, timeoutMs]);
}
