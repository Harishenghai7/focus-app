import { useState, useCallback } from 'react';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { generateFeed } from '../utils/feedAlgorithm';
import { useAuth } from './useAuth';

export const useFeed = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [newPostsCount, setNewPostsCount] = useState(0);
    const [moreLoading, setMoreLoading] = useState(false);

    // 1. Initial Fetch with Robust Query
    const fetchInitialFeed = useCallback(async () => {
        if (!user) return [];
        console.log('🏠 Fetching initial feed...');
        return await generateFeed(user.id, 0, 10);
    }, [user]);

    const {
        data: initialPosts,
        loading: initialLoading,
        error: initialError,
        refetch: refetchInitial
    } = useRobustQuery(fetchInitialFeed, {
        enabled: !!user,
        retries: 3,
        onSuccess: (data) => {
            console.log('✅ Initial feed loaded:', data?.length);
            setPosts(data || []);
            setPage(0);
            setHasMore((data || []).length === 10);
        }
    });

    // 2. Load More (Manual Robust Fetch)
    const loadMore = async () => {
        if (moreLoading || !hasMore || initialLoading) return;
        setMoreLoading(true);

        try {
            const nextPage = page + 1;
            console.log('🏠 Loading more page:', nextPage);

            // Simple retry logic for load more
            let attempts = 0;
            let success = false;
            let newItems = [];

            while (attempts < 3 && !success) {
                try {
                    newItems = await generateFeed(user.id, nextPage, 10);
                    success = true;
                } catch (err) {
                    attempts++;
                    console.warn(`⚠️ Load more failed (Attempt ${attempts}):`, err);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (success) {
                setPosts(prev => {
                    const existingIds = new Set(prev.map(p => p.id));
                    const unique = newItems.filter(p => !existingIds.has(p.id));
                    return [...prev, ...unique];
                });
                setPage(nextPage);
                setHasMore(newItems.length === 10);
            } else {
                setHasMore(false); // Stop trying if we failed 3 times
            }
        } finally {
            setMoreLoading(false);
        }
    };

    // 3. Realtime Subscription
    useRealtimeSubscription({
        channelName: 'home-feed-updates',
        table: 'posts',
        event: 'INSERT',
        enabled: !!user,
        onEvent: (payload) => {
            // In a real app, we might filter this more strictly
            console.log('🔔 New post detected in feed');
            setNewPostsCount(prev => prev + 1);
        }
    });

    const refresh = () => {
        console.log('🔄 Refreshing feed...');
        setNewPostsCount(0);
        refetchInitial();
    };

    return {
        posts,
        loading: initialLoading || moreLoading,
        error: initialError,
        hasMore,
        loadMore,
        refresh,
        newPostsCount,
        setPosts // Exposed for optimistic updates
    };
};
