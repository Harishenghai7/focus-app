/**
 * useOrientation Hook
 * @hook
 * @returns {string} orientation
 * @example
 * const orientation = useOrientation();
 */
import { useEffect, useState } from 'react';

export function useOrientation() {
  const [orientation, setOrientation] = useState(window.screen.orientation?.type || 'portrait');

  useEffect(() => {
    function handleChange() {
      setOrientation(window.screen.orientation?.type || 'portrait');
    }

    window.screen.orientation?.addEventListener('change', handleChange);

    return () => { window.screen.orientation?.removeEventListener('change', handleChange); };
  }, []);

  return orientation;
}
