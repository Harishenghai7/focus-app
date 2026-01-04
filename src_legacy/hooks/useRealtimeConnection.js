/**
 * useRealtimeConnection Hook
 * Monitors the Supabase realtime connection status
 * @hook
 * @returns {Object} { isConnected, connectionState, error }
 * @example
 * const { isConnected, connectionState } = useRealtimeConnection();
 */
import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionState, setConnectionState] = useState('connected');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check initial connection
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        setIsConnected(!error);
        setConnectionState(error ? 'disconnected' : 'connected');
      } catch (err) {
        setIsConnected(false);
        setConnectionState('error');
        setError(err);
      }
    };

    checkConnection();

    // Monitor network status
    const handleOnline = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setError(null);
    };

    const handleOffline = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { isConnected, connectionState, error };
}
