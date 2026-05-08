import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRobustQuery } from './useRobustQuery';

/**
 * useUserInterests — Fetches user interest tags
 * @param {string} userId - Profile user ID
 */
export const useUserInterests = (userId) => {
    const fetchInterests = useCallback(async () => {
        if (!userId) throw new Error('No userId');

        // Try user_interests table first
        const { data, error } = await supabase
            .from('user_interests')
            .select('interest')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            // Fallback: check profile.interests column
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('interests')
                .eq('id', userId)
                .single();

            if (profileError || !profile?.interests) {
                return [];
            }

            // interests could be an array or JSON string
            if (Array.isArray(profile.interests)) {
                return profile.interests;
            }

            try {
                return JSON.parse(profile.interests);
            } catch {
                return [];
            }
        }

        return (data || []).map(row => row.interest);
    }, [userId]);

    const { data, loading, error, refetch } = useRobustQuery(fetchInterests, {
        enabled: !!userId,
        retries: 2,
    });

    return {
        interests: data || [],
        loading,
        error,
        refresh: refetch,
    };
};
