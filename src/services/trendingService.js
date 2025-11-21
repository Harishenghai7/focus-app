import { supabase } from '../config/supabaseClient';

/**
 * Trending Service
 * Handles trending content discovery including hashtags, posts, and users
 * Algorithm: Engagement score + recency weighting
 */

// Time decay constants (in hours)
const TIME_DECAY_FACTOR = 24; // 24 hours for half-life
const TRENDING_WINDOW_HOURS = 72; // Look at last 72 hours for trending content

/**
 * Calculate engagement score for a post/boltz
 * Score = (likes * 1) + (comments * 3) + (saves * 5) + (shares * 4) + (views * 0.1)
 * Comments and saves are weighted higher as they indicate deeper engagement
 * @param {object} content - Content object with engagement metrics
 * @returns {number} Engagement score
 */
const calculateEngagementScore = (content) => {
  const likes = content.likes_count || 0;
  const comments = content.comments_count || 0;
  const saves = content.save_count || 0;
  const shares = content.shares_count || 0;
  const views = content.views_count || 0;

  return (likes * 1) + (comments * 3) + (saves * 5) + (shares * 4) + (views * 0.1);
};

/**
 * Calculate time decay factor based on recency
 * Uses exponential decay: score * e^(-λt)
 * @param {string} createdAt - ISO timestamp
 * @returns {number} Decay multiplier between 0 and 1
 */
const calculateTimeDecay = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const hoursSinceCreation = (now - created) / (1000 * 60 * 60);
  
  // Exponential decay with half-life of TIME_DECAY_FACTOR hours
  const lambda = Math.log(2) / TIME_DECAY_FACTOR;
  return Math.exp(-lambda * hoursSinceCreation);
};

/**
 * Calculate final trending score
 * @param {object} content - Content object
 * @returns {number} Final trending score
 */
const calculateTrendingScore = (content) => {
  const engagementScore = calculateEngagementScore(content);
  const timeDecay = calculateTimeDecay(content.created_at);
  return engagementScore * timeDecay;
};

/**
 * Get trending hashtags
 * Based on usage frequency and recency
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of hashtags to return (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @returns {Promise<Array>} Array of trending hashtags with usage counts
 */
