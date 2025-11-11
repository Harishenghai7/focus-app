import { supabase } from '../supabaseClient';

/**
 * Trending Service
 * Manages trending hashtags and content
 */

class TrendingService {
  constructor() {
    this.trendingCache = null;
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    this.lastUpdate = null;
  }

  /**
   * Get trending hashtags
   * @param {number} limit - Maximum number of trending hashtags
   * @returns {Promise<Array>} Array of trending hashtags
   */
  async getTrendingHashtags(limit = 10) {
    // Check cache
    if (this.trendingCache && this.lastUpdate) {
      const cacheAge = Date.now() - this.lastUpdate;
      if (cacheAge < this.cacheTimeout) {
        return this.trendingCache.slice(0, limit);
      }
    }

    try {
      // Update trending scores first
      await this.updateTrendingScores();

      // Fetch trending hashtags
      const { data, error } = await supabase
        .from('hashtags')
        .select('id, tag, post_count, trending_score, last_used_at')
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Cache results
      this.trendingCache = data || [];
      this.lastUpdate = Date.now();

      return this.trendingCache;
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
      return [];
    }
  }

  /**
   * Update trending scores for all hashtags
   * This should be called periodically (e.g., every hour)
   */
  async updateTrendingScores() {
    try {
      // Call the database function to update scores
      const { error } = await supabase.rpc('update_trending_scores');
      
      if (error) {
        console.error('Error updating trending scores:', error);
      }
    } catch (error) {
      console.error('Error calling update_trending_scores:', error);
    }
  }

  /**
   * Get trending posts
   * @param {number} limit - Maximum number of posts
   * @param {string} timeframe - 'day', 'week', 'month'
   * @returns {Promise<Array>} Array of trending posts
   */
  async getTrendingPosts(limit = 20, timeframe = 'week') {
    try {
      let timeFilter;
      const now = new Date();

      switch (timeframe) {
        case 'day':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .gte('created_at', timeFilter.toISOString())
        .order('like_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      return [];
    }
  }

  /**
   * Get hashtag suggestions based on user's interests
   * @param {string} userId - User ID
   * @param {number} limit - Maximum suggestions
   * @returns {Promise<Array>} Array of suggested hashtags
   */
  async getSuggestedHashtags(userId, limit = 5) {
    try {
      // Get hashtags from posts the user has liked
      const { data: likedPosts, error: likesError } = await supabase
        .from('likes')
        .select(`
          posts (
            caption
          )
        `)
        .eq('user_id', userId)
        .not('post_id', 'is', null)
        .limit(50);

      if (likesError) throw likesError;

      // Extract hashtags from captions
      const hashtagCounts = new Map();
      
      likedPosts?.forEach(like => {
        const caption = like.posts?.caption || '';
        const hashtags = caption.match(/#([a-zA-Z0-9_]+)/g) || [];
        
        hashtags.forEach(tag => {
          const cleanTag = tag.substring(1).toLowerCase();
          hashtagCounts.set(cleanTag, (hashtagCounts.get(cleanTag) || 0) + 1);
        });
      });

      // Get hashtag data for top tags
      const topTags = Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit * 2)
        .map(([tag]) => tag);

      if (topTags.length === 0) {
        // Fallback to trending if no user data
        return this.getTrendingHashtags(limit);
      }

      const { data: hashtags, error } = await supabase
        .from('hashtags')
        .select('*')
        .in('tag', topTags)
        .order('post_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return hashtags || [];
    } catch (error) {
      console.error('Error getting suggested hashtags:', error);
      return this.getTrendingHashtags(limit);
    }
  }

  /**
   * Clear trending cache
   */
  clearCache() {
    this.trendingCache = null;
    this.lastUpdate = null;
  }
}

// Export singleton instance
const trendingService = new TrendingService();
export default trendingService;
