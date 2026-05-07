/**
 * useRealtimeLikes Hook
 * Real-time subscription for post likes
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useRealtimeLikes = (postId) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!postId) return;

        // Subscribe to post likes changes
        const channel = supabase
            .channel(`post_likes:${postId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'post_likes',
                    filter: `post_id=eq.${postId}`,
                },
                (payload) => {


                    // Invalidate posts query to refetch
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [postId, queryClient]);
};
