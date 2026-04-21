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
const applyStealthShield = (query, viewerId) => {
    const clauses = ['moderation_status.eq.approved'];
    if (viewerId) clauses.push(`user_id.eq.${viewerId}`);
    return query.or(clauses.join(','));
};

export const fetchHomePosts = async (userId, limit = 20) => {
    let query = supabase
        .from('posts')
        .select(`
            id,
            content,
            created_at,
            user_id,
            likes_count,
            comments_count,
            moderation_status,
            profiles (
                id,
                username,
                full_name,
                avatar_url,
                trust_score
            )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    query = applyStealthShield(query, userId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
};

/**
 * Fetch the viewer's OWN restricted content so they can see what was
 * shadow-banned. Powers the author-only echo-chamber view.
 */
export const fetchMyRestrictedPosts = async (userId, limit = 20) => {
    if (!userId) return [];
    const { data, error } = await supabase
        .from('posts')
        .select('id, content, created_at, moderation_status, moderation_reason, moderation_categories')
        .eq('user_id', userId)
        .in('moderation_status', ['restricted', 'flagged'])
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw error;
    return data || [];
};

export { applyStealthShield };
