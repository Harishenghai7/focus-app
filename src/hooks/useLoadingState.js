import { useState, useCallback, useRef, useEffect } from 'react';

// Hook for managing loading states
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const startLoading = useCallback(() => {
    if (mountedRef.current) {
      setIsLoading(true);
      setError(null);
    }
  }, []);

  const stopLoading = useCallback(() => {
    if (mountedRef.current) {
      setIsLoading(false);
    }
  }, []);

  const setSuccess = useCallback((result) => {
    if (mountedRef.current) {
      setData(result);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const setFailure = useCallback((err) => {
    if (mountedRef.current) {
      setError(err);
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (mountedRef.current) {
      setIsLoading(false);
      setError(null);
      setData(null);
    }
  }, []);

  const execute = useCallback(async (asyncFn) => {
    startLoading();
    try {
      const result = await asyncFn();
      setSuccess(result);
      return result;
    } catch (err) {
      setFailure(err);
      throw err;
    }
  }, [startLoading, setSuccess, setFailure]);

  return {
    isLoading,
    error,
    data,
    startLoading,
    stopLoading,
    setSuccess,
    setFailure,
    reset,
    execute
  };
};

// Hook for managing multiple loading states
export const useMultipleLoadingStates = (keys) => {
  const [loadingStates, setLoadingStates] = useState(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {})
  );

  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(v => v);
  const isAllLoading = Object.values(loadingStates).every(v => v);

  return {
    loadingStates,
    setLoading,
    isAnyLoading,
    isAllLoading
  };
};

// Hook for debounced loading state
export const useDebouncedLoading = (delay = 300) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isLoading) {
      // Show loading after delay
      timeoutRef.current = setTimeout(() => {
        setShowLoading(true);
      }, delay);
    } else {
      // Hide loading immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, delay]);

  return [showLoading, setIsLoading];
};

// Hook for minimum loading time (prevents flash)
export const useMinimumLoadingTime = (minTime = 500) => {
  const [isLoading, setIsLoading] = useState(false);
  const startTimeRef = useRef(null);

  const startLoading = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(async () => {
    if (startTimeRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, minTime - elapsed);
      
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }
    }
    setIsLoading(false);
  }, [minTime]);

  return [isLoading, startLoading, stopLoading];
};

// Hook for async operation with loading state
export const useAsyncOperation = () => {
  const [state, setState] = useState({
    isLoading: false,
    error: null,
    data: null
  });

  const execute = useCallback(async (asyncFn, options = {}) => {
    const {
      onSuccess = null,
      onError = null,
      minLoadingTime = 0
    } = options;

    const startTime = Date.now();
    
    setState({ isLoading: true, error: null, data: null });

    try {
      const result = await asyncFn();
      
      // Ensure minimum loading time
      if (minLoadingTime > 0) {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minLoadingTime - elapsed);
        if (remaining > 0) {
          await new Promise(resolve => setTimeout(resolve, remaining));
        }
      }

      setState({ isLoading: false, error: null, data: result });
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      setState({ isLoading: false, error, data: null });
      
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, data: null });
  }, []);

  return {
    ...state,
    execute,
    reset
  };
};

// Hook for pagination with loading
export const usePaginatedLoading = (fetchFn, pageSize = 10) => {
  const [state, setState] = useState({
    data: [],
    page: 0,
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    error: null
  });

  const loadInitial = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await fetchFn(0, pageSize);
      setState({
        data: result,
        page: 0,
        hasMore: result.length === pageSize,
        isLoading: false,
        isLoadingMore: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error 
      }));
    }
  }, [fetchFn, pageSize]);

  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore) return;

    setState(prev => ({ ...prev, isLoadingMore: true, error: null }));
    
    try {
      const nextPage = state.page + 1;
      const result = await fetchFn(nextPage, pageSize);
      
      setState(prev => ({
        ...prev,
        data: [...prev.data, ...result],
        page: nextPage,
        hasMore: result.length === pageSize,
        isLoadingMore: false
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoadingMore: false, 
        error 
      }));
    }
  }, [fetchFn, pageSize, state.page, state.hasMore, state.isLoadingMore]);

  const refresh = useCallback(async () => {
    await loadInitial();
  }, [loadInitial]);

  return {
    ...state,
    loadInitial,
    loadMore,
    refresh
  };
};

export default useLoadingState;
