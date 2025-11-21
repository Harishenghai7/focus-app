import { supabase } from '../config/supabaseClient';

/**
 * Search Service
 * Handles full-text search across users, posts, hashtags using Supabase
 * Uses PostgreSQL full-text search with pg_trgm extension for fuzzy matching
 */

// Search result limits
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Search for users by username, full name, or bio
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum number of results (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.userId - Current user ID (for filtering blocked users)
 * @param {boolean} options.verifiedOnly - Only return verified users (default: false)
 * @returns {Promise<Array>} Array of matching users
 */
export const searchUsers = async (query, options = {}) => {
  try {
    const {
      limit = DEFAULT_LIMIT,
      offset = 0,
      userId = null,
      verifiedOnly = false
    } = options;

    // Validate and sanitize query
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
        total: 0,
        message: 'Empty query'
      };
    }

    const sanitizedQuery = query.trim().toLowerCase();
    const searchPattern = `%${sanitizedQuery}%`;

    // Build query
    let queryBuilder = supabase
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
        posts_count
      `, { count: 'exact' });

    // Apply search filters using ILIKE for case-insensitive search
    queryBuilder = queryBuilder.or(
      `username.ilike.${searchPattern},full_name.ilike.${searchPattern},bio.ilike.${searchPattern}`
    );

    // Filter verified only if requested
    if (verifiedOnly) {
      queryBuilder = queryBuilder.eq('verified', true);
    }

    // TODO: Filter out blocked users if userId is provided
    // This would require a blocked_users table

    // Order by relevance (exact matches first, then by followers)
    queryBuilder = queryBuilder
      .order('followers_count', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: users, error, count } = await queryBuilder;

    if (error) throw error;

    // Calculate relevance score for better ordering
    const usersWithScore = users.map(user => {
      let score = 0;
      
      // Exact username match gets highest score
      if (user.username?.toLowerCase() === sanitizedQuery) {
        score += 100;
      } else if (user.username?.toLowerCase().startsWith(sanitizedQuery)) {
        score += 50;
      } else if (user.username?.toLowerCase().includes(sanitizedQuery)) {
        score += 25;
      }

      // Full name match
      if (user.full_name?.toLowerCase().includes(sanitizedQuery)) {
        score += 20;
      }

      // Bio match (less relevant)
      if (user.bio?.toLowerCase().includes(sanitizedQuery)) {
        score += 10;
      }

      // Verified users get bonus
      if (user.verified) {
        score += 15;
      }

      // Follower count contributes to score (logarithmic scale)
      score += Math.log10(user.followers_count + 1) * 5;

      return {
        ...user,
        relevance_score: score
      };
    });

    // Re-sort by relevance score
    const sortedUsers = usersWithScore.sort((a, b) => b.relevance_score - a.relevance_score);

    return {
      success: true,
      data: sortedUsers,
      total: count,
      query: sanitizedQuery
    };

  } catch (error) {
    console.error('Error searching users:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0
    };
  }
};

/**
 * Search for posts by caption or user
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum number of results (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.userId - Current user ID (for filtering blocked users)
 * @param {string} options.sortBy - Sort order: 'relevance', 'recent', 'popular' (default: 'relevance')
 * @returns {Promise<Array>} Array of matching posts
 */
export const searchPosts = async (query, options = {}) => {
  try {
    const {
      limit = DEFAULT_LIMIT,
      offset = 0,
      userId = null,
      sortBy = 'relevance'
    } = options;

    // Validate query
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
        total: 0,
        message: 'Empty query'
      };
    }

    const sanitizedQuery = query.trim().toLowerCase();
    const searchPattern = `%${sanitizedQuery}%`;

    // Build query
    let queryBuilder = supabase
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
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `, { count: 'exact' });

    // Only search public posts
    queryBuilder = queryBuilder.eq('visibility', 'public');

    // Search in caption
    queryBuilder = queryBuilder.ilike('caption', searchPattern);

    // Apply sorting
    if (sortBy === 'recent') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
      queryBuilder = queryBuilder.order('likes_count', { ascending: false });
    } else {
      // Default to creation date for now, will re-sort by relevance
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await queryBuilder;

    if (error) throw error;

    // Calculate relevance score if sorting by relevance
    if (sortBy === 'relevance') {
      const postsWithScore = posts.map(post => {
        let score = 0;
        
        // Caption relevance
        const caption = post.caption?.toLowerCase() || '';
        if (caption.includes(sanitizedQuery)) {
          // Exact phrase match
          score += 50;
          
          // Word position matters (earlier = better)
          const position = caption.indexOf(sanitizedQuery);
          score += Math.max(0, 20 - (position / 10));
        }

        // Engagement score
        score += (post.likes_count || 0) * 0.1;
        score += (post.comments_count || 0) * 0.3;
        score += (post.save_count || 0) * 0.5;

        // Recency bonus (newer posts get slight boost)
        const daysSinceCreation = (Date.now() - new Date(post.created_at)) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 10 - daysSinceCreation);

        // Verified user bonus
        if (post.profiles?.verified) {
          score += 5;
        }

        return {
          ...post,
          relevance_score: score
        };
      });

      // Sort by relevance
      const sortedPosts = postsWithScore.sort((a, b) => b.relevance_score - a.relevance_score);

      return {
        success: true,
        data: sortedPosts,
        total: count,
        query: sanitizedQuery
      };
    }

    return {
      success: true,
      data: posts,
      total: count,
      query: sanitizedQuery
    };

  } catch (error) {
    console.error('Error searching posts:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0
    };
  }
};

