/**
 * Signed URL Manager
 * Manages secure, time-limited URLs for media files
 */

import { supabase, STORAGE_BUCKETS } from '../supabaseClient';

/**
 * Default expiration time for signed URLs (1 hour)
 */
const DEFAULT_EXPIRATION = 60 * 60; // 1 hour in seconds

/**
 * Cache for signed URLs to avoid redundant requests
 */
const urlCache = new Map();

/**
 * Generate a signed URL for a file
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} Signed URL
 */
export const createSignedUrl = async (bucket, path, expiresIn = DEFAULT_EXPIRATION) => {
  if (!bucket || !path) {
    throw new Error('Bucket and path are required');
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Error creating signed URL:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Failed to create signed URL:', error);
    throw error;
  }
};

/**
 * Generate signed URLs for multiple files
 * @param {string} bucket - Storage bucket name
 * @param {Array<string>} paths - Array of file paths
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<Array<Object>>} Array of signed URL objects
 */
export const createSignedUrls = async (bucket, paths, expiresIn = DEFAULT_EXPIRATION) => {
  if (!bucket || !paths || paths.length === 0) {
    throw new Error('Bucket and paths are required');
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrls(paths, expiresIn);

    if (error) {
      console.error('Error creating signed URLs:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create signed URLs:', error);
    throw error;
  }
};

/**
 * Get a cached signed URL or create a new one
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} Signed URL
 */
export const getCachedSignedUrl = async (bucket, path, expiresIn = DEFAULT_EXPIRATION) => {
  const cacheKey = `${bucket}:${path}`;
  const cached = urlCache.get(cacheKey);

  // Check if cached URL is still valid (with 5 minute buffer)
  if (cached && cached.expiresAt > Date.now() + (5 * 60 * 1000)) {
    return cached.url;
  }

  // Create new signed URL
  const signedUrl = await createSignedUrl(bucket, path, expiresIn);

  // Cache the URL
  urlCache.set(cacheKey, {
    url: signedUrl,
    expiresAt: Date.now() + (expiresIn * 1000)
  });

  return signedUrl;
};

/**
 * Clear cached signed URL
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 */
export const clearCachedUrl = (bucket, path) => {
  const cacheKey = `${bucket}:${path}`;
  urlCache.delete(cacheKey);
};

/**
 * Clear all cached signed URLs
 */
export const clearAllCachedUrls = () => {
  urlCache.clear();
};

/**
 * Extract bucket and path from a public URL
 * @param {string} url - Public URL
 * @returns {Object} Bucket and path
 */
export const parseStorageUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { bucket: null, path: null };
  }

  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Supabase storage URL format: /storage/v1/object/public/{bucket}/{path}
    const storageIndex = pathParts.indexOf('storage');
    if (storageIndex === -1) {
      return { bucket: null, path: null };
    }

    const publicIndex = pathParts.indexOf('public', storageIndex);
    if (publicIndex === -1) {
      return { bucket: null, path: null };
    }

    const bucket = pathParts[publicIndex + 1];
    const path = pathParts.slice(publicIndex + 2).join('/');

    return { bucket, path };
  } catch (error) {
    console.error('Error parsing storage URL:', error);
    return { bucket: null, path: null };
  }
};

/**
 * Convert public URL to signed URL
 * @param {string} publicUrl - Public URL
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<string>} Signed URL
 */
export const convertToSignedUrl = async (publicUrl, expiresIn = DEFAULT_EXPIRATION) => {
  const { bucket, path } = parseStorageUrl(publicUrl);

  if (!bucket || !path) {
    console.warn('Could not parse storage URL:', publicUrl);
    return publicUrl; // Return original URL if parsing fails
  }

  try {
    return await getCachedSignedUrl(bucket, path, expiresIn);
  } catch (error) {
    console.error('Error converting to signed URL:', error);
    return publicUrl; // Fallback to public URL on error
  }
};

/**
 * Convert multiple public URLs to signed URLs
 * @param {Array<string>} publicUrls - Array of public URLs
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<Array<string>>} Array of signed URLs
 */
export const convertMultipleToSignedUrls = async (publicUrls, expiresIn = DEFAULT_EXPIRATION) => {
  if (!publicUrls || publicUrls.length === 0) {
    return [];
  }

  const promises = publicUrls.map(url => convertToSignedUrl(url, expiresIn));
  return await Promise.all(promises);
};

/**
 * Refresh a signed URL before it expires
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {number} expiresIn - New expiration time in seconds
 * @returns {Promise<string>} New signed URL
 */
export const refreshSignedUrl = async (bucket, path, expiresIn = DEFAULT_EXPIRATION) => {
  // Clear cached URL
  clearCachedUrl(bucket, path);

  // Create new signed URL
  return await getCachedSignedUrl(bucket, path, expiresIn);
};

/**
 * Check if a URL is a signed URL
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is signed
 */
export const isSignedUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Signed URLs contain a token parameter
  return url.includes('token=') || url.includes('sign=');
};

/**
 * Get expiration time from a signed URL
 * @param {string} signedUrl - Signed URL
 * @returns {Date|null} Expiration date or null
 */
export const getSignedUrlExpiration = (signedUrl) => {
  if (!signedUrl || typeof signedUrl !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(signedUrl);
    const expiresParam = urlObj.searchParams.get('expires') || urlObj.searchParams.get('exp');
    
    if (expiresParam) {
      const timestamp = parseInt(expiresParam, 10);
      return new Date(timestamp * 1000);
    }

    return null;
  } catch (error) {
    console.error('Error parsing signed URL expiration:', error);
    return null;
  }
};

/**
 * Check if a signed URL has expired
 * @param {string} signedUrl - Signed URL
 * @returns {boolean} True if expired
 */
export const isSignedUrlExpired = (signedUrl) => {
  const expiration = getSignedUrlExpiration(signedUrl);
  
  if (!expiration) {
    return false; // Can't determine, assume not expired
  }

  return expiration < new Date();
};

/**
 * Upload file and get signed URL
 * @param {string} bucket - Storage bucket name
 * @param {File} file - File to upload
 * @param {string} path - Destination path
 * @param {number} expiresIn - Expiration time for signed URL
 * @returns {Promise<Object>} Upload result with signed URL
 */
export const uploadAndGetSignedUrl = async (bucket, file, path, expiresIn = DEFAULT_EXPIRATION) => {
  try {
    // Upload file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create signed URL
    const signedUrl = await createSignedUrl(bucket, path, expiresIn);

    return {
      data: {
        ...uploadData,
        signedUrl
      },
      error: null
    };
  } catch (error) {
    console.error('Error uploading and creating signed URL:', error);
    return {
      data: null,
      error
    };
  }
};

/**
 * Helper functions for specific buckets
 */
export const avatarSignedUrl = (path, expiresIn) => 
  getCachedSignedUrl(STORAGE_BUCKETS.AVATARS, path, expiresIn);

export const postSignedUrl = (path, expiresIn) => 
  getCachedSignedUrl(STORAGE_BUCKETS.POSTS, path, expiresIn);

export const boltzSignedUrl = (path, expiresIn) => 
  getCachedSignedUrl(STORAGE_BUCKETS.BOLTZ, path, expiresIn);

export const flashSignedUrl = (path, expiresIn) => 
  getCachedSignedUrl(STORAGE_BUCKETS.FLASH, path, expiresIn);

export const messageSignedUrl = (path, expiresIn) => 
  getCachedSignedUrl(STORAGE_BUCKETS.MESSAGES, path, expiresIn);

/**
 * Automatically refresh signed URLs before they expire
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {Function} callback - Callback function to receive new URL
 * @param {number} refreshBeforeMs - Refresh this many ms before expiration
 * @returns {Function} Cleanup function
 */
export const autoRefreshSignedUrl = (bucket, path, callback, refreshBeforeMs = 5 * 60 * 1000) => {
  let timeoutId = null;

  const scheduleRefresh = async () => {
    try {
      const cacheKey = `${bucket}:${path}`;
      const cached = urlCache.get(cacheKey);

      if (cached) {
        const timeUntilExpiry = cached.expiresAt - Date.now();
        const refreshTime = Math.max(0, timeUntilExpiry - refreshBeforeMs);

        timeoutId = setTimeout(async () => {
          const newUrl = await refreshSignedUrl(bucket, path);
          callback(newUrl);
          scheduleRefresh(); // Schedule next refresh
        }, refreshTime);
      }
    } catch (error) {
      console.error('Error scheduling signed URL refresh:', error);
    }
  };

  scheduleRefresh();

  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
};

export default {
  createSignedUrl,
  createSignedUrls,
  getCachedSignedUrl,
  clearCachedUrl,
  clearAllCachedUrls,
  parseStorageUrl,
  convertToSignedUrl,
  convertMultipleToSignedUrls,
  refreshSignedUrl,
  isSignedUrl,
  getSignedUrlExpiration,
  isSignedUrlExpired,
  uploadAndGetSignedUrl,
  autoRefreshSignedUrl,
  // Bucket-specific helpers
  avatarSignedUrl,
  postSignedUrl,
  boltzSignedUrl,
  flashSignedUrl,
  messageSignedUrl
};
