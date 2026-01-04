import { fetchPosts, fetchBoltz, supabaseFetch } from './supabaseRest';

// Constants for feed mixing
const RATIOS = {
    FOLLOWING: 0.7,
    SUGGESTED: 0.2,
    ADS: 0.1
};

/**
 * Generates the home feed for a user using REST API
 * @param {string} userId - The current user's ID
 * @param {number} page - Current page number
 * @param {number} pageSize - Number of items per page
 * @returns {Promise<Array>} - Mixed feed items
 */
export const generateFeed = async (userId, page = 0, pageSize = 10) => {
    try {
        console.log(`📱 Generating feed for user ${userId}, page ${page}`);

        // 1. Get user's following list via REST API
        const followingData = await supabaseFetch(
            `/follows?select=following_id&follower_id=eq.${userId}`
        ).catch(() => []);

        const followingIds = followingData?.map(f => f.following_id) || [];
        console.log(`👥 Following ${followingIds.length} users`);

        // 2. Fetch posts from following (and self)
        if (userId && !followingIds.includes(userId)) {
            followingIds.push(userId);
        }
        const followingPosts = await getFollowingPosts(followingIds, page, pageSize);
        console.log(`📝 Got ${followingPosts.length} following posts`);

        // 3. Fetch suggested posts
        const suggestedCount = Math.ceil(pageSize * RATIOS.SUGGESTED);
        const suggestedPosts = await getSuggestedPosts(userId, page, suggestedCount);
        console.log(`💡 Got ${suggestedPosts.length} suggested posts`);

        // 4. Fetch Boltz
        const boltz = await getBoltzForFeed(userId, page, Math.ceil(pageSize * 0.3), followingIds);
        console.log(`🎬 Got ${boltz.length} boltz`);

        // 5. Mix content
        let feed = [...followingPosts, ...boltz];

        // Sort by date to mix Posts and Boltz chronologically
        feed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Inject suggested posts every 5 items
        suggestedPosts.forEach((post, index) => {
            const insertIndex = (index + 1) * 5;
            if (insertIndex < feed.length) {
                feed.splice(insertIndex, 0, { ...post, is_suggested: true });
            } else {
                feed.push({ ...post, is_suggested: true });
            }
        });

        // Inject a suggested user card every 8 items
        if (feed.length >= 3) {
            const mockSuggestedUser = {
                id: 'suggested-1',
                type: 'suggested_user',
                user: {
                    id: 'user-x',
                    username: 'popular_creator',
                    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                    verified: true
                }
            };
            feed.splice(3, 0, mockSuggestedUser);
        }

        console.log(`✅ Feed generated: ${feed.length} items`);
        return feed;
    } catch (error) {
        console.error('❌ Error generating feed:', error);
        return [];
    }
};

/**
 * Get posts from users the current user is following
 */
const getFollowingPosts = async (followingIds, page, pageSize) => {
    if (!followingIds.length) {
        console.log('⚠️ No following users, returning empty');
        return [];
    }

    try {
        const posts = await fetchPosts({
            limit: pageSize,
            offset: page * pageSize,
            orderBy: 'created_at',
            ascending: false,
            userIds: followingIds // Use server-side filtering
        });

        return formatPosts(posts);
    } catch (error) {
        console.error('Error fetching following posts:', error);
        return [];
    }
};

/**
 * Get Boltz for feed
 */
const getBoltzForFeed = async (userId, page, pageSize, followingIds = []) => {
    try {
        // 1. Fetch Boltz from following (and self)
        let followingBoltz = [];
        if (followingIds.length > 0) {
            followingBoltz = await fetchBoltz({
                limit: pageSize,
                offset: page * pageSize,
                userIds: followingIds
            });
        }

        // 2. Fetch Suggested Boltz (Global)
        // We fetch a bit more to ensure we have enough after filtering out following
        const suggestedBoltz = await fetchBoltz({
            limit: pageSize,
            offset: page * pageSize
        });

        // Filter out following/self from suggested to avoid duplicates
        const filteredSuggested = suggestedBoltz.filter(b => !followingIds.includes(b.user_id));

        // 3. Mix them (mostly following, some suggested)
        // Simple mix: Interleave or just concat if following is small
        const mixedBoltz = [...followingBoltz, ...filteredSuggested].slice(0, pageSize);

        // Format Boltz to look like feed items
        return mixedBoltz.map(item => ({
            ...item,
            type: 'boltz',
            media_urls: item.video_url ? [item.video_url] : (item.media_url ? [item.media_url] : []),
            media_types: ['video'],
            likes_count: item.likes_count || 0,
            comments_count: item.comments_count || 0,
            is_liked: false,
            is_saved: false,
        }));
    } catch (error) {
        console.error('Error fetching boltz for feed:', error);
        return [];
    }
};

/**
 * Get suggested posts (posts from users not followed)
 */
const getSuggestedPosts = async (userId, page, pageSize) => {
    try {
        const posts = await fetchPosts({
            limit: pageSize,
            offset: page * pageSize,
            orderBy: 'created_at',
            ascending: false
        });

        // Filter out current user's posts
        const filtered = posts.filter(p => p.user_id !== userId);

        return formatPosts(filtered);
    } catch (error) {
        console.error('Error fetching suggested posts:', error);
        return [];
    }
};

/**
 * Format posts with computed fields
 */
const formatPosts = (posts) => {
    return posts.map(post => ({
        ...post,
        type: post.type || 'post',
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        is_liked: post.is_liked || false,
        is_saved: post.is_saved || false,
    }));
};
