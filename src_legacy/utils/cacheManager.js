/**
 * Cache Manager - Handles stale cache issues and prevents ghost content
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.maxAge = 5 * 60 * 1000; // 5 minutes default
    this.maxSize = 1000; // Maximum cache entries
  }

  // Set cache with timestamp
  set(key, value, customMaxAge = null) {
    const maxAge = customMaxAge || this.maxAge;
    
    // Clean up if cache is too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, value);
    this.timestamps.set(key, {
      created: Date.now(),
      maxAge
    });
  }

  // Get cache with staleness check
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const timestamp = this.timestamps.get(key);
    if (!timestamp) {
      this.cache.delete(key);
      return null;
    }
    
    const age = Date.now() - timestamp.created;
    if (age > timestamp.maxAge) {
      // Stale cache
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  // Check if cache exists and is fresh
  has(key) {
    return this.get(key) !== null;
  }

  // Invalidate specific cache
  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    const toDelete = [];
    
    for (const [key, timestamp] of this.timestamps.entries()) {
      const age = now - timestamp.created;
      if (age > timestamp.maxAge) {
        toDelete.push(key);
      }
    }
    
    // Remove oldest entries if still too large
    if (this.cache.size - toDelete.length >= this.maxSize) {
      const sortedEntries = Array.from(this.timestamps.entries())
        .sort((a, b) => a[1].created - b[1].created);
      
      const additionalToDelete = sortedEntries
        .slice(0, Math.floor(this.maxSize * 0.2))
        .map(([key]) => key);
      
      toDelete.push(...additionalToDelete);
    }
    
    toDelete.forEach(key => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  // Cache for posts with content validation
  cachePost(postId, postData) {
    // Validate post data before caching
    if (!postData || !postData.id || postData.deleted) {
      return false;
    }
    
    this.set(`post:${postId}`, postData, 2 * 60 * 1000); // 2 minutes for posts
    return true;
  }

  // Get cached post with validation
  getCachedPost(postId) {
    const cached = this.get(`post:${postId}`);
    
    if (cached && cached.deleted) {
      // Remove deleted posts from cache
      this.invalidate(`post:${postId}`);
      return null;
    }
    
    return cached;
  }

  // Cache user data
  cacheUser(userId, userData) {
    if (!userData || !userData.id) {
      return false;
    }
    
    this.set(`user:${userId}`, userData, 10 * 60 * 1000); // 10 minutes for users
    return true;
  }

  // Cache feed data with deduplication
  cacheFeed(feedKey, posts) {
    if (!Array.isArray(posts)) {
      return false;
    }
    
    // Remove duplicates and deleted posts
    const validPosts = posts.filter(post => 
      post && post.id && !post.deleted
    );
    
    const uniquePosts = validPosts.reduce((acc, post) => {
      if (!acc.find(p => p.id === post.id)) {
        acc.push(post);
      }
      return acc;
    }, []);
    
    this.set(`feed:${feedKey}`, uniquePosts, 3 * 60 * 1000); // 3 minutes for feeds
    return true;
  }

  // Invalidate user-related cache when user is blocked/muted
  invalidateUserContent(userId) {
    this.invalidatePattern(`post:.*user_id.*${userId}`);
    this.invalidatePattern(`feed:.*`); // Invalidate all feeds
    this.invalidate(`user:${userId}`);
  }

  // Invalidate post-related cache when post is deleted
  invalidatePostContent(postId) {
    this.invalidate(`post:${postId}`);
    this.invalidatePattern(`feed:.*`); // Invalidate feeds containing this post
    this.invalidatePattern(`comments:${postId}`);
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Auto cleanup every 2 minutes
setInterval(() => {
  cacheManager.cleanup();
}, 2 * 60 * 1000);

export default CacheManager;