// API client with retry logic, timeout, and error handling
import { supabase } from '../supabaseClient';
import { retryWithBackoff, withTimeout, handleError } from './errorHandler';
import { logApiError } from './errorLogger';
import offlineManager from './offlineManager';

class ApiClient {
  constructor() {
    this.defaultTimeout = 30000; // 30 seconds
    this.defaultRetries = 3;
  }

  // Execute query with retry and timeout
  async execute(queryFn, options = {}) {
    const {
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
      cache = false,
      cacheKey = null,
      cacheTTL = 300000, // 5 minutes
      offlineQueue = false,
      offlineAction = null
    } = options;

    // Check cache first
    if (cache && cacheKey) {
      const cached = offlineManager.getCachedData(cacheKey);
      if (cached) {
        return { data: cached, error: null, fromCache: true };
      }
    }

    // Check if offline and should queue
    if (!navigator.onLine && offlineQueue && offlineAction) {
      offlineManager.queueAction(offlineAction);
      return { 
        data: null, 
        error: 'Offline - action queued', 
        queued: true 
      };
    }

    try {
      // Execute with retry and timeout
      const result = await retryWithBackoff(
        async () => {
          const queryResult = await withTimeout(queryFn(), timeout);
          
          if (queryResult.error) {
            throw queryResult.error;
          }
          
          return queryResult;
        },
        retries
      );

      // Cache successful result
      if (cache && cacheKey && result.data) {
        offlineManager.cacheData(cacheKey, result.data, cacheTTL);
      }

      return result;
    } catch (error) {
      const errorInfo = handleError(error);
      logApiError(error, options.endpoint || 'unknown');
      
      // Return cached data as fallback if available
      if (cache && cacheKey) {
        const cached = offlineManager.getCachedData(cacheKey);
        if (cached) {
          return { 
            data: cached, 
            error: errorInfo.message, 
            fromCache: true,
            stale: true 
          };
        }
      }
      
      return { data: null, error: errorInfo.message };
    }
  }

  // Fetch with GET semantics
  async fetch(table, options = {}) {
    const {
      select = '*',
      filters = {},
      order = null,
      limit = null,
      offset = null,
      single = false,
      ...apiOptions
    } = options;

    return this.execute(
      async () => {
        let query = supabase.from(table).select(select);

        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });

        // Apply order
        if (order) {
          const [column, direction = 'asc'] = order.split(':');
          query = query.order(column, { ascending: direction === 'asc' });
        }

        // Apply pagination
        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 10) - 1);

        // Execute
        return single ? query.maybeSingle() : query;
      },
      {
        ...apiOptions,
        endpoint: `GET /${table}`,
        cache: true,
        cacheKey: apiOptions.cacheKey || `${table}_${JSON.stringify(filters)}`
      }
    );
  }

  // Insert with POST semantics
  async insert(table, data, options = {}) {
    return this.execute(
      async () => supabase.from(table).insert(data).select(),
      {
        ...options,
        endpoint: `POST /${table}`,
        retries: 2,
        offlineQueue: true,
        offlineAction: {
          type: 'insert',
          table,
          data,
          timestamp: Date.now()
        }
      }
    );
  }

  // Update with PATCH semantics
  async update(table, id, data, options = {}) {
    return this.execute(
      async () => supabase.from(table).update(data).eq('id', id).select(),
      {
        ...options,
        endpoint: `PATCH /${table}/${id}`,
        retries: 2,
        offlineQueue: true,
        offlineAction: {
          type: 'update',
          table,
          id,
          data,
          timestamp: Date.now()
        }
      }
    );
  }

  // Delete with DELETE semantics
  async delete(table, id, options = {}) {
    return this.execute(
      async () => supabase.from(table).delete().eq('id', id),
      {
        ...options,
        endpoint: `DELETE /${table}/${id}`,
        retries: 2,
        offlineQueue: true,
        offlineAction: {
          type: 'delete',
          table,
          id,
          timestamp: Date.now()
        }
      }
    );
  }

  // RPC call
  async rpc(functionName, params = {}, options = {}) {
    return this.execute(
      async () => supabase.rpc(functionName, params),
      {
        ...options,
        endpoint: `RPC /${functionName}`,
        cache: options.cache || false
      }
    );
  }

  // Upload file
  async uploadFile(bucket, path, file, options = {}) {
    const {
      onProgress = null,
      ...apiOptions
    } = options;

    return this.execute(
      async () => {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
            onUploadProgress: onProgress
          });

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(path);

        return { data: { ...data, publicUrl }, error: null };
      },
      {
        ...apiOptions,
        endpoint: `UPLOAD /${bucket}/${path}`,
        timeout: 120000, // 2 minutes for uploads
        retries: 2
      }
    );
  }

  // Download file
  async downloadFile(bucket, path, options = {}) {
    return this.execute(
      async () => supabase.storage.from(bucket).download(path),
      {
        ...options,
        endpoint: `DOWNLOAD /${bucket}/${path}`,
        timeout: 60000, // 1 minute for downloads
        retries: 2
      }
    );
  }

  // Batch operations
  async batch(operations, options = {}) {
    const results = await Promise.allSettled(
      operations.map(op => this.execute(op.fn, { ...options, ...op.options }))
    );

    const successes = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);
    
    const errors = results
      .filter(r => r.status === 'rejected')
      .map(r => r.reason);

    return {
      successes,
      errors,
      successCount: successes.length,
      errorCount: errors.length,
      total: operations.length
    };
  }

  // Clear cache
  clearCache(pattern = null) {
    if (pattern) {
      // Clear specific cache entries
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('focus_cache_') && key.includes(pattern)) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Clear all cache
      offlineManager.clearCache();
    }
  }

  // Prefetch data
  async prefetch(queries) {
    const results = await this.batch(
      queries.map(q => ({
        fn: q.fn,
        options: { ...q.options, cache: true }
      })),
      { retries: 1 }
    );
    return results;
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export convenience methods
export const fetchData = (table, options) => apiClient.fetch(table, options);
export const insertData = (table, data, options) => apiClient.insert(table, data, options);
export const updateData = (table, id, data, options) => apiClient.update(table, id, data, options);
export const deleteData = (table, id, options) => apiClient.delete(table, id, options);
export const callRpc = (functionName, params, options) => apiClient.rpc(functionName, params, options);
export const uploadFile = (bucket, path, file, options) => apiClient.uploadFile(bucket, path, file, options);
export const downloadFile = (bucket, path, options) => apiClient.downloadFile(bucket, path, options);
export const batchOperations = (operations, options) => apiClient.batch(operations, options);
export const clearCache = (pattern) => apiClient.clearCache(pattern);
export const prefetchData = (queries) => apiClient.prefetch(queries);

export default apiClient;
