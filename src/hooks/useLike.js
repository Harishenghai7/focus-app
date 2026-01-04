import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

export const useLike = () => {
    const [loading, setLoading] = useState(false);
    const [animating, setAnimating] = useState(false);

    const toggleLike = useCallback(async (contentId, isLiked, contentType = 'post', onUpdate) => {
        if (!contentId) return;

        setLoading(true);
        const newLiked = !isLiked;

        // Trigger animation only on like
        if (newLiked) {
            setAnimating(true);
            setTimeout(() => setAnimating(false), 800);
        }

        // 1. Optimistic Update
        if (onUpdate) {
            onUpdate(contentId, {
                is_liked: newLiked,
                likes_count_delta: newLiked ? 1 : -1
            });
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Please login to like posts');

            const tableName = contentType === 'boltz' ? 'boltz_likes' : 'post_likes';
            const idField = contentType === 'boltz' ? 'boltz_id' : 'post_id';

            if (newLiked) {
                const { error } = await supabase.from(tableName).insert({
                    [idField]: contentId,
                    user_id: user.id
                });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from(tableName)
                    .delete()
                    .eq(idField, contentId)
                    .eq('user_id', user.id);
                if (error) throw error;
            }

            console.log(`✅ [LIKE] ${contentType} ${contentId} success`);
        } catch (error) {
            console.error('❌ [LIKE] Error:', error);
            toast.error(error.message || 'Failed to update like');

            // 2. Revert Optimistic Update on failure
            if (onUpdate) {
                onUpdate(contentId, {
                    is_liked: isLiked,
                    likes_count_delta: isLiked ? 1 : -1
                });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    return { toggleLike, animating, loading };
};
