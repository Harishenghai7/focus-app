import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useFollow = () => {
    const toggleFollow = useCallback(async (userId, currentFollowingState, onUpdate) => {
        const newFollowingState = !currentFollowingState;

        // Optimistic UI update
        onUpdate(userId, { is_following: newFollowingState });

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            if (newFollowingState) {
                await supabase.from('follows').insert({
                    follower_id: user.id,
                    following_id: userId
                });

                // Create notification
                await supabase.from('notifications').insert({
                    user_id: userId,
                    type: 'follow',
                    actor_id: user.id
                });
            } else {
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', user.id)
                    .eq('following_id', userId);
            }
        } catch (error) {
            console.error('Follow error:', error);
            // Revert optimistic update
            onUpdate(userId, { is_following: currentFollowingState });
        }
    }, []);

    return { toggleFollow };
};
