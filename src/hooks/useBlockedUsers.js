import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook to fetch and manage blocked users
 * @returns {Object} { blockedUsers, loading, blockUser, unblockUser }
 */
export const useBlockedUsers = () => {
    const { user } = useAuth();
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setBlockedUsers([]);
            setLoading(false);
            return;
        }

        fetchBlockedUsers();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`blocked-users-${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'blocks',
                filter: `blocker_id=eq.${user.id}`
            }, (payload) => {
                console.log('🚫 Blocked users updated:', payload);
                if (payload.eventType === 'INSERT') {
                    fetchBlockedUsers();
                } else if (payload.eventType === 'DELETE') {
                    setBlockedUsers(prev => prev.filter(u => u.id !== payload.old.blocked_id));
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    const fetchBlockedUsers = async () => {
        try {
            setLoading(true);
            console.log('🚫 Fetching blocked users...');

            const { data, error: fetchError } = await supabase
                .from('blocks')
                .select(`
                    blocked_id,
                    reason,
                    created_at,
                    blocked:profiles!blocks_blocked_id_fkey(
                        id,
                        username,
                        full_name,
                        avatar_url,
                        verified
                    )
                `)
                .eq('blocker_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            console.log('✅ Blocked users fetched:', data?.length || 0);
            setBlockedUsers(data || []);
            setError(null);
        } catch (err) {
            console.error('❌ Error fetching blocked users:', err);
            setError(err.message);
            setBlockedUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const blockUser = async (userId, reason = '') => {
        try {
            const { error } = await supabase
                .from('blocks')
                .insert({
                    blocker_id: user.id,
                    blocked_id: userId,
                    reason
                });

            if (error) throw error;

            console.log('✅ User blocked successfully');
            await fetchBlockedUsers();
            return { success: true };
        } catch (err) {
            console.error('❌ Error blocking user:', err);
            return { success: false, error: err.message };
        }
    };

    const unblockUser = async (userId) => {
        try {
            const { error } = await supabase
                .from('blocks')
                .delete()
                .eq('blocker_id', user.id)
                .eq('blocked_id', userId);

            if (error) throw error;

            console.log('✅ User unblocked successfully');
            setBlockedUsers(prev => prev.filter(u => u.blocked_id !== userId));
            return { success: true };
        } catch (err) {
            console.error('❌ Error unblocking user:', err);
            return { success: false, error: err.message };
        }
    };

    return { blockedUsers, loading, error, blockUser, unblockUser, refetch: fetchBlockedUsers };
};
