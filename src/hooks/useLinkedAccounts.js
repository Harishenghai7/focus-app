import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

/**
 * Hook to fetch and manage linked OAuth accounts
 * @returns {Object} { linkedAccounts, loading, unlinkAccount }
 */
export const useLinkedAccounts = () => {
    const { user } = useAuth();
    const [linkedAccounts, setLinkedAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setLinkedAccounts([]);
            setLoading(false);
            return;
        }

        fetchLinkedAccounts();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`linked-accounts-${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'linked_accounts',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                console.log('🔗 Linked accounts updated:', payload);
                fetchLinkedAccounts();
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [user]);

    const fetchLinkedAccounts = async () => {
        try {
            setLoading(true);
            console.log('🔗 Fetching linked accounts...');

            const { data, error: fetchError } = await supabase
                .from('linked_accounts')
                .select('*')
                .eq('user_id', user.id)
                .order('connected_at', { ascending: false });

            if (fetchError) throw fetchError;

            console.log('✅ Linked accounts fetched:', data?.length || 0);
            setLinkedAccounts(data || []);
            setError(null);
        } catch (err) {
            console.error('❌ Error fetching linked accounts:', err);
            setError(err.message);
            setLinkedAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const unlinkAccount = async (provider) => {
        try {
            const { error } = await supabase
                .from('linked_accounts')
                .delete()
                .eq('user_id', user.id)
                .eq('provider', provider);

            if (error) throw error;

            console.log('✅ Account unlinked successfully');
            setLinkedAccounts(prev => prev.filter(a => a.provider !== provider));
            return { success: true };
        } catch (err) {
            console.error('❌ Error unlinking account:', err);
            return { success: false, error: err.message };
        }
    };

    return { linkedAccounts, loading, error, unlinkAccount, refetch: fetchLinkedAccounts };
};
