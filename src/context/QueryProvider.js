/**
 * React Query Provider
 * Configures caching, refetching, and performance optimization
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Optional devtools - only in development
let ReactQueryDevtools = null;
if (process.env.NODE_ENV === 'development') {
    try {
        ReactQueryDevtools = require('@tanstack/react-query-devtools').ReactQueryDevtools;
    } catch (e) {

    }
}

// Configure React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // v5: keep inactive cache (was cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
            retry: 1,
        },
    },
});

export const QueryProvider = ({ children }) => {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
            {process.env.NODE_ENV === 'development' && ReactQueryDevtools && (
                <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
            )}
        </QueryClientProvider>
    );
};

export { queryClient };
