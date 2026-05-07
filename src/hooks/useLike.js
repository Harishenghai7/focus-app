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

            let rpcResult = null;
            if (contentType === 'post') {
                const { data, error } = await supabase.rpc('toggle_post_like_rpc', {
                    p_post_id: contentId,
                    p_user_id: user.id,
                    p_should_like: newLiked,
                });
                if (error) throw error;
                rpcResult = data;
            } else {
                const { data, error } = await supabase.rpc('toggle_boltz_like_rpc', {
                    p_boltz_id: contentId,
                    p_user_id: user.id,
                    p_should_like: newLiked,
                });
                if (error) throw error;
                rpcResult = data;
            }

            if (onUpdate && rpcResult) {
                onUpdate(contentId, {
                    is_liked: Boolean(rpcResult.is_liked ?? rpcResult.is_active ?? newLiked),
                    likes_count: typeof rpcResult.likes_count === 'number'
                        ? rpcResult.likes_count
                        : (typeof rpcResult.count === 'number' ? rpcResult.count : undefined),
                });
            }


            return { data: rpcResult, error: null };
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
            return { data: null, error };
        } finally {
            setLoading(false);
        }
    }, []);

    return { toggleLike, animating, loading };
};