/**
 * Search for boltz by caption or user
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum number of results (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @param {string} options.userId - Current user ID (for filtering blocked users)
 * @param {string} options.sortBy - Sort order: 'relevance', 'recent', 'popular' (default: 'relevance')
 * @returns {Promise<Array>} Array of matching boltz
 */
export const searchBoltz = async (query, options = {}) => {
  try {
    const {
      limit = DEFAULT_LIMIT,
      offset = 0,
      userId = null,
      sortBy = 'relevance'
    } = options;

    // Validate query
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
        total: 0,
        message: 'Empty query'
      };
    }

    const sanitizedQuery = query.trim().toLowerCase();
    const searchPattern = `%${sanitizedQuery}%`;

    // Build query
    let queryBuilder = supabase
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
        profiles:user_id (
          id,
          username,
          full_name,
          avatar_url,
          verified
        )
      `, { count: 'exact' });

    // Only search public boltz
    queryBuilder = queryBuilder.eq('visibility', 'public');

    // Search in caption
    queryBuilder = queryBuilder.ilike('caption', searchPattern);

    // Apply sorting
    if (sortBy === 'recent') {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    } else if (sortBy === 'popular') {
      queryBuilder = queryBuilder.order('views_count', { ascending: false });
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: boltz, error, count } = await queryBuilder;

    if (error) throw error;

    // Calculate relevance score if sorting by relevance
    if (sortBy === 'relevance') {
      const boltzWithScore = boltz.map(bolt => {
        let score = 0;
        
        const caption = bolt.caption?.toLowerCase() || '';
        if (caption.includes(sanitizedQuery)) {
          score += 50;
          const position = caption.indexOf(sanitizedQuery);
          score += Math.max(0, 20 - (position / 10));
        }

        // Engagement (views more important for videos)
        score += (bolt.views_count || 0) * 0.05;
        score += (bolt.likes_count || 0) * 0.2;
        score += (bolt.comments_count || 0) * 0.5;
        score += (bolt.save_count || 0) * 0.7;

        // Recency
        const daysSinceCreation = (Date.now() - new Date(bolt.created_at)) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 10 - daysSinceCreation);

        if (bolt.profiles?.verified) {
          score += 5;
        }

        return {
          ...bolt,
          relevance_score: score
        };
      });

      const sortedBoltz = boltzWithScore.sort((a, b) => b.relevance_score - a.relevance_score);

      return {
        success: true,
        data: sortedBoltz,
        total: count,
        query: sanitizedQuery
      };
    }

    return {
      success: true,
      data: boltz,
      total: count,
      query: sanitizedQuery
    };

  } catch (error) {
    console.error('Error searching boltz:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0
    };
  }
};

/**
 * Search for hashtags by name
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum number of results (default: 20)
 * @param {number} options.offset - Pagination offset (default: 0)
 * @returns {Promise<Array>} Array of matching hashtags
 */
export const searchHashtags = async (query, options = {}) => {
  try {
    const {
      limit = DEFAULT_LIMIT,
      offset = 0
    } = options;

    // Validate query
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: [],
        total: 0,
        message: 'Empty query'
      };
    }

    // Remove # if present
    let sanitizedQuery = query.trim().toLowerCase().replace(/^#/, '');
    const searchPattern = `%${sanitizedQuery}%`;

    // Build query
    const { data: hashtags, error, count } = await supabase
      .from('hashtags')
      .select(`
        id,
        name,
        posts_count,
        boltz_count,
        created_at
      `, { count: 'exact' })
      .ilike('name', searchPattern)
      .order('posts_count', { ascending: false })
      .order('boltz_count', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Calculate relevance and total usage
    const hashtagsWithScore = hashtags.map(hashtag => {
      let score = 0;
      
      // Exact match
      if (hashtag.name.toLowerCase() === sanitizedQuery) {
        score += 100;
      } else if (hashtag.name.toLowerCase().startsWith(sanitizedQuery)) {
        score += 50;
      } else {
        score += 25;
      }

      // Usage count
      const totalCount = (hashtag.posts_count || 0) + (hashtag.boltz_count || 0);
      score += Math.log10(totalCount + 1) * 10;

      return {
        ...hashtag,
        total_count: totalCount,
        relevance_score: score
      };
    });

    // Sort by relevance
    const sortedHashtags = hashtagsWithScore.sort((a, b) => b.relevance_score - a.relevance_score);

    return {
      success: true,
      data: sortedHashtags,
      total: count,
      query: sanitizedQuery
    };

  } catch (error) {
    console.error('Error searching hashtags:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      total: 0
    };
  }
};

/**
 * Combined search across all types
 * @param {string} query - Search query string
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum number of results per type (default: 10)
 * @param {string} options.userId - Current user ID
 * @returns {Promise<Object>} Object containing search results for all types
 */
export const searchAll = async (query, options = {}) => {
  try {
    const { limit = 10, userId = null } = options;

    // Validate query
    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: {
          users: [],
          posts: [],
          boltz: [],
          hashtags: []
        },
        message: 'Empty query'
      };
    }

    // Search all types in parallel
    const [users, posts, boltz, hashtags] = await Promise.all([
      searchUsers(query, { limit, userId }),
      searchPosts(query, { limit, userId }),
      searchBoltz(query, { limit, userId }),
      searchHashtags(query, { limit })
    ]);

    return {
      success: true,
      data: {
        users: users.data,
        posts: posts.data,
        boltz: boltz.data,
        hashtags: hashtags.data
      },
      totals: {
        users: users.total,
        posts: posts.total,
        boltz: boltz.total,
        hashtags: hashtags.total
      },
      query: query.trim()
    };

  } catch (error) {
    console.error('Error in combined search:', error);
    return {
      success: false,
      error: error.message,
      data: {
        users: [],
        posts: [],
        boltz: [],
        hashtags: []
      }
    };
  }
};

/**
 * Get search suggestions as user types
 * @param {string} query - Search query string (partial)
 * @param {object} options - Search options
 * @param {number} options.limit - Maximum number of suggestions (default: 5)
 * @returns {Promise<Array>} Array of suggestions
 */
export const getSearchSuggestions = async (query, options = {}) => {
  try {
    const { limit = 5 } = options;

    // Validate query
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: []
      };
    }

    const sanitizedQuery = query.trim().toLowerCase();

    // Get top matching users and hashtags only (faster)
    const [users, hashtags] = await Promise.all([
      searchUsers(sanitizedQuery, { limit: limit }),
      searchHashtags(sanitizedQuery, { limit: limit })
    ]);

    // Combine and format suggestions
    const suggestions = [
      ...users.data.map(user => ({
        type: 'user',
        id: user.id,
        value: user.username,
        label: user.full_name || user.username,
        avatar: user.avatar_url,
        verified: user.verified,
        subtitle: `@${user.username}`
      })),
      ...hashtags.data.map(hashtag => ({
        type: 'hashtag',
        id: hashtag.id,
        value: hashtag.name,
        label: `#${hashtag.name}`,
        subtitle: `${hashtag.total_count} posts`
      }))
    ];

    // Sort by relevance score and limit
    const topSuggestions = suggestions
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, limit * 2); // Double limit since we have 2 types

    return {
      success: true,
      data: topSuggestions
    };

  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Save search query to recent searches
 * @param {string} userId - User ID
 * @param {string} query - Search query
 * @param {string} searchType - Type of search: 'user', 'post', 'hashtag', etc.
 * @returns {Promise<Object>} Result of save operation
 */
