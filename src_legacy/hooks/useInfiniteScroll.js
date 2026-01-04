import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useInfiniteScroll Hook
 * 
 * Purpose: Infinite scroll pagination with intersection observer
 * 
 * Features:
 * - Detect when user scrolls to bottom
 * - Load next page of data
 * - Handle loading state
 * - Handle end of data
 * 
 * @param {Function} fetchFunction - Async function to fetch data (receives page and pageSize)
 * @param {number} pageSize - Number of items per page (default: 20)
 * 
 * @returns {Object} {
 *   data: array of all loaded items,
 *   loading: boolean loading state,
 *   hasMore: boolean indicating if more data is available,
 *   loadMore: function to manually trigger load,
 *   reset: function to reset pagination,
 *   observerRef: ref to attach to sentinel element,
 *   error: error object if fetch fails
 * }
 * 
 * Example usage:
 * ```jsx
 * const fetchPosts = async (page, pageSize) => {
 *   const response = await api.get(`/posts?page=${page}&limit=${pageSize}`);
 *   return response.data;
 * };
 * 
 * const { data, loading, hasMore, observerRef, error } = useInfiniteScroll(fetchPosts, 20);
 * 
 * return (
 *   <div>
 *     {data.map(item => <Item key={item.id} data={item} />)}
 *     {loading && <Spinner />}
 *     {hasMore && <div ref={observerRef} style={{ height: '20px' }} />}
 *     {error && <Error message={error.message} />}
 *   </div>
 * );
 * ```
 */
const useInfiniteScroll = (fetchFunction, pageSize = 20) => {
  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  // Refs to manage intersection observer
  const observerRef = useRef(null);
  const loadingRef = useRef(false);
  const observerInstanceRef = useRef(null);

  /**
   * Load more data
   */
  const loadMore = useCallback(async () => {
    // Prevent duplicate requests
    if (loadingRef.current || !hasMore) {
      return;
    }

    // Validate fetch function
    if (!fetchFunction || typeof fetchFunction !== 'function') {
      console.error('useInfiniteScroll: fetchFunction must be a function');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Fetch data for current page
      const result = await fetchFunction(page, pageSize);

      // Handle different response formats
      let newData = [];
      let hasMoreData = true;

      if (Array.isArray(result)) {
        // Direct array response
        newData = result;
        hasMoreData = result.length >= pageSize;
      } else if (result && typeof result === 'object') {
        // Object response with data property
        newData = result.data || result.items || result.results || [];
        
        // Check for explicit hasMore flag or pagination info
        if (typeof result.hasMore === 'boolean') {
          hasMoreData = result.hasMore;
        } else if (result.pagination) {
          hasMoreData = result.pagination.hasMore || 
                       (result.pagination.currentPage < result.pagination.totalPages);
        } else {
          // Fallback: check array length
          hasMoreData = newData.length >= pageSize;
        }
      } else {
        console.warn('useInfiniteScroll: Unexpected response format', result);
        hasMoreData = false;
      }

      // Update state
      setData(prevData => {
        // Deduplicate by id if items have an id property
        if (newData.length > 0 && newData[0]?.id) {
          const existingIds = new Set(prevData.map(item => item.id));
          const uniqueNewData = newData.filter(item => !existingIds.has(item.id));
          return [...prevData, ...uniqueNewData];
        }
        return [...prevData, ...newData];
      });

      setHasMore(hasMoreData && newData.length > 0);
      setPage(prevPage => prevPage + 1);

    } catch (err) {
      console.error('useInfiniteScroll: Error loading data', err);
      setError(err);
      setHasMore(false);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFunction, page, pageSize, hasMore]);

  /**
   * Reset pagination
   */
  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setLoading(false);
    loadingRef.current = false;
  }, []);

  /**
   * Setup intersection observer
   */
  useEffect(() => {
    // Cleanup previous observer
    if (observerInstanceRef.current) {
      observerInstanceRef.current.disconnect();
    }

    // Don't setup observer if no more data or not supported
    if (!hasMore || !observerRef.current || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Create intersection observer
    const options = {
      root: null, // Use viewport as root
      rootMargin: '100px', // Trigger 100px before reaching the element
      threshold: 0.1 // Trigger when 10% visible
    };

    const callback = (entries) => {
      const [entry] = entries;
      
      // Load more when sentinel element is intersecting
      if (entry.isIntersecting && !loadingRef.current && hasMore) {
        loadMore();
      }
    };

    observerInstanceRef.current = new IntersectionObserver(callback, options);

    // Observe the sentinel element
    if (observerRef.current) {
      observerInstanceRef.current.observe(observerRef.current);
    }

    // Cleanup
    return () => {
      if (observerInstanceRef.current) {
        observerInstanceRef.current.disconnect();
      }
    };
  }, [hasMore, loadMore]);

  /**
   * Initial load
   */
  useEffect(() => {
    // Load initial data if we have no data
    if (data.length === 0 && !loadingRef.current && hasMore) {
      loadMore();
    }
  }, []); // Only run once on mount

  /**
   * Handle fetch function changes
   */
  useEffect(() => {
    // Reset when fetch function changes
    const isInitialMount = data.length === 0 && page === 1;
    if (!isInitialMount) {
      reset();
    }
  }, [fetchFunction]); // Only reset when fetchFunction reference changes

  return {
    data,
    loading,
    hasMore,
    loadMore,
    reset,
    observerRef,
    error,
    page: page - 1, // Return current page (0-indexed for clarity)
    isEmpty: data.length === 0 && !loading
  };
};

export { useInfiniteScroll };
export default useInfiniteScroll;
