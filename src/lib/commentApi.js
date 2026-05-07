// Comment API Functions - Direct REST API
import { supabaseUrl, supabaseAnonKey } from './supabase';
import { getAuthToken } from '../utils/supabaseRest';

const authHeaders = async (withJson = false) => {
    const token = await getAuthToken();
    return {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        ...(withJson ? { 'Content-Type': 'application/json', Prefer: 'return=representation' } : {}),
    };
};

/**
 * Fetch comments for a post/boltz/flash
 */
export const fetchComments = async (targetId, targetType = 'post', options = {}) => {
    try {
        const { parentId = null, limit = 50, offset = 0 } = options;



        const table = targetType === 'post' ? 'post_comments' : 'comments';
        const userJoin =
            targetType === 'post'
                ? 'profiles:user_id!inner(id,username,full_name,avatar_url,is_verified)'
                : 'user:profiles!comments_user_id_fkey(id,username,full_name,avatar_url,verified)';
        let url = `${supabaseUrl}/rest/v1/${table}?select=*,${userJoin}`;

        // Filter by target type
        if (targetType === 'post') url += `&post_id=eq.${targetId}`;
        else if (targetType === 'boltz') url += `&boltz_id=eq.${targetId}`;
        else if (targetType === 'flash') url += `&flash_id=eq.${targetId}`;

        // Filter by parent (top-level or replies)
        const parentField = targetType === 'post' ? 'parent_comment_id' : 'parent_id';
        if (parentId) {
            url += `&${parentField}=eq.${parentId}`;
        } else {
            url += `&${parentField}=is.null`;
        }

        url += `&deleted_at=is.null`;
        url += `&order=created_at.desc`;
        url += `&limit=${limit}&offset=${offset}`;

        const response = await fetch(url, {
            headers: await authHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        return { data, error: null };

    } catch (error) {
        console.error('❌ Error fetching comments:', error);
        return { data: null, error };
    }
};

/**
 * Post a new comment
 */
export const postComment = async (commentData) => {
    try {


        const url = `${supabaseUrl}/rest/v1/comments`;

        const response = await fetch(url, {
            method: 'POST',
            headers: await authHeaders(true),
            body: JSON.stringify(commentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();

        return { data: data[0], error: null };

    } catch (error) {
        console.error('❌ Error posting comment:', error);
        return { data: null, error };
    }
};

/**
 * Delete a comment (soft delete)
 */
export const deleteComment = async (commentId) => {
    try {


        const url = `${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: await authHeaders(true),
            body: JSON.stringify({ deleted_at: new Date().toISOString() })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }


        return { error: null };

    } catch (error) {
        console.error('❌ Error deleting comment:', error);
        return { error };
    }
};

/**
 * Update a comment
 */
export const updateComment = async (commentId, content) => {
    try {


        const url = `${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: await authHeaders(true),
            body: JSON.stringify({
                content,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        return { data: data[0], error: null };

    } catch (error) {
        console.error('❌ Error updating comment:', error);
        return { data: null, error };
    }
};

/**
 * Like a comment
 */
export const likeComment = async (commentId, userId) => {
    try {


        const url = `${supabaseUrl}/rest/v1/comment_likes`;

        const response = await fetch(url, {
            method: 'POST',
            headers: await authHeaders(true),
            body: JSON.stringify({ comment_id: commentId, user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }


        return { error: null };

    } catch (error) {
        console.error('❌ Error liking comment:', error);
        return { error };
    }
};

/**
 * Unlike a comment
 */
export const unlikeComment = async (commentId, userId) => {
    try {


        const url = `${supabaseUrl}/rest/v1/comment_likes?comment_id=eq.${commentId}&user_id=eq.${userId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: await authHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }


        return { error: null };

    } catch (error) {
        console.error('❌ Error unliking comment:', error);
        return { error };
    }
};

/**
 * Check if user liked a comment
 */
export const checkCommentLike = async (commentId, userId) => {
    try {
        const url = `${supabaseUrl}/rest/v1/comment_likes?comment_id=eq.${commentId}&user_id=eq.${userId}`;

        const response = await fetch(url, {
            headers: await authHeaders()
        });

        if (!response.ok) return { isLiked: false, error: null };

        const data = await response.json();
        return { isLiked: data.length > 0, error: null };

    } catch (error) {
        return { isLiked: false, error };
    }
};

/**
 * Pin/Unpin a comment (post owner only)
 */
export const togglePinComment = async (commentId, isPinned) => {
    try {


        const url = `${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: await authHeaders(true),
            body: JSON.stringify({ is_pinned: isPinned })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }


        return { error: null };

    } catch (error) {
        console.error('❌ Error toggling pin:', error);
        return { error };
    }
};
