/**
 * useRealtimeComments Hook
 * Real-time subscription for post comments
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export const useRealtimeComments = (postId) => {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!postId) return;

        // Subscribe to comments changes
        const channel = supabase
            .channel(`post_comments:${postId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'post_comments',
                    filter: `post_id=eq.${postId}`,
                },
                (payload) => {
                    console.log('Real-time comment update:', payload);

                    // Invalidate comments query
                    queryClient.invalidateQueries({ queryKey: ['comments', postId] });
                    queryClient.invalidateQueries({ queryKey: ['posts'] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [postId, queryClient]);
};
