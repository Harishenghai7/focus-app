import { useState, useEffect, useCallback } from 'react';
import { getRecommendedPosts } from '../utils/exploreAlgorithm';
import { useAuth } from './useAuth';

export const useExplore = (category = 'All') => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState(null);

    const PAGE_SIZE = 20;

    const fetchExploreFeed = useCallback(async (pageNumber = 0, isRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            // If no user, we can still show explore (public)
            const userId = user?.id || 'public';

            const newPosts = await getRecommendedPosts(userId, category, pageNumber, PAGE_SIZE);

            if (isRefresh) {
                setPosts(newPosts);
            } else {
                setPosts(prev => [...prev, ...newPosts]);
            }

            setHasMore(newPosts.length === PAGE_SIZE);
            setPage(pageNumber);
        } catch (err) {
            console.error('Error in useExplore:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [category, user]);

    // Reset and fetch when category changes
    useEffect(() => {
        setPosts([]);
        setPage(0);
        setHasMore(true);
        fetchExploreFeed(0, true);
    }, [category, fetchExploreFeed]);

    const loadMore = () => {
        if (!loading && hasMore) {
            fetchExploreFeed(page + 1);
        }
    };

    const refresh = () => {
        return fetchExploreFeed(0, true);
    };

    return {
        posts,
        loading,
        hasMore,
        error,
        loadMore,
        refresh
    };
};
