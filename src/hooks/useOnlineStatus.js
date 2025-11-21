import { useEffect, useState } from 'react';

/**
 * useOnlineStatus
 * Detect online/offline status.
 * @returns {boolean} online - Is user online
 * @example
 * const online = useOnlineStatus();
 */
export default function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  return online;
}
