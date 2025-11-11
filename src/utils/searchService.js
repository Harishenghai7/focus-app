import { supabase } from '../supabaseClient';

/**
 * Search Service
 * Provides comprehensive search functionality across users, posts, and hashtags
 */

class SearchService {
  constructor() {
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Perform comprehensive search across all content types
   * @param {string} query - Search query
   * @param {string} type - 'all', 'users', 'posts', 'hashtags'
   * @param {number} limit - Maximum results per type
   * @returns {Promise<Object>} Search results grouped by type
   */
  async search(query, type = 'all', limit = 10) {
    if (!query || query.trim().length === 0) {
      return { users: [], posts: [], hashtags: [] };
    }

    const trimmedQuery = query.trim();
    const cacheKey = `${type}:${trimmedQuery}:${limit}`;

    // Check cache
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.searchCache.delete(cacheKey);
    }

    try {
      let results = { users: [], posts: [], hashtags: [] };

      if (type === 'all' || type === 'users') {
        results.users = await this.searchUsers(trimmedQuery, limit);
      }

      if (type === 'all' || type === 'posts') {
        results.posts = await this.searchPosts(trimmedQuery, limit);
      }

      if (type === 'all' || type === 'hashtags') {
        results.hashtags = await this.searchHashtags(trimmedQuery, limit);
      }

      // Cache results
      this.searchCache.set(cacheKey, {
        data: results,
        timestamp: Date.now()
      });

      return results;
    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
  }

  /**
   * Search users by username, full name, or bio
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of user profiles
   */
  async searchUsers(query, limit = 10) {
    try {
      // Use full-text search with fallback to ILIKE
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio, is_verified, follower_count')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%,bio.ilike.%${query}%`)
        .order('follower_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Calculate relevance score
      return (data || []).map(user => ({
        ...user,
        result_type: 'user',
        relevance: this.calculateUserRelevance(user, query)
      })).sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('User search error:', error);
      return [];
    }
  }

  /**
   * Search posts by caption
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of posts
   */
  async searchPosts(query, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          caption,
          media_url,
          media_urls,
          media_type,
          media_types,
          is_carousel,
          like_count,
          comment_count,
          created_at,
          profiles!posts_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url,
            is_verified
          )
        `)
        .ilike('caption', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(post => ({
        ...post,
        result_type: 'post',
        thumbnail_url: post.is_carousel ? post.media_urls?.[0] : post.media_url,
        relevance: this.calculatePostRelevance(post, query)
      })).sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Post search error:', error);
      return [];
    }
  }

  /**
   * Search hashtags
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of hashtags
   */
  async searchHashtags(query, limit = 10) {
    try {
      // Remove # if present
      const cleanQuery = query.replace(/^#/, '');

      const { data, error } = await supabase
        .from('hashtags')
        .select('id, tag, post_count, trending_score')
        .ilike('tag', `%${cleanQuery}%`)
        .order('post_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(hashtag => ({
        ...hashtag,
        result_type: 'hashtag',
        relevance: this.calculateHashtagRelevance(hashtag, cleanQuery)
      })).sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Hashtag search error:', error);
      return [];
    }
  }

  /**
   * Get autocomplete suggestions
   * @param {string} query - Search query
   * @param {number} limit - Maximum suggestions
   * @returns {Promise<Array>} Array of suggestions
   */
  async getAutocompleteSuggestions(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmedQuery = query.trim();

    try {
      const suggestions = [];

      // Get user suggestions
      const { data: users } = await supabase
        .from('profiles')
        .select('username, avatar_url, is_verified')
        .ilike('username', `${trimmedQuery}%`)
        .order('follower_count', { ascending: false })
        .limit(3);

      if (users) {
        suggestions.push(...users.map(user => ({
          type: 'user',
          text: user.username,
          icon: user.avatar_url,
          verified: user.is_verified
        })));
      }

      // Get hashtag suggestions
      const cleanQuery = trimmedQuery.replace(/^#/, '');
      const { data: hashtags } = await supabase
        .from('hashtags')
        .select('tag, post_count')
        .ilike('tag', `${cleanQuery}%`)
        .order('post_count', { ascending: false })
        .limit(3);

      if (hashtags) {
        suggestions.push(...hashtags.map(hashtag => ({
          type: 'hashtag',
          text: `#${hashtag.tag}`,
          count: hashtag.post_count
        })));
      }

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Save search to history
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {string} resultType - Type of result clicked
   * @param {string} resultId - ID of result clicked
   */
  async saveSearchHistory(userId, query, resultType = null, resultId = null) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    try {
      // Save to database
      await supabase
        .from('search_history')
        .insert([{
          user_id: userId,
          query: trimmedQuery,
          result_type: resultType,
          result_id: resultId
        }]);

      // Also save to local storage
      const localHistory = this.getLocalSearchHistory(userId, 50);
      const newEntry = {
        id: Date.now().toString(),
        query: trimmedQuery,
        result_type: resultType,
        created_at: new Date().toISOString()
      };

      // Add to beginning and remove duplicates
      const updatedHistory = [newEntry, ...localHistory.filter(h => h.query !== trimmedQuery)];
      this.saveLocalSearchHistory(userId, updatedHistory.slice(0, 50));
    } catch (error) {
      console.error('Error saving search history:', error);
      
      // Fallback: save to local storage only
      try {
        const localHistory = this.getLocalSearchHistory(userId, 50);
        const newEntry = {
          id: Date.now().toString(),
          query: trimmedQuery,
          result_type: resultType,
          created_at: new Date().toISOString()
        };
        const updatedHistory = [newEntry, ...localHistory.filter(h => h.query !== trimmedQuery)];
        this.saveLocalSearchHistory(userId, updatedHistory.slice(0, 50));
      } catch (localError) {
        console.error('Error saving to local storage:', localError);
      }
    }
  }

  /**
   * Get user's search history
   * @param {string} userId - User ID
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of recent searches
   */
  async getSearchHistory(userId, limit = 10) {
    try {
      // Try to get from database first
      const { data, error } = await supabase
        .from('search_history')
        .select('id, query, result_type, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback to local storage if database fails
        return this.getLocalSearchHistory(userId, limit);
      }

      // Remove duplicates, keeping most recent
      const uniqueSearches = [];
      const seenQueries = new Set();

      for (const search of data || []) {
        if (!seenQueries.has(search.query.toLowerCase())) {
          uniqueSearches.push(search);
          seenQueries.add(search.query.toLowerCase());
        }
      }

      // Also save to local storage as backup
      this.saveLocalSearchHistory(userId, uniqueSearches);

      return uniqueSearches;
    } catch (error) {
      console.error('Error fetching search history:', error);
      // Fallback to local storage
      return this.getLocalSearchHistory(userId, limit);
    }
  }

  /**
   * Get search history from local storage
   * @private
   */
  getLocalSearchHistory(userId, limit = 10) {
    try {
      const key = `search_history_${userId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.slice(0, limit);
    } catch (error) {
      console.error('Error reading local search history:', error);
      return [];
    }
  }

  /**
   * Save search history to local storage
   * @private
   */
  saveLocalSearchHistory(userId, history) {
    try {
      const key = `search_history_${userId}`;
      localStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving local search history:', error);
    }
  }

  /**
   * Clear user's search history
   * @param {string} userId - User ID
   */
  async clearSearchHistory(userId) {
    try {
      // Clear from database
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      // Also clear local storage
      const key = `search_history_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing search history:', error);
      
      // Fallback: clear local storage only
      try {
        const key = `search_history_${userId}`;
        localStorage.removeItem(key);
      } catch (localError) {
        console.error('Error clearing local storage:', localError);
      }
      
      throw error;
    }
  }

  /**
   * Delete specific search from history
   * @param {string} searchId - Search history ID
   */
  async deleteSearchHistoryItem(searchId) {
    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', searchId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting search history item:', error);
      throw error;
    }
  }

  /**
   * Calculate user relevance score
   * @private
   */
  calculateUserRelevance(user, query) {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // Exact username match
    if (user.username?.toLowerCase() === lowerQuery) {
      score += 100;
    }
    // Username starts with query
    else if (user.username?.toLowerCase().startsWith(lowerQuery)) {
      score += 50;
    }
    // Username contains query
    else if (user.username?.toLowerCase().includes(lowerQuery)) {
      score += 25;
    }

    // Full name match
    if (user.full_name?.toLowerCase().includes(lowerQuery)) {
      score += 20;
    }

    // Bio match
    if (user.bio?.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }

    // Boost verified users
    if (user.is_verified) {
      score += 15;
    }

    // Boost popular users
    score += Math.min(user.follower_count || 0, 100) / 10;

    return score;
  }

  /**
   * Calculate post relevance score
   * @private
   */
  calculatePostRelevance(post, query) {
    const lowerQuery = query.toLowerCase();
    const caption = post.caption?.toLowerCase() || '';
    let score = 0;

    // Caption contains query
    const occurrences = (caption.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += occurrences * 20;

    // Query appears early in caption
    const position = caption.indexOf(lowerQuery);
    if (position !== -1) {
      score += Math.max(0, 50 - position);
    }

    // Boost recent posts
    const ageInDays = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - ageInDays);

    // Boost popular posts
    score += Math.min(post.like_count || 0, 50) / 5;
    score += Math.min(post.comment_count || 0, 20) / 2;

    return score;
  }

  /**
   * Calculate hashtag relevance score
   * @private
   */
  calculateHashtagRelevance(hashtag, query) {
    const lowerQuery = query.toLowerCase();
    const tag = hashtag.tag.toLowerCase();
    let score = 0;

    // Exact match
    if (tag === lowerQuery) {
      score += 100;
    }
    // Starts with query
    else if (tag.startsWith(lowerQuery)) {
      score += 50;
    }
    // Contains query
    else if (tag.includes(lowerQuery)) {
      score += 25;
    }

    // Boost popular hashtags
    score += Math.min(hashtag.post_count || 0, 100) / 10;

    // Boost trending hashtags
    score += Math.min(hashtag.trending_score || 0, 50) / 5;

    return score;
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.searchCache.clear();
  }
}

// Export singleton instance
const searchService = new SearchService();
export default searchService;
