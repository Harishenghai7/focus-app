import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { useLike } from './useLike';
import { useSave } from './useSave';
import { useComment } from './useComment';
import { triggerErrorHaptic } from '../utils/haptics';

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
        const applyUpdatesToItem = (item) => {
            if (item.id !== id) return item;
            const next = { ...item, ...updates };
            if (updates.likes_count_delta !== undefined) {
                next.likes_count = (item.likes_count || 0) + updates.likes_count_delta;
            }
            if (updates.saves_count_delta !== undefined) {
                next.saves_count = (item.saves_count || 0) + updates.saves_count_delta;
            }
            if (updates.comments_count_delta !== undefined) {
                next.comments_count = (item.comments_count || 0) + updates.comments_count_delta;
            }
            if (updates.shares_count_delta !== undefined) {
                next.shares_count = (item.shares_count || 0) + updates.shares_count_delta;
            }
            return next;
        };

        // Update infinite posts queries
        queryClient.setQueriesData({ queryKey: ['posts'] }, (oldData) => {
            if (!oldData) return oldData;
            return {
                ...oldData,
                pages: oldData.pages.map(page => ({
                    ...page,
                    posts: page.posts.map(applyUpdatesToItem)
                }))
            };
        });

        // Update single post queries if any
        queryClient.setQueriesData({ queryKey: ['post', id] }, (oldData) => {
            if (!oldData) return oldData;
            return applyUpdatesToItem(oldData);
        });

        // Keep boltz feed cache in sync when interactions happen in the viewer.
        queryClient.setQueriesData({ queryKey: ['boltz'] }, (oldData) => {
            if (!oldData) return oldData;
            if (Array.isArray(oldData)) return oldData.map(applyUpdatesToItem);
            if (Array.isArray(oldData.boltz)) {
                return { ...oldData, boltz: oldData.boltz.map(applyUpdatesToItem) };
            }
            return oldData;
        });
    }, [queryClient]);

    const forceReconcile = useCallback((id) => {
        queryClient.invalidateQueries({ queryKey: ['posts'] });
        queryClient.invalidateQueries({ queryKey: ['post', id] });
        queryClient.invalidateQueries({ queryKey: ['boltz'] });
    }, [queryClient]);

    const toggleLike = useCallback(async (isLiked, onLocalUpdate) => {
        const { data, error } = await baseToggleLike(contentId, isLiked, contentType, (id, updates) => {
            updateCache(id, updates);
            if (onLocalUpdate) onLocalUpdate(id, updates);
        });
        if (error) {
            triggerErrorHaptic();
            forceReconcile(contentId);
            return { data, error };
        }
        if (data && (typeof data.likes_count === 'number' || typeof data.count === 'number')) {
            const likes_count = typeof data.likes_count === 'number' ? data.likes_count : data.count;
            const is_liked = Boolean(data.is_liked ?? data.is_active ?? !isLiked);
            const truth = { likes_count, is_liked };
            updateCache(contentId, truth);
            if (onLocalUpdate) onLocalUpdate(contentId, truth);
        }
        return { data, error: null };
    }, [contentId, contentType, baseToggleLike, forceReconcile, updateCache]);

    const toggleSave = useCallback(async (isSaved, onLocalUpdate) => {
        const { data, error } = await baseToggleSave(contentId, isSaved, contentType, (id, updates) => {
            updateCache(id, updates);
            if (onLocalUpdate) onLocalUpdate(id, updates);
        });
        if (error) {
            triggerErrorHaptic();
            forceReconcile(contentId);
            return { data, error };
        }
        if (data && (typeof data.saves_count === 'number' || typeof data.count === 'number')) {
            const saves_count = typeof data.saves_count === 'number' ? data.saves_count : data.count;
            const is_saved = Boolean(data.is_saved ?? data.is_active ?? !isSaved);
            const truth = { saves_count, is_saved };
            updateCache(contentId, truth);
            if (onLocalUpdate) onLocalUpdate(contentId, truth);
        }
        return { data, error: null };
    }, [contentId, contentType, baseToggleSave, forceReconcile, updateCache]);

    const addComment = useCallback(async (content, onLocalUpdate) => {
        // 1. Optimistic Global Cache Update
        const updates = { comments_count_delta: 1 };
        updateCache(contentId, updates);
        if (onLocalUpdate) onLocalUpdate(contentId, updates);

        // 2. Network Request
        const { data, error } = await baseAddComment(content);
        
        // 3. Rollback on Failure
        if (error) {
            const rollbackUpdates = { comments_count_delta: -1 };
            updateCache(contentId, rollbackUpdates);
            if (onLocalUpdate) onLocalUpdate(contentId, rollbackUpdates);
            triggerErrorHaptic();
        }
        return { data, error };
    }, [contentId, baseAddComment, updateCache]);

    const registerShare = useCallback(async ({ shareType = 'share', recipientId = null } = {}, onLocalUpdate) => {
        const optimisticUpdates = { shares_count_delta: 1 };
        updateCache(contentId, optimisticUpdates);
        if (onLocalUpdate) onLocalUpdate(contentId, optimisticUpdates);

        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!authData?.user?.id) throw new Error('Please login to share');

            const rpcName = contentType === 'boltz' ? 'register_boltz_share_rpc' : 'register_post_share_rpc';
            const rpcArgs = contentType === 'boltz'
                ? {
                    p_boltz_id: contentId,
                    p_user_id: authData.user.id,
                    p_share_type: shareType,
                    p_recipient_id: recipientId,
                }
                : {
                    p_post_id: contentId,
                    p_user_id: authData.user.id,
                    p_share_type: shareType,
                    p_recipient_id: recipientId,
                };

            const { data, error } = await supabase.rpc(rpcName, rpcArgs);
            if (error) throw error;

            const shares_count = typeof data?.shares_count === 'number' ? data.shares_count : data?.count;
            if (typeof shares_count === 'number') {
                const truth = { shares_count };
                updateCache(contentId, truth);
                if (onLocalUpdate) onLocalUpdate(contentId, truth);
            }

            return { data, error: null };
        } catch (error) {
            const rollbackUpdates = { shares_count_delta: -1 };
            updateCache(contentId, rollbackUpdates);
            if (onLocalUpdate) onLocalUpdate(contentId, rollbackUpdates);
            triggerErrorHaptic();
            forceReconcile(contentId);
            toast.error(error.message || 'Failed to register share');
            return { data: null, error };
        }
    }, [contentId, contentType, forceReconcile, updateCache]);

    return {
        toggleLike,
        toggleSave,
        addComment,
        registerShare,
        likeAnimating,
        commentPosting
    };
};
