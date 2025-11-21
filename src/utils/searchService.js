import supabase from '../supabaseClient';

class SearchService {
  constructor() {
    this.searchCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Perform comprehensive search across users, posts, hashtags
  async search(query, type = 'all', limit = 10) {
    if (!query || query.trim().length === 0) {
      return { users: [], posts: [], hashtags: [] };
    }
    const trimmedQuery = query.trim();
    const cacheKey = `${type}-${trimmedQuery}-${limit}`;

    // Return cached results if within timeout
    if (this.searchCache.has(cacheKey)) {
      const cached = this.searchCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
      this.searchCache.delete(cacheKey);
    }

    try {
      let results = { users: [], posts: [], hashtags: [] };

      if (type === 'all' || type === 'users')
        results.users = await this.searchUsers(trimmedQuery, limit);

      if (type === 'all' || type === 'posts')
        results.posts = await this.searchPosts(trimmedQuery, limit);

      if (type === 'all' || type === 'hashtags')
        results.hashtags = await this.searchHashtags(trimmedQuery, limit);

      // Cache results
      this.searchCache.set(cacheKey, {
        data: results,
        timestamp: Date.now(),
      });

      return results;
    } catch (error) {
      console.error('Search error', error);
      throw error;
    }
  }

  // Search users by username, fullname, or bio
  async searchUsers(query, limit = 10) {
    try {
      const ilikeQuery = `%${query}%`;
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `id, username, fullname, avatarurl, bio, isverified, followercount`
        )
        .or(`username.ilike.${ilikeQuery},fullname.ilike.${ilikeQuery},bio.ilike.${ilikeQuery}`)
        .order('followercount', { ascending: false })
        .limit(limit);
      if (error) throw error;

      return data
        .map((user) => ({
          ...user,
          resulttype: 'user',
          relevance: this.calculateUserRelevance(user, query),
        }))
        .sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('User search error', error);
      return [];
    }
  }

  // Search posts by caption
  async searchPosts(query, limit = 10) {
    try {
      const ilikeQuery = `%${query}%`;
      const { data, error } = await supabase
        .from('posts')
        .select(
          `id, caption, mediaurl, mediaurls, mediatype, mediatypes, iscarousel, likecount, commentcount, createdat, profiles!postsuseridfkey(id, username, fullname, avatarurl, isverified)`
        )
        .ilike('caption', ilikeQuery)
        .order('createdat', { ascending: false })
        .limit(limit);
      if (error) throw error;

      return data
        .map((post) => ({
          ...post,
          resulttype: 'post',
          thumbnailurl: post.iscarousel ? post.mediaurls?.[0] : post.mediaurl,
          relevance: this.calculatePostRelevance(post, query),
        }))
        .sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Post search error', error);
      return [];
    }
  }

  // Search hashtags
  async searchHashtags(query, limit = 10) {
    try {
      const cleanQuery = query.replace(/^#/, '');
      const ilikeQuery = `%${cleanQuery}%`;
      const { data, error } = await supabase
        .from('hashtags')
        .select('id, tag, postcount, trendingscore')
        .ilike('tag', ilikeQuery)
        .order('postcount', { ascending: false })
        .limit(limit);
      if (error) throw error;

      return data
        .map((hashtag) => ({
          ...hashtag,
          resulttype: 'hashtag',
          relevance: this.calculateHashtagRelevance(hashtag, cleanQuery),
        }))
        .sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Hashtag search error', error);
      return [];
    }
  }

  // Get autocomplete suggestions combining users and hashtags
  async getAutocompleteSuggestions(query, limit = 5) {
    if (!query || query.trim().length < 2) return [];
    const trimmedQuery = query.trim();
    const suggestions = [];

    try {
      // User suggestions
      const { data: users } = await supabase
        .from('profiles')
        .select('username, avatarurl, isverified')
        .ilike('username', `%${trimmedQuery}%`)
        .order('followercount', { ascending: false })
        .limit(3);

      if (users) {
        suggestions.push(
          ...users.map((user) => ({
            type: 'user',
            text: user.username,
            icon: user.avatarurl,
            verified: user.isverified,
          }))
        );
      }

      // Hashtag suggestions
      const cleanQuery = trimmedQuery.replace(/^#/, '');
      const { data: hashtags } = await supabase
        .from('hashtags')
        .select('tag, postcount')
        .ilike('tag', `%${cleanQuery}%`)
        .order('postcount', { ascending: false })
        .limit(3);

      if (hashtags) {
        suggestions.push(
          ...hashtags.map((hashtag) => ({
            type: 'hashtag',
            text: `#${hashtag.tag}`,
            count: hashtag.postcount,
          }))
        );
      }

      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Autocomplete error', error);
      return [];
    }
  }

  // Save search to history (database and localstorage fallback)
  async saveSearchHistory(userId, query, resultType = null, resultId = null) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    try {
      await supabase.from('searchhistory').insert({
        userid: userId,
        query: trimmedQuery,
        resulttype: resultType,
        resultid: resultId,
      });

      // Also save locally
      const localHistory = this.getLocalSearchHistory(userId, 50);
      const newEntry = {
        id: Date.now().toString(),
        query: trimmedQuery,
        resulttype: resultType,
        createdat: new Date().toISOString(),
      };
      const updatedHistory = [
        newEntry,
        ...localHistory.filter((h) => h.query !== trimmedQuery),
      ].slice(0, 50);
      this.saveLocalSearchHistory(userId, updatedHistory);
    } catch (dbError) {
      // Fallback saving to localstorage only
      const localHistory = this.getLocalSearchHistory(userId, 50);
      const newEntry = {
        id: Date.now().toString(),
        query: trimmedQuery,
        resulttype: resultType,
        createdat: new Date().toISOString(),
      };
      const updatedHistory = [
        newEntry,
        ...localHistory.filter((h) => h.query !== trimmedQuery),
      ].slice(0, 50);
      this.saveLocalSearchHistory(userId, updatedHistory);
      console.error('Error saving search history', dbError);
    }
  }

  // Get user search history from database, fallback to localstorage
  async getSearchHistory(userId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('searchhistory')
        .select('id, query, resulttype, createdat')
        .eq('userid', userId)
        .order('createdat', { ascending: false })
        .limit(limit);
      if (error) throw error;

      // Remove duplicates keeping most recent
      const uniqueSearches = [];
      const seenQueries = new Set();
      for (const search of data) {
        if (!seenQueries.has(search.query.toLowerCase())) {
          uniqueSearches.push(search);
          seenQueries.add(search.query.toLowerCase());
        }
      }

      // Save to local storage as backup
      this.saveLocalSearchHistory(userId, uniqueSearches);

      return uniqueSearches;
    } catch (error) {
      console.error('Error fetching search history', error);
      return this.getLocalSearchHistory(userId, limit);
    }
  }

