/**
 * Query Cache Manager
 * Implements client-side caching for database queries
 */

class QueryCache {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Generate cache key from query parameters
   */
  generateKey(table, query, params = {}) {
    const paramsStr = JSON.stringify(params);
    return `${table}:${query}:${paramsStr}`;
  }

  /**
   * Get cached data
   */
  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access time for LRU
    cached.lastAccessed = Date.now();
    
    return cached.data;
  }

  /**
   * Set cached data
   */
  set(key, data, ttl = this.defaultTTL) {
    // Enforce max size with LRU eviction
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
      lastAccessed: Date.now(),
      createdAt: Date.now()
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key) {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Invalidate all entries for a table
   */
  invalidateTable(table) {
    return this.invalidatePattern(`^${table}:`);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        size: JSON.stringify(value.data).length,
        age: Date.now() - value.createdAt,
        ttl: value.expiresAt - Date.now()
      }))
    };
  }

  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;
    
    for (const [key, value] of this.cache.entries()) {
      if (value.lastAccessed < oldestTime) {
        oldestTime = value.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Start automatic cleanup
   */
  startCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      const cleaned = this.cleanup();
      if (cleaned > 0) {
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop automatic cleanup
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Create singleton instance
const queryCache = new QueryCache({
  maxSize: 100,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 60 * 1000 // 1 minute
});

/**
 * Cached query wrapper for Supabase
 */
export async function cachedQuery(supabase, table, queryFn, options = {}) {
  const {
    cacheKey = null,
    ttl = null,
    forceRefresh = false,
    params = {}
  } = options;
  
  // Generate cache key
  const key = cacheKey || queryCache.generateKey(table, queryFn.toString(), params);
  
  // Check cache if not forcing refresh
  if (!forceRefresh) {
    const cached = queryCache.get(key);
    if (cached !== null) {
      return { data: cached, error: null, fromCache: true };
    }
  }
  
  // Execute query
  const query = supabase.from(table);
  const { data, error } = await queryFn(query);
  
  // Cache successful results
  if (!error && data) {
    queryCache.set(key, data, ttl);
  }
  
  return { data, error, fromCache: false };
}

/**
 * Invalidate cache for specific table
 */
export function invalidateTableCache(table) {
  return queryCache.invalidateTable(table);
}

/**
 * Invalidate specific cache entry
 */
export function invalidateCache(key) {
  return queryCache.invalidate(key);
}

/**
 * Clear all cache
 */
export function clearQueryCache() {
  queryCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return queryCache.getStats();
}

/**
 * Prefetch and cache query
 */
export async function prefetchQuery(supabase, table, queryFn, options = {}) {
  return cachedQuery(supabase, table, queryFn, { ...options, forceRefresh: true });
}

/**
 * Cache decorator for query functions
 */
export function withCache(ttl = null) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
      
      const cached = queryCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
      
      const result = await originalMethod.apply(this, args);
      queryCache.set(cacheKey, result, ttl);
      
      return result;
    };
    
    return descriptor;
  };
}

export default queryCache;
