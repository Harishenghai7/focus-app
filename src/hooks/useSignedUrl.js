/**
 * React Hook for Signed URLs
 * Provides easy integration of signed URLs in React components
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getCachedSignedUrl,
  convertToSignedUrl,
  convertMultipleToSignedUrls,
  refreshSignedUrl,
  autoRefreshSignedUrl,
  isSignedUrl,
  isSignedUrlExpired
} from '../utils/signedUrlManager';

/**
 * Hook for managing a single signed URL
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {Object} options - Hook options
 * @returns {Object} Signed URL state and functions
 */
export const useSignedUrl = (bucket, path, options = {}) => {
  const {
    expiresIn = 3600, // 1 hour default
    autoRefresh = true,
    refreshBeforeMs = 5 * 60 * 1000, // Refresh 5 minutes before expiry
    enabled = true
  } = options;

  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load signed URL
  const loadSignedUrl = useCallback(async () => {
    if (!enabled || !bucket || !path) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const url = await getCachedSignedUrl(bucket, path, expiresIn);
      setSignedUrl(url);
    } catch (err) {
      console.error('Error loading signed URL:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bucket, path, expiresIn, enabled]);

  // Refresh signed URL
  const refresh = useCallback(async () => {
    if (!bucket || !path) return;

    try {
      setLoading(true);
      setError(null);

      const url = await refreshSignedUrl(bucket, path, expiresIn);
      setSignedUrl(url);
    } catch (err) {
      console.error('Error refreshing signed URL:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bucket, path, expiresIn]);

  // Load URL on mount and when dependencies change
  useEffect(() => {
    loadSignedUrl();
  }, [loadSignedUrl]);

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh || !bucket || !path || !signedUrl) {
      return;
    }

    const cleanup = autoRefreshSignedUrl(
      bucket,
      path,
      (newUrl) => setSignedUrl(newUrl),
      refreshBeforeMs
    );

    return cleanup;
  }, [autoRefresh, bucket, path, signedUrl, refreshBeforeMs]);

  return {
    signedUrl,
    loading,
    error,
    refresh
  };
};

/**
 * Hook for managing multiple signed URLs
 * @param {string} bucket - Storage bucket name
 * @param {Array<string>} paths - Array of file paths
 * @param {Object} options - Hook options
 * @returns {Object} Signed URLs state and functions
 */
export const useSignedUrls = (bucket, paths, options = {}) => {
  const {
    expiresIn = 3600,
    enabled = true
  } = options;

  const [signedUrls, setSignedUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load signed URLs
  const loadSignedUrls = useCallback(async () => {
    if (!enabled || !bucket || !paths || paths.length === 0) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const urls = await Promise.all(
        paths.map(path => getCachedSignedUrl(bucket, path, expiresIn))
      );

      setSignedUrls(urls);
    } catch (err) {
      console.error('Error loading signed URLs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bucket, paths, expiresIn, enabled]);

  // Refresh all signed URLs
  const refresh = useCallback(async () => {
    if (!bucket || !paths || paths.length === 0) return;

    try {
      setLoading(true);
      setError(null);

      const urls = await Promise.all(
        paths.map(path => refreshSignedUrl(bucket, path, expiresIn))
      );

      setSignedUrls(urls);
    } catch (err) {
      console.error('Error refreshing signed URLs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bucket, paths, expiresIn]);

  // Load URLs on mount and when dependencies change
  useEffect(() => {
    loadSignedUrls();
  }, [loadSignedUrls]);

  return {
    signedUrls,
    loading,
    error,
    refresh
  };
};

/**
 * Hook for converting public URLs to signed URLs
 * @param {string|Array<string>} publicUrls - Public URL(s) to convert
 * @param {Object} options - Hook options
 * @returns {Object} Signed URL(s) state and functions
 */
export const useConvertToSignedUrl = (publicUrls, options = {}) => {
  const {
    expiresIn = 3600,
    enabled = true
  } = options;

  const [signedUrls, setSignedUrls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isArray = Array.isArray(publicUrls);

  // Convert URLs
  const convertUrls = useCallback(async () => {
    if (!enabled || !publicUrls) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (isArray) {
        const urls = await convertMultipleToSignedUrls(publicUrls, expiresIn);
        setSignedUrls(urls);
      } else {
        const url = await convertToSignedUrl(publicUrls, expiresIn);
        setSignedUrls(url);
      }
    } catch (err) {
      console.error('Error converting to signed URLs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [publicUrls, expiresIn, enabled, isArray]);

  // Convert on mount and when dependencies change
  useEffect(() => {
    convertUrls();
  }, [convertUrls]);

  return {
    signedUrls,
    loading,
    error,
    refresh: convertUrls
  };
};

/**
 * Hook for checking if a URL needs refresh
 * @param {string} url - URL to check
 * @returns {Object} URL status
 */
export const useUrlStatus = (url) => {
  const [status, setStatus] = useState({
    isSigned: false,
    isExpired: false,
    needsRefresh: false
  });

  useEffect(() => {
    if (!url) {
      setStatus({
        isSigned: false,
        isExpired: false,
        needsRefresh: false
      });
      return;
    }

    const isSigned = isSignedUrl(url);
    const isExpired = isSigned ? isSignedUrlExpired(url) : false;
    const needsRefresh = isExpired;

    setStatus({
      isSigned,
      isExpired,
      needsRefresh
    });
  }, [url]);

  return status;
};

/**
 * Hook for lazy loading signed URL (only when needed)
 * @param {string} bucket - Storage bucket name
 * @param {string} path - File path in bucket
 * @param {Object} options - Hook options
 * @returns {Object} Signed URL state and load function
 */
export const useLazySignedUrl = (bucket, path, options = {}) => {
  const {
    expiresIn = 3600
  } = options;

  const [signedUrl, setSignedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Load signed URL on demand
  const load = useCallback(async () => {
    if (loaded || !bucket || !path) return;

    try {
      setLoading(true);
      setError(null);

      const url = await getCachedSignedUrl(bucket, path, expiresIn);
      setSignedUrl(url);
      setLoaded(true);
    } catch (err) {
      console.error('Error loading signed URL:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [bucket, path, expiresIn, loaded]);

  return {
    signedUrl,
    loading,
    error,
    loaded,
    load
  };
};

export default useSignedUrl;