  // Local storage methods
  getLocalSearchHistory(userId, limit = 10) {
    try {
      const key = `searchhistory_${userId}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const history = JSON.parse(stored);
      return history.slice(0, limit);
    } catch {
      return [];
    }
  }

  saveLocalSearchHistory(userId, history) {
    try {
      const key = `searchhistory_${userId}`;
      localStorage.setItem(key, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving local search history', error);
    }
  }

  async clearSearchHistory(userId) {
    try {
      const { error } = await supabase
        .from('searchhistory')
        .delete()
        .eq('userid', userId);
      if (error) throw error;

      const key = `searchhistory_${userId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing search history', error);
      // Fallback
      const key = `searchhistory_${userId}`;
      localStorage.removeItem(key);
    }
  }

  async deleteSearchHistoryItem(searchId) {
    try {
      const { error } = await supabase
        .from('searchhistory')
        .delete()
        .eq('id', searchId);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting search history item', error);
      throw error;
    }
  }

  // Relevance calculation helpers
  calculateUserRelevance(user, query) {
    const lowerQuery = query.toLowerCase();
    let score = 0;
    if (user.username?.toLowerCase() === lowerQuery) score += 100;
    else if (user.username?.toLowerCase().startsWith(lowerQuery)) score += 50;
    else if (user.username?.toLowerCase().includes(lowerQuery)) score += 25;

    if (user.fullname?.toLowerCase().includes(lowerQuery)) score += 20;
    if (user.bio?.toLowerCase().includes(lowerQuery)) score += 10;
    if (user.isverified) score += 15;
    score += Math.min(user.followercount || 0, 100) / 10;
    return score;
  }

  calculatePostRelevance(post, query) {
    const lowerQuery = query.toLowerCase();
    const caption = post.caption?.toLowerCase() || '';
    let score = 0;

    const occurrences = (caption.match(new RegExp(lowerQuery, 'g')) || []).length;
    score += occurrences * 20;

    const position = caption.indexOf(lowerQuery);
    if (position !== -1) score += Math.max(0, 50 - position);

    const ageInDays = (Date.now() - new Date(post.createdat).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - ageInDays);

    score += Math.min(post.likecount || 0, 50) / 10;
    score += Math.min(post.commentcount || 0, 20) / 10;

    return score;
  }

  calculateHashtagRelevance(hashtag, query) {
    const lowerQuery = query.toLowerCase();
    const tag = hashtag.tag.toLowerCase();
    let score = 0;

    if (tag === lowerQuery) score += 100;
    else if (tag.startsWith(lowerQuery)) score += 50;
    else if (tag.includes(lowerQuery)) score += 25;

    score += Math.min(hashtag.postcount || 0, 100) / 10;
    score += Math.min(hashtag.trendingscore || 0, 50) / 10;

    return score;
  }

  clearCache() {
    this.searchCache.clear();
  }
}

const searchService = new SearchService();
export default searchService;
