/**
 * usePostSave Hook - Supabase Client Version (More Reliable)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const usePostSave = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const toggleSave = useMutation({
        mutationFn: async ({ postId, isSaved }) => {
            if (!user) throw new Error('Must be logged in to save posts');

            console.log(`${isSaved ? 'Unsaving' : 'Saving'} post:`, postId);

            if (isSaved) {
                // Unsave
                const { error } = await supabase
                    .from('saved_posts')
                    .delete()
                    .match({ post_id: postId, user_id: user.id });

                if (error) throw error;
            } else {
                // Save
                const { error } = await supabase
                    .from('saved_posts')
                    .insert({ post_id: postId, user_id: user.id });

                if (error) throw error;
            }

            console.log('✅ Save action completed');
            return { postId, isSaved: !isSaved };
        },
        onMutate: async ({ postId, isSaved }) => {
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
                                    is_saved: !isSaved,
                                    saves_count: (post.saves_count || 0) + (isSaved ? -1 : 1),
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
            toast.error('Failed to update save');
            console.error('❌ Save error:', err);
        },
        onSuccess: (_, variables) => {
            // Show success message
            toast.success(variables.isSaved ? 'Post removed from saved' : 'Post saved');

            // Invalidate to refetch fresh data
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
        },
    });

    return {
        toggleSave: (variables) => toggleSave.mutate(variables),
        isLoading: toggleSave.isLoading,
    };
};
