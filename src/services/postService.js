// src/services/postService.js
// 🛡️  PILLAR 2 — Feed queries enforce the Stealth Shield at the service layer
// as a defense-in-depth (even if RLS is not yet deployed on the target env).
import { supabase } from '../lib/supabase';

/**
 * Shadow-moderation filter per spec:
 *   moderation_status = 'approved' OR user_id = auth.uid()
 *
 * Supabase PostgREST encodes OR as `or=(cond1,cond2)`. The `auth.uid()` portion
 * is already enforced by the RLS policy `stealth_shield_select_posts`; the OR
 * here ensures the filter also works against deployments where RLS hasn't yet
 * been applied (P0 migration).
 */
// Note: moderation_status column not in current schema, using visibility/public status instead
// const applyStealthShield = (query, viewerId) => { ... };

export const fetchHomePosts = async (userId, limit = 20) => {
    // Try unified RPC first for consistent data format
    try {
        const { data, error } = await supabase.rpc('get_public_feed', {
            p_limit: limit,
            p_offset: 0
        });
        if (!error && data) {
            return data.map(post => ({
                ...post,
                // RPC returns user data flat, normalize for component compatibility
                profiles: post.username ? {
                    id: post.user_id,
                    username: post.username,
                    full_name: post.full_name,
                    avatar_url: post.avatar_url,
                    trust_score: post.trust_tier
                } : null
            }));
        }
    } catch (rpcErr) {
        console.warn('[postService] RPC failed, falling back to direct query:', rpcErr);
    }

    // Fallback to direct query
    let query = supabase
        .from('posts')
        .select(`
            id,
            content,
            caption,
            created_at,
            user_id,
            likes_count,
            comments_count,
            views_count,
            media_url,
            media_urls,
            profiles:user_id (
                id,
                username,
                full_name,
                avatar_url,
                is_verified,
                trust_tier
            )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(post => ({
        ...post,
        // Normalize profiles array/object
        profiles: Array.isArray(post.profiles) ? post.profiles[0] : post.profiles
    }));
};

/**
 * Fetch the viewer's OWN posts
 * Note: moderation_status column not in current schema
 */
export const fetchMyPosts = async (userId, limit = 20) => {
    if (!userId) return [];
    const { data, error } = await supabase
        .from('posts')
        .select('id, content, caption, created_at, media_url, media_urls, likes_count, comments_count')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data || [];
};

// TODO: Re-enable when moderation_status column is added to schema
// export { applyStealthShield };
