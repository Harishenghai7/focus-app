/**
 * usePostComment Hook
 * Handles comment CRUD operations with optimistic updates
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { toast } from 'react-toastify';

export const usePostComments = (postId) => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Fetch comments
    const { data: comments = [], isLoading } = useQuery({
        queryKey: ['comments', postId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('post_comments')
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        username,
                        avatar_url,
                        is_verified
                    )
                `)
                .eq('post_id', postId)
                .is('deleted_at', null)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        },
        enabled: !!postId,
    });

    // Add comment
    const addComment = useMutation({
        mutationFn: async ({ text, parentCommentId = null }) => {
            if (!user) throw new Error('Must be logged in to comment');

            const { data, error } = await supabase
                .from('post_comments')
                .insert({
                    post_id: postId,
                    user_id: user.id,
                    parent_comment_id: parentCommentId,
                    text,
                })
                .select(`
                    *,
                    profiles:user_id (
                        id,
                        username,
                        avatar_url,
                        is_verified
                    )
                `)
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Comment added!');
        },
        onError: (error) => {
            toast.error('Failed to add comment');
            console.error('Comment error:', error);
        },
    });

    // Delete comment
    const deleteComment = useMutation({
        mutationFn: async (commentId) => {
            const { error } = await supabase
                .from('post_comments')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', commentId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('Comment deleted');
        },
        onError: () => {
            toast.error('Failed to delete comment');
        },
    });

    // Edit comment
    const editComment = useMutation({
        mutationFn: async ({ commentId, text }) => {
            const { error } = await supabase
                .from('post_comments')
                .update({ text, updated_at: new Date().toISOString() })
                .eq('id', commentId)
                .eq('user_id', user.id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comments', postId] });
            toast.success('Comment updated');
        },
        onError: () => {
            toast.error('Failed to update comment');
        },
    });

    return {
        comments,
        isLoading,
        addComment: addComment.mutate,
        deleteComment: deleteComment.mutate,
        editComment: editComment.mutate,
        isAdding: addComment.isLoading,
    };
};
