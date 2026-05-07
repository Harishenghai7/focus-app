import { supabase } from '../lib/supabase';

/**
 * Calculates a score for a post to determine its ranking in Explore.
 */
export const calculateExploreScore = (post, user) => {
    let score = 0;

    // 1. Recency (newer = higher score)
    const ageInHours = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 100 - ageInHours * 2);

    // 2. Engagement Rate
    const views = post.views_count || 100;
    const engagementRate = (
        (post.like_count || post.likes_count || 0) * 1 +
        (post.comment_count || post.comments_count || 0) * 2 +
        (post.shares_count || 0) * 3
    ) / views;

    score += engagementRate * 1000;

    // 3. Trending Velocity
    if (post.is_trending) score += 50;

    // 4. Penalties
    if (!post.media_url) score -= 50;

    return score;
};

/**
 * Fetches recommended posts for the Explore feed
 * @param {string} userId - Current user ID
 * @param {string} category - Selected category filter (all, posts, boltz, people, tags, trending)
 * @param {number} page - Pagination page
 * @param {number} pageSize - Items per page
 */
export const getRecommendedPosts = async (userId, category = 'all', page = 0, pageSize = 20) => {
    try {


        // Handle different categories
        if (category === 'people') {
            return await fetchPeople(userId, page, pageSize);
        }

        if (category === 'tags') {
            return await fetchTags(page, pageSize);
        }

        // For posts, boltz, all, and trending - fetch from posts table
        let data, error;

        try {
            const rpcResult = await supabase.rpc('get_explore_posts', {
                limit_count: pageSize
            });
            data = rpcResult.data;
            error = rpcResult.error;
        } catch (rpcError) {
            console.warn('⚠️ [EXPLORE] RPC function not available, using fallback query');
            error = rpcError;
        }

        // Fallback: Direct query if RPC fails
        if (error || !data) {


            let query = supabase
                .from('posts')
                .select(`
                    id,
                    user_id,
                    media_url,
                    media_type,
                    content,
                    caption,
                    location,
                    created_at,
                    type,
                    profiles (
                        id,
                        username,
                        full_name,
                        avatar_url,
                        verified
                    )
                `)
                .not('media_url', 'is', null)
                .is('deleted_at', null);

            // Apply category-specific filters
            if (category === 'posts') {
                query = query.in('type', ['post', 'image']);
            } else if (category === 'boltz') {
                query = query.eq('type', 'boltz');
            } else if (category === 'all' || category === 'trending') {
                query = query.in('type', ['post', 'image', 'boltz']);
            }

            const fallbackResult = await query
                .order('created_at', { ascending: false })
                .limit(pageSize);

            if (fallbackResult.error) {
                console.error('❌ [EXPLORE] Fallback query error:', fallbackResult.error);
                throw fallbackResult.error;
            }


            data = fallbackResult.data;


            // Transform fallback data
            data = data.map(post => ({
                id: post.id,
                user_id: post.user_id,
                username: post.profiles?.username,
                avatar_url: post.profiles?.avatar_url,
                verified: post.profiles?.verified,
                full_name: post.profiles?.full_name,
                media_url: post.media_url,
                media_type: post.media_type,
                content: post.content,
                caption: post.caption || post.content,
                location: post.location,
                like_count: 0,
                comment_count: 0,
                created_at: post.created_at,
                type: post.type
            }));
        }



        if (!data || data.length === 0) {
            console.warn('⚠️ [EXPLORE] No posts returned from database');
            return [];
        }

        // Transform the data
        const transformedPosts = data.map(post => ({
            id: post.id,
            user_id: post.user_id,
            media_url: post.media_url,
            media_type: post.media_type,
            content: post.content,
            caption: post.caption || post.content,
            location: post.location,
            created_at: post.created_at,
            type: post.type || 'post',
            user: {
                id: post.user_id,
                username: post.username,
                full_name: post.full_name,
                avatar_url: post.avatar_url,
                verified: post.verified
            },
            like_count: post.like_count || 0,
            likes_count: post.like_count || 0,
            comment_count: post.comment_count || 0,
            comments_count: post.comment_count || 0,
            shares_count: 0,
            views_count: 100
        }));



        // Apply pagination
        const startIndex = page * pageSize;
        const paginatedPosts = transformedPosts.slice(startIndex, startIndex + pageSize);

        // Scoring and Sorting
        const scoredPosts = paginatedPosts.map(post => ({
            ...post,
            score: calculateExploreScore(post, { id: userId })
        }));

        // Sort by score for trending, otherwise chronological
        if (category === 'trending') {
            scoredPosts.sort((a, b) => b.score - a.score);

        } else {
            scoredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        }


        return scoredPosts;
    } catch (error) {
        console.error('❌ [EXPLORE] Error fetching explore posts:', error);
        return [];
    }
};

/**
 * Fetch people/users for the People tab
 */
const fetchPeople = async (currentUserId, page = 0, pageSize = 20) => {
    try {


        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url, verified, bio, followers_count')
            .neq('id', currentUserId || '00000000-0000-0000-0000-000000000000')
            .order('followers_count', { ascending: false, nullsFirst: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;


        return data || [];
    } catch (error) {
        console.error('❌ [EXPLORE] Error fetching people:', error);
        return [];
    }
};

/**
 * Fetch trending hashtags for the Tags tab
 */
const fetchTags = async (page = 0, pageSize = 20) => {
    try {


        // TODO: Implement real hashtag tracking
        // For now, return empty array
        console.warn('⚠️ [EXPLORE] Hashtag tracking not yet implemented');
        return [];
    } catch (error) {
        console.error('❌ [EXPLORE] Error fetching tags:', error);
        return [];
    }
};
