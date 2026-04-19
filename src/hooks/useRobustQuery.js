import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * A hook for robust data fetching with retries, timeouts, and error handling.
 * @param {Function} fetchFn - Async function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Object} { data, loading, error, refetch, retryCount }
 */
export const useRobustQuery = (fetchFn, options = {}) => {
    const {
        enabled = true,
        retries = 3,
        retryDelay = 2000,
        timeout = 10000,
        onSuccess,
        onError,
        dependencies = []
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(enabled);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Track mount for Strict Mode: cleanup sets false; we must reset true on each mount
    // or the second mount's fetch will never call setLoading(false).
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const execute = useCallback(async (resetState = true) => {
        if (resetState) {
            setLoading(true);
            setError(null);
        }

        let attempt = 0;
        let success = false;

        while (attempt <= retries && !success) {
            if (!isMounted.current) return;

            try {
                // Create a timeout promise
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Request timed out')), timeout)
                );

                // Race the fetch function against the timeout
                const result = await Promise.race([fetchFn(), timeoutPromise]);

                if (isMounted.current) {
                    setData(result);
                    setLoading(false);
                    success = true;
                    if (onSuccess) onSuccess(result);
                }

            } catch (err) {
                attempt++;
                console.warn(`⚠️ Query failed (Attempt ${attempt}/${retries + 1}):`, err.message);

                if (attempt > retries) {
                    if (isMounted.current) {
                        setError(err);
                        setLoading(false);
                        if (onError) onError(err);
                    }
                } else {
                    // Wait before retrying
                    if (isMounted.current) {
                        setRetryCount(attempt);
                        await new Promise(resolve => setTimeout(resolve, retryDelay));
                    }
                }
            }
        }
    }, [fetchFn, retries, retryDelay, timeout, ...dependencies]);

    useEffect(() => {
        if (enabled) {
            execute();
        }
    }, [enabled, execute]);

    return { data, loading, error, refetch: () => execute(true), retryCount };
};
