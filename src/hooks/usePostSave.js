/**
 * usePostSave Hook - Supabase Client Version (More Reliable)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useFocusUser } from '../context/FocusUserContext';
import { toast } from 'react-toastify';
import { setPostSaveDb } from '../utils/postInteractions';

export const usePostSave = () => {
    const { user } = useFocusUser();
    const queryClient = useQueryClient();

    const toggleSave = useMutation({
        mutationFn: async ({ postId, isSaved }) => {
            if (!user) throw new Error('Must be logged in to save posts');



            const result = await setPostSaveDb(user.id, postId, !isSaved);


            return {
                postId,
                isSaved: result?.is_saved ?? !isSaved,
                savesCount: result?.saves_count,
            };
        },
        onMutate: async ({ postId, isSaved }) => {
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
                                    is_saved: !isSaved,
                                    saves_count: (post.saves_count || 0) + (isSaved ? -1 : 1),
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
            toast.error('Failed to update save');
            console.error('❌ Save error:', err);
        },
        onSuccess: (result) => {
            if (typeof result?.savesCount === 'number') {
                queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pages: old.pages.map(page => ({
                            ...page,
                            posts: page.posts.map(post =>
                                post.id === result.postId
                                    ? { ...post, saves_count: result.savesCount, is_saved: result.isSaved }
                                    : post
                            ),
                        })),
                    };
                });
            }
            // Same as likes: avoid full feed refetch resetting `is_saved` / counts.
            queryClient.invalidateQueries({ queryKey: ['saved-posts'] });
        },
    });

    return {
        toggleSave: (variables) => toggleSave.mutate(variables),
        isLoading: toggleSave.isLoading,
    };
};