export const saveSearchQuery = async (userId, query, searchType) => {
  try {
    const { error } = await supabase
      .from('search_history')
      .upsert({
        user_id: userId,
        query: query.trim(),
        search_type: searchType,
        searched_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,query'
      });

    if (error) throw error;

    return {
      success: true,
      message: 'Search query saved'
    };

  } catch (error) {
    console.error('Error saving search query:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user's recent searches
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @param {number} options.limit - Maximum number of results (default: 10)
 * @returns {Promise<Array>} Array of recent searches
 */
export const getRecentSearches = async (userId, options = {}) => {
  try {
    const { limit = 10 } = options;

    const { data: searches, error } = await supabase
      .from('search_history')
      .select('query, search_type, searched_at')
      .eq('user_id', userId)
      .order('searched_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: searches
    };

  } catch (error) {
    console.error('Error fetching recent searches:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

/**
 * Clear user's search history
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result of clear operation
 */
export const clearSearchHistory = async (userId) => {
  try {
    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;

    return {
      success: true,
      message: 'Search history cleared'
    };

  } catch (error) {
    console.error('Error clearing search history:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  searchUsers,
  searchPosts,
  searchBoltz,
  searchHashtags,
  searchAll,
  getSearchSuggestions,
  saveSearchQuery,
  getRecentSearches,
  clearSearchHistory
};
