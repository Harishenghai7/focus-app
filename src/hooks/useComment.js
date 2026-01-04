import { useState, useCallback } from 'react';
import { fetchComments, postComment, deleteComment } from '../lib/commentApi';
import { toast } from 'react-toastify';
import { useAuth } from './useAuth';

export const useComment = (targetId, targetType = 'post') => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const { user } = useAuth();

    const loadComments = useCallback(async () => {
        if (!targetId) return;
        setLoading(true);
        const { data, error } = await fetchComments(targetId, targetType);
        if (error) {
            toast.error('Failed to load comments');
        } else {
            setComments(data);
        }
        setLoading(false);
    }, [targetId, targetType]);

    const addComment = useCallback(async (content, parentId = null) => {
        if (!user) {
            toast.error('Please login to comment');
            return;
        }
        if (!content.trim()) return;

        setPosting(true);
        const commentData = {
            content,
            user_id: user.id,
            parent_id: parentId,
            [targetType === 'post' ? 'post_id' : targetType === 'boltz' ? 'boltz_id' : 'flash_id']: targetId
        };

        const { data, error } = await postComment(commentData);

        if (error) {
            toast.error('Failed to post comment');
        } else {
            // Add user info for immediate UI update
            const newComment = {
                ...data,
                user: {
                    id: user.id,
                    username: user.user_metadata?.username || 'You',
                    avatar_url: user.user_metadata?.avatar_url,
                    verified: user.user_metadata?.verified
                }
            };
            setComments(prev => [newComment, ...prev]);
            toast.success('Comment posted');
        }
        setPosting(false);
        return { data, error };
    }, [user, targetId, targetType]);

    const removeComment = useCallback(async (commentId) => {
        const { error } = await deleteComment(commentId);
        if (error) {
            toast.error('Failed to delete comment');
        } else {
            setComments(prev => prev.filter(c => c.id !== commentId));
            toast.info('Comment deleted');
        }
    }, []);

    return {
        comments,
        loading,
        posting,
        loadComments,
        addComment,
        removeComment
    };
};
