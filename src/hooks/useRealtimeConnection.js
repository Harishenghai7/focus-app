import { useState, useEffect } from 'react';

export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(navigator.onLine);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      setReconnecting(true);
      
      setTimeout(() => {
        setReconnecting(false);
        window.dispatchEvent(new CustomEvent('realtimeReconnected'));
      }, 1000);
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isConnected, reconnecting };
};
