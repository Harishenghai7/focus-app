import { fetchPosts, fetchBoltz, supabaseFetch } from './supabaseRest';

/**
 * Generates the home feed for a user.
 * Mixes following posts + chronological suggested posts + boltz.
 * Zero fake / hardcoded data.
 */
export const generateFeed = async (userId, page = 0, pageSize = 10) => {
    try {
        // 1. Get user's following list
        const followingData = await supabaseFetch(
            `/follows?select=following_id&follower_id=eq.${userId}`
        ).catch(() => []);

        const followingIds = followingData?.map(f => f.following_id) || [];

        // Always include self
        if (userId && !followingIds.includes(userId)) {
            followingIds.push(userId);
        }

        // 2. Posts from following (and self)
        const followingPosts = followingIds.length > 0
            ? await getFollowingPosts(followingIds, page, pageSize)
            : [];

        // 3. Suggested posts from accounts NOT followed (fill the rest)
        const needed = Math.max(0, pageSize - followingPosts.length);
        const suggestedPosts = needed > 0
            ? await getSuggestedPosts(userId, followingIds, page, needed)
            : [];

        // 4. Boltz clips mixed in
        const boltz = await getBoltzForFeed(userId, page, Math.ceil(pageSize * 0.3), followingIds);

        // 5. Chronologically merged feed
        let feed = [...followingPosts, ...boltz];
        feed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // 6. Inject suggested every 5 items — real posts only, no fake cards
        suggestedPosts.forEach((post, index) => {
            const insertAt = (index + 1) * 5;
            const item = { ...post, is_suggested: true };
            if (insertAt < feed.length) feed.splice(insertAt, 0, item);
            else feed.push(item);
        });

        return feed;
    } catch (error) {
        console.error('Feed generation failed:', error);
        return [];
    }
};

const getFollowingPosts = async (followingIds, page, pageSize) => {
    try {
        const posts = await fetchPosts({
            limit: pageSize,
            offset: page * pageSize,
            orderBy: 'created_at',
            ascending: false,
            userIds: followingIds,
        });
        return formatPosts(posts);
    } catch (err) {
        console.error('Error fetching following posts:', err);
        return [];
    }
};

/**
 * Real suggested posts — from users NOT followed, ordered by engagement.
 */
const getSuggestedPosts = async (userId, followingIds, page, limit) => {
    try {
        const posts = await fetchPosts({
            limit: limit + followingIds.length, // overfetch to filter
            offset: page * limit,
            orderBy: 'created_at',
            ascending: false,
        });
        // Exclude self and already-followed
        const filtered = posts.filter(p => !followingIds.includes(p.user_id) && p.user_id !== userId);
        return formatPosts(filtered.slice(0, limit));
    } catch (err) {
        console.error('Error fetching suggested posts:', err);
        return [];
    }
};

const getBoltzForFeed = async (userId, page, pageSize, followingIds = []) => {
    try {
        let followingBoltz = [];
        if (followingIds.length > 0) {
            followingBoltz = await fetchBoltz({
                limit: pageSize,
                offset: page * pageSize,
                userIds: followingIds,
            });
        }

        const suggestedBoltz = await fetchBoltz({
            limit: pageSize,
            offset: page * pageSize,
        });

        const filteredSuggested = suggestedBoltz.filter(
            b => !followingIds.includes(b.user_id)
        );

        return [...followingBoltz, ...filteredSuggested]
            .slice(0, pageSize)
            .map(item => ({
                ...item,
                type: 'boltz',
                media_urls: item.video_url ? [item.video_url] : (item.media_url ? [item.media_url] : []),
                media_types: ['video'],
                likes_count: item.likes_count || 0,
                comments_count: item.comments_count || 0,
                is_liked: false,
                is_saved: false,
            }));
    } catch (err) {
        console.error('Error fetching boltz for feed:', err);
        return [];
    }
};

const formatPosts = (posts) =>
    (posts || []).map(post => ({
        ...post,
        type: post.type || 'post',
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        is_liked: post.is_liked || false,
        is_saved: post.is_saved || false,
    }));
