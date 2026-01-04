import supabase from '../supabaseClient';

class TrendingService {
  constructor() {
    this.trendingCache = null;
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour
    this.lastUpdate = null;
  }

  // Fetch trending hashtags, with caching
  async getTrendingHashtags(limit = 10) {
    if (this.trendingCache && this.lastUpdate) {
      const cacheAge = Date.now() - this.lastUpdate;
      if (cacheAge < this.cacheTimeout) {
        return this.trendingCache.slice(0, limit);
      }
    }

    try {
      // Update trending scores before fetching (should be called periodically elsewhere too)
      await this.updateTrendingScores();

      const { data, error } = await supabase
        .from('hashtags')
        .select('id, tag, postcount, trendingscore, lastusedat')
        .order('trendingscore', { ascending: false })
        .limit(limit);

      if (error) throw error;

      this.trendingCache = data;
      this.lastUpdate = Date.now();

      return this.trendingCache;
    } catch (error) {
      console.error('Error fetching trending hashtags', error);
      return [];
    }
  }

  // Call a stored procedure to update trending scores
  async updateTrendingScores() {
    try {
      const { error } = await supabase.rpc('updateTrendingScores');
      if (error) {
        console.error('Error updating trending scores', error);
      }
    } catch (error) {
      console.error('Error calling updateTrendingScores RPC', error);
    }
  }

  // Get trending posts in a timeframe (day/week/month)
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
        .select(
          'id, caption, mediaurl, mediaurls, mediatype, likecount, commentcount, createdat, profiles!postsuseridfkey(id, username, fullname, avatarurl, isverified)'
        )
        .gte('createdat', timeFilter.toISOString())
        .order('likecount', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching trending posts', error);
      return [];
    }
  }

  // Suggest hashtags based on user interest or fallback to trending
  async getSuggestedHashtags(userId, limit = 5) {
    try {
      // Get hashtags from posts the user has liked
      const { data: likedPosts, error: likesError } = await supabase
        .from('likes')
        .select('posts(caption)')
        .eq('userid', userId)
        .limit(50);

      if (likesError) throw likesError;

      // Extract hashtags and count frequency
      const hashtagCounts = new Map();
      likedPosts?.forEach((like) => {
        const caption = like.posts?.caption || '';
        const hashtags = caption.match(/#[a-z0-9]+/gi) || [];
        hashtags.forEach((tag) => {
          const cleanTag = tag.substring(1).toLowerCase();
          hashtagCounts.set(cleanTag, (hashtagCounts.get(cleanTag) || 0) + 1);
        });
      });

      // Get top hashtags sorted by count
      const topTags = Array.from(hashtagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([tag]) => tag);

      if (topTags.length === 0) {
        // Fallback: get trending hashtags
        return await this.getTrendingHashtags(limit);
      }

      // Fetch hashtag details
      const { data, error } = await supabase
        .from('hashtags')
        .select('id, tag, postcount, trendingscore')
        .in('tag', topTags)
        .order('postcount', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error getting suggested hashtags', error);
      return this.getTrendingHashtags(limit);
    }
  }

  clearCache() {
    this.trendingCache = null;
    this.lastUpdate = null;
  }
}

const trendingService = new TrendingService();
export default trendingService;
