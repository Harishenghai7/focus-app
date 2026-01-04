/**
 * usePostLike Hook - Supabase Client Version (More Reliable)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const usePostLike = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const toggleLike = useMutation({
        mutationFn: async ({ postId, isLiked }) => {
            if (!user) throw new Error('Must be logged in to like posts');

            console.log(`${isLiked ? 'Unliking' : 'Liking'} post:`, postId);

            if (isLiked) {
                // Unlike
                const { error } = await supabase
                    .from('post_likes')
                    .delete()
                    .match({ post_id: postId, user_id: user.id });

                if (error) throw error;
            } else {
                // Like
                const { error } = await supabase
                    .from('post_likes')
                    .insert({ post_id: postId, user_id: user.id });

                if (error) throw error;
            }

            console.log('✅ Like action completed');
            return { postId, isLiked: !isLiked };
        },
        onMutate: async ({ postId, isLiked }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            // Snapshot previous value
            const previousPosts = queryClient.getQueryData(['posts']);

            // Optimistically update
            queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
                if (!old) return old;

                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        posts: page.posts.map(post =>
                            post.id === postId
                                ? {
                                    ...post,
                                    is_liked: !isLiked,
                                    likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1),
                                }
                                : post
                        ),
                    })),
                };
            });

            return { previousPosts };
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousPosts) {
                queryClient.setQueryData(['posts'], context.previousPosts);
            }
            toast.error('Failed to update like');
            console.error('❌ Like error:', err);
        },
        onSuccess: () => {
            // Invalidate to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
    });

    return {
        toggleLike: (variables) => toggleLike.mutate(variables),
        isLoading: toggleLike.isLoading,
    };
};
