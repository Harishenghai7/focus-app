/**
 * usePostLike Hook - Supabase Client Version (More Reliable)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusUser } from '../context/FocusUserContext';
import { toast } from 'react-toastify';
import { setPostLikeDb } from '../utils/postInteractions';

export const usePostLike = () => {
    const { user } = useFocusUser();
    const queryClient = useQueryClient();

    const toggleLike = useMutation({
        mutationFn: async ({ postId, isLiked }) => {
            if (!user) throw new Error('Must be logged in to like posts');

            console.log(`${isLiked ? 'Unliking' : 'Liking'} post:`, postId);

            const result = await setPostLikeDb(user.id, postId, !isLiked);

            console.log('✅ Like action completed');
            return {
                postId,
                isLiked: result?.is_liked ?? !isLiked,
                likesCount: result?.likes_count,
            };
        },
        onMutate: async ({ postId, isLiked }) => {
            await queryClient.cancelQueries({ queryKey: ['posts'] });

            const previousEntries = queryClient.getQueriesData({ queryKey: ['posts'] });

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

            return { previousEntries };
        },
        onError: (err, variables, context) => {
            if (context?.previousEntries?.length) {
                context.previousEntries.forEach(([key, data]) => {
                    queryClient.setQueryData(key, data);
                });
            }
            toast.error('Failed to update like');
            console.error('❌ Like error:', err);
        },
        // Do not invalidate the whole posts feed here: refetch can reset `is_liked` if
        // `post_likes` SELECT is blocked or flaky. Optimistic `onMutate` is the source of truth.
        onSuccess: (result) => {
            if (typeof result?.likesCount !== 'number') return;
            queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    pages: old.pages.map(page => ({
                        ...page,
                        posts: page.posts.map(post =>
                            post.id === result.postId
                                ? { ...post, likes_count: result.likesCount, is_liked: result.isLiked }
                                : post
                        ),
                    })),
                };
            });
        },
    });

    return {
        toggleLike: (variables) => toggleLike.mutate(variables),
        isLoading: toggleLike.isLoading,
    };
};
