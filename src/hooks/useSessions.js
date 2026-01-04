import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook to fetch and manage user sessions
 * @returns {Object} { sessions, loading, endSession, endAllOtherSessions }
 */
export const useSessions = () => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setSessions([]);
            setLoading(false);
            return;
        }

        fetchSessions();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`user-sessions-${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_sessions',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('💻 Sessions updated:', payload);
                fetchSessions();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            console.log('💻 Fetching user sessions...');

            const { data, error: fetchError } = await supabase
                .from('user_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('last_active_at', { ascending: false });

            if (fetchError) throw fetchError;

            console.log('✅ Sessions fetched:', data?.length || 0);
            setSessions(data || []);
            setError(null);
        } catch (err) {
            console.error('❌ Error fetching sessions:', err);
            setError(err.message);
            setSessions([]);
        } finally {
            setLoading(false);
        }
    };

    const endSession = async (sessionId) => {
        try {
            const { error } = await supabase
                .from('user_sessions')
                .delete()
                .eq('id', sessionId)
                .eq('user_id', user.id);

            if (error) throw error;

            console.log('✅ Session ended successfully');
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            return { success: true };
        } catch (err) {
            console.error('❌ Error ending session:', err);
            return { success: false, error: err.message };
        }
    };

    const endAllOtherSessions = async () => {
        try {
            const { error } = await supabase
                .from('user_sessions')
                .delete()
                .eq('user_id', user.id)
                .eq('is_current', false);

            if (error) throw error;

            console.log('✅ All other sessions ended successfully');
            await fetchSessions();
            return { success: true };
        } catch (err) {
            console.error('❌ Error ending sessions:', err);
            return { success: false, error: err.message };
        }
    };

    return { sessions, loading, error, endSession, endAllOtherSessions, refetch: fetchSessions };
};
