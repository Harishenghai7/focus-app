// Feed cache utility for offline functionality
class FeedCache {
  constructor() {
    this.cachePrefix = 'focus_feed_';
    this.maxCacheAge = 30 * 60 * 1000; // 30 minutes
  }

  // Get cached feed for user
  async getFeed(userId) {
    try {
      const cacheKey = `${this.cachePrefix}${userId}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return [];
      
      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > this.maxCacheAge) {
        localStorage.removeItem(cacheKey);
        return [];
      }
      
      return data || [];
    } catch (error) {

      return [];
    }
  }

  // Save feed to cache
  async saveFeed(userId, posts) {
    try {
      const cacheKey = `${this.cachePrefix}${userId}`;
      const cacheData = {
        data: posts,
        timestamp: Date.now()
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {

    }
  }

  // Update specific post in cache
  async updatePost(postId, updatedPost) {
    try {
      // This would need userId to work properly, for now just log

    } catch (error) {

    }
  }

  // Delete post from cache
  async deletePost(postId) {
    try {
      // This would need userId to work properly, for now just log

    } catch (error) {

    }
  }

  // Clear user's feed cache
  async clearUserFeed(userId) {
    try {
      const cacheKey = `${this.cachePrefix}${userId}`;
      localStorage.removeItem(cacheKey);
    } catch (error) {

    }
  }

  // Clear all feed caches
  clearAllCaches() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.cachePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {

    }
  }
}

// Create singleton instance
export const feedCache = new FeedCache();
export default feedCache;