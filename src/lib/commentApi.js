// Comment API Functions - Direct REST API
import { supabaseUrl, supabaseAnonKey } from './supabase';

/**
 * Fetch comments for a post/boltz/flash
 */
export const fetchComments = async (targetId, targetType = 'post', options = {}) => {
    try {
        const { parentId = null, limit = 50, offset = 0 } = options;

        console.log(`💬 Fetching comments for ${targetType}:`, targetId);

        let url = `${supabaseUrl}/rest/v1/comments?select=*,user:profiles!comments_user_id_fkey(id,username,full_name,avatar_url,verified)`;

        // Filter by target type
        if (targetType === 'post') url += `&post_id=eq.${targetId}`;
        else if (targetType === 'boltz') url += `&boltz_id=eq.${targetId}`;
        else if (targetType === 'flash') url += `&flash_id=eq.${targetId}`;

        // Filter by parent (top-level or replies)
        if (parentId) {
            url += `&parent_id=eq.${parentId}`;
        } else {
            url += `&parent_id=is.null`;
        }

        url += `&deleted_at=is.null`;
        url += `&order=created_at.desc`;
        url += `&limit=${limit}&offset=${offset}`;

        const response = await fetch(url, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Comments fetched:', data.length);
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
        console.log('💬 Posting comment:', commentData);

        const url = `${supabaseUrl}/rest/v1/comments`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(commentData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ Comment posted:', data);
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
        console.log('🗑️ Deleting comment:', commentId);

        const url = `${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ deleted_at: new Date().toISOString() })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('✅ Comment deleted');
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
        console.log('✏️ Updating comment:', commentId);

        const url = `${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                content,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Comment updated');
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
        console.log('❤️ Liking comment:', commentId);

        const url = `${supabaseUrl}/rest/v1/comment_likes`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ comment_id: commentId, user_id: userId })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('✅ Comment liked');
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
        console.log('💔 Unliking comment:', commentId);

        const url = `${supabaseUrl}/rest/v1/comment_likes?comment_id=eq.${commentId}&user_id=eq.${userId}`;

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('✅ Comment unliked');
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
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
            }
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
        console.log(`📌 ${isPinned ? 'Pinning' : 'Unpinning'} comment:`, commentId);

        const url = `${supabaseUrl}/rest/v1/comments?id=eq.${commentId}`;

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${supabaseAnonKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_pinned: isPinned })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('✅ Comment pin toggled');
        return { error: null };

    } catch (error) {
        console.error('❌ Error toggling pin:', error);
        return { error };
    }
};