export const getTrendingHashtags = async ({ limit = 20, offset = 0 } = {}) => {
  try {
    // Calculate the timestamp for the trending window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - TRENDING_WINDOW_HOURS);

    // Get hashtags with recent usage
    const { data: hashtags, error } = await supabase
      .from('hashtags')
      .select(`
        id,
        name,
        posts_count,
        boltz_count,
        created_at,
        post_hashtags (
          created_at
        )
      `)
      .gte('post_hashtags.created_at', windowStart.toISOString())
      .order('posts_count', { ascending: false })
      .order('boltz_count', { ascending: false });

    if (error) throw error;

    // Calculate trending scores for each hashtag
    const hashtagsWithScores = hashtags.map(hashtag => {
      const totalCount = (hashtag.posts_count || 0) + (hashtag.boltz_count || 0);
      const recentUsage = hashtag.post_hashtags?.length || 0;
      
      // Score based on total usage and recent activity
      const score = (totalCount * 0.3) + (recentUsage * 0.7);
      
      return {
        id: hashtag.id,
        name: hashtag.name,
        posts_count: hashtag.posts_count,
        boltz_count: hashtag.boltz_count,
        total_count: totalCount,
        recent_usage: recentUsage,
        trending_score: score
      };
    });

    // Sort by trending score and apply pagination
    const trending = hashtagsWithScores
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(offset, offset + limit);

    return {
      success: true,
      data: trending,
      total: hashtagsWithScores.length
    };

  } catch (error) {
    console.error('Error fetching trending hashtags:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get trending posts
 * Based on engagement score and recency
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of posts to return (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.userId - Current user ID (for personalization, optional)
 * @returns {Promise<Array>} Array of trending posts
 */
export const getTrendingPosts = async ({ limit = 20, offset = 0, userId = null } = {}) => {
  try {
    // Calculate the timestamp for the trending window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - TRENDING_WINDOW_HOURS);

    // Fetch recent posts with engagement metrics
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        id,
        user_id,
        caption,
        media_path,
        visibility,
        likes_count,
        comments_count,
        save_count,
        created_at,
        updated_at,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        shares:shares(count)
      `)
      .eq('visibility', 'public')
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(100); // Get more than needed for scoring

    if (error) throw error;

    // Calculate trending scores
    const postsWithScores = posts.map(post => ({
      ...post,
      shares_count: post.shares?.[0]?.count || 0,
      trending_score: calculateTrendingScore(post)
    }));

    // Sort by trending score and apply pagination
    const trending = postsWithScores
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(offset, offset + limit);

    // If user is provided, filter out posts from blocked users
    if (userId) {
      // This would require a blocked_users table - for now return all
      // TODO: Implement blocked users filtering
    }

    return {
      success: true,
      data: trending,
      total: postsWithScores.length
    };

  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get trending boltz (short videos)
 * Based on engagement score and recency
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of boltz to return (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.userId - Current user ID (for personalization, optional)
 * @returns {Promise<Array>} Array of trending boltz
 */
export const getTrendingBoltz = async ({ limit = 20, offset = 0, userId = null } = {}) => {
  try {
    // Calculate the timestamp for the trending window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - TRENDING_WINDOW_HOURS);

    // Fetch recent boltz with engagement metrics
    const { data: boltz, error } = await supabase
      .from('boltz')
      .select(`
        id,
        user_id,
        video_path,
        thumbnail_path,
        duration,
        caption,
        visibility,
        likes_count,
        comments_count,
        views_count,
        save_count,
        created_at,
        updated_at,
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          verified
        ),
        shares:shares(count)
      `)
      .eq('visibility', 'public')
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: false })
      .limit(100); // Get more than needed for scoring

    if (error) throw error;

    // Calculate trending scores (views are more important for videos)
    const boltzWithScores = boltz.map(bolt => ({
      ...bolt,
      shares_count: bolt.shares?.[0]?.count || 0,
      trending_score: calculateTrendingScore(bolt)
    }));

    // Sort by trending score and apply pagination
    const trending = boltzWithScores
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(offset, offset + limit);

    return {
      success: true,
      data: trending,
      total: boltzWithScores.length
    };

  } catch (error) {
    console.error('Error fetching trending boltz:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get trending users
 * Based on follower growth rate and engagement
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of users to return (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @returns {Promise<Array>} Array of trending users
 */
export const getTrendingUsers = async ({ limit = 20, offset = 0 } = {}) => {
  try {
    // Calculate the timestamp for the trending window
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - TRENDING_WINDOW_HOURS);

    // Get users with recent follower activity
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        full_name,
        bio,
        avatar_url,
        verified,
        private_account,
        followers_count,
        following_count,
        posts_count,
        created_at,
        follows!follows_following_id_fkey (
          created_at
        ),
        posts (
          id,
          likes_count,
          comments_count,
          created_at
        )
      `)
      .eq('private_account', false)
      .order('followers_count', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Calculate trending scores for users
    const usersWithScores = users.map(user => {
      // Count recent followers (last 72 hours)
      const recentFollowers = user.follows?.filter(
        f => new Date(f.created_at) >= windowStart
      ).length || 0;

      // Count recent post engagement
      const recentEngagement = user.posts?.reduce((sum, post) => {
        if (new Date(post.created_at) >= windowStart) {
          return sum + (post.likes_count || 0) + (post.comments_count || 0) * 2;
        }
        return sum;
      }, 0) || 0;

      // Score = (recent followers * 10) + (total followers * 0.1) + (recent engagement * 0.5)
      const score = (recentFollowers * 10) + (user.followers_count * 0.1) + (recentEngagement * 0.5);

      return {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        bio: user.bio,
        avatar_url: user.avatar_url,
        verified: user.verified,
        followers_count: user.followers_count,
        following_count: user.following_count,
        posts_count: user.posts_count,
        recent_followers: recentFollowers,
        recent_engagement: recentEngagement,
        trending_score: score
      };
    });

    // Sort by trending score and apply pagination
    const trending = usersWithScores
      .filter(user => user.trending_score > 0) // Only show users with activity
      .sort((a, b) => b.trending_score - a.trending_score)
      .slice(offset, offset + limit);

    return {
      success: true,
      data: trending,
      total: usersWithScores.length
    };

  } catch (error) {
    console.error('Error fetching trending users:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Get all trending content (combined)
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum items per category (default: 10)
 * @returns {Promise<Object>} Object containing trending hashtags, posts, boltz, and users
 */
export const getAllTrending = async ({ limit = 10 } = {}) => {
  try {
    const [hashtags, posts, boltz, users] = await Promise.all([
      getTrendingHashtags({ limit }),
      getTrendingPosts({ limit }),
      getTrendingBoltz({ limit }),
      getTrendingUsers({ limit })
    ]);

    return {
      success: true,
      data: {
        hashtags: hashtags.data,
        posts: posts.data,
        boltz: boltz.data,
        users: users.data
      }
    };

  } catch (error) {
    console.error('Error fetching all trending content:', error);
    return {
      success: false,
      error: error.message,
      data: {
        hashtags: [],
        posts: [],
        boltz: [],
        users: []
      }
    };
  }
};

/**
 * Update trending scores in explore_scores table
 * This should be run periodically (e.g., every 15 minutes) via a cron job
 * @returns {Promise<Object>} Update results
 */
export const updateTrendingScores = async () => {
  try {
    // Get trending posts
    const { data: trendingPosts } = await getTrendingPosts({ limit: 100 });
    
    // Get trending boltz
    const { data: trendingBoltz } = await getTrendingBoltz({ limit: 100 });

    // Update explore_scores table for posts
    const postScoreUpdates = trendingPosts.map(post => ({
      content_id: post.id,
      content_type: 'post',
      score: post.trending_score,
      category: 'trending',
      calculated_at: new Date().toISOString()
    }));

    // Update explore_scores table for boltz
    const boltzScoreUpdates = trendingBoltz.map(bolt => ({
      content_id: bolt.id,
      content_type: 'boltz',
      score: bolt.trending_score,
      category: 'trending',
      calculated_at: new Date().toISOString()
    }));

    // Batch upsert scores
    const allUpdates = [...postScoreUpdates, ...boltzScoreUpdates];
    
    const { error } = await supabase
      .from('explore_scores')
      .upsert(allUpdates, { 
        onConflict: 'content_id,content_type,category' 
      });

    if (error) throw error;

    return {
      success: true,
      message: `Updated ${allUpdates.length} trending scores`,
      count: allUpdates.length
    };

  } catch (error) {
    console.error('Error updating trending scores:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  getTrendingHashtags,
  getTrendingPosts,
  getTrendingBoltz,
  getTrendingUsers,
  getAllTrending,
  updateTrendingScores
};
