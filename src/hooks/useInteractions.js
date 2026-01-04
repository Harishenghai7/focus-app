import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLike } from './useLike';
import { useSave } from './useSave';
import { useComment } from './useComment';

/**
 * Global Interactions Hook
 * Provides a unified interface for likes, saves, and comments
 * Automatically updates React Query cache for global consistency
 */
export const useInteractions = (contentId, contentType = 'post') => {
    const queryClient = useQueryClient();
    const { toggleLike: baseToggleLike, animating: likeAnimating } = useLike();
    const { toggleSave: baseToggleSave } = useSave();
    const { addComment: baseAddComment, posting: commentPosting } = useComment(contentId, contentType);

    // Helper to update React Query cache
    const updateCache = useCallback((id, updates) => {
        // Update infinite posts queries
        queryClient.setQueriesData({ queryKey: ['posts'] }, (oldData) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                    ...page,
                    posts: page.posts.map(post => {
                        if (post.id === id) {
                            const newPost = { ...post, ...updates };
                            // Handle deltas
                            if (updates.likes_count_delta !== undefined) {
                                newPost.likes_count = (post.likes_count || 0) + updates.likes_count_delta;
                            }
                            if (updates.saves_count_delta !== undefined) {
                                newPost.saves_count = (post.saves_count || 0) + updates.saves_count_delta;
                            }
                            if (updates.comments_count_delta !== undefined) {
                                newPost.comments_count = (post.comments_count || 0) + updates.comments_count_delta;
                            }
                            return newPost;
                        }
                        return post;
                    })
                }))
            };
        });

        // Update single post queries if any
        queryClient.setQueriesData({ queryKey: ['post', id] }, (oldData) => {
            if (!oldData) return oldData;
            const newPost = { ...oldData, ...updates };
            if (updates.likes_count_delta !== undefined) {
                newPost.likes_count = (oldData.likes_count || 0) + updates.likes_count_delta;
            }
            return newPost;
        });
    }, [queryClient]);

    const toggleLike = useCallback((isLiked, onLocalUpdate) => {
        baseToggleLike(contentId, isLiked, contentType, (id, updates) => {
            updateCache(id, updates);
            if (onLocalUpdate) onLocalUpdate(id, updates);
        });
    }, [contentId, contentType, baseToggleLike, updateCache]);

    const toggleSave = useCallback((isSaved, onLocalUpdate) => {
        baseToggleSave(contentId, isSaved, contentType, (id, updates) => {
            updateCache(id, updates);
            if (onLocalUpdate) onLocalUpdate(id, updates);
        });
    }, [contentId, contentType, baseToggleSave, updateCache]);

    const addComment = useCallback(async (content, onLocalUpdate) => {
        const { data, error } = await baseAddComment(content);
        if (!error) {
            const updates = { comments_count_delta: 1 };
            updateCache(contentId, updates);
            if (onLocalUpdate) onLocalUpdate(contentId, updates);
        }
        return { data, error };
    }, [contentId, baseAddComment, updateCache]);

    return {
        toggleLike,
        toggleSave,
        addComment,
        likeAnimating,
        commentPosting
    };
};
