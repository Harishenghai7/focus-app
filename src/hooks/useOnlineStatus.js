import { useEffect } from 'react';
import { supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook to update user's last_seen timestamp for online status tracking
 * Updates every 2 minutes while user is active
 */
export const useOnlineStatus = () => {
    const { user, session } = useAuth();

    useEffect(() => {
        if (!user || !session?.access_token) return;

        const updateLastSeen = async () => {
            try {
                const response = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
                    method: 'PATCH',
                    headers: {
                        'apikey': supabaseAnonKey,
                        'Authorization': `Bearer ${session.access_token}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    body: JSON.stringify({ last_seen: new Date().toISOString() })
                });

                if (!response.ok) {
                    console.error('Failed to update last_seen:', response.status);
                }
            } catch (err) {
                console.error('Error updating last_seen:', err);
            }
        };

        // Update immediately
        updateLastSeen();

        // Update every 2 minutes
        const interval = setInterval(updateLastSeen, 2 * 60 * 1000);

        // Update on visibility change (when user returns to tab)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                updateLastSeen();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user, session]);
};

export default useOnlineStatus;
