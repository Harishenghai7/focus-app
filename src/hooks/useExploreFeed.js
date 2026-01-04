import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useExploreFeed = (activeTab, searchQuery) => {
    const [data, setData] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [moreLoading, setMoreLoading] = useState(false);
    const ITEMS_PER_PAGE = 12;

    // 1. Initial Fetch with Robust Query
    const fetchInitialData = useCallback(async () => {
        console.log('🔍 Fetching explore data:', { activeTab, searchQuery });
        const from = 0;
        const to = ITEMS_PER_PAGE - 1;

        let query;

        if (activeTab === 'People') {
            query = supabase.from('profiles').select('*').range(from, to);
            if (searchQuery) query = query.ilike('username', `%${searchQuery}%`);
        } else if (activeTab === 'Boltz') {
            query = supabase.from('boltz')
                .select('*, user:profiles!user_id(username, avatar_url, verified)')
                .order('created_at', { ascending: false })
                .range(from, to);
            if (searchQuery) query = query.ilike('description', `%${searchQuery}%`);
        } else {
            query = supabase.from('posts')
                .select('*, profiles!user_id(username, avatar_url, verified)')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (activeTab === 'Photos') query = query.eq('type', 'image');
            else if (activeTab === 'Videos') query = query.eq('type', 'video');

            if (searchQuery) query = query.ilike('caption', `%${searchQuery}%`);
        }

        const { data: result, error } = await query;
        if (error) throw error;
        return result;
    }, [activeTab, searchQuery]);

    const {
        data: initialData,
        loading: initialLoading,
        error: initialError,
        refetch: refetchInitial
    } = useRobustQuery(fetchInitialData, {
        enabled: true,
        retries: 3,
        onSuccess: (result) => {
            console.log('✅ Explore data loaded:', result?.length);
            setData(result || []);
            setPage(0);
            setHasMore((result || []).length === ITEMS_PER_PAGE);
        }
    });

    // 2. Load More (Manual Robust Fetch)
    const loadMore = async () => {
        if (moreLoading || !hasMore || initialLoading) return;
        setMoreLoading(true);

        try {
            const nextPage = page + 1;
            const from = nextPage * ITEMS_PER_PAGE;
            const to = from + ITEMS_PER_PAGE - 1;
            console.log('🔍 Loading more explore page:', nextPage);

            let attempts = 0;
            let success = false;
            let newItems = [];

            while (attempts < 3 && !success) {
                try {
                    let query;
                    if (activeTab === 'People') {
                        query = supabase.from('profiles').select('*').range(from, to);
                        if (searchQuery) query = query.ilike('username', `%${searchQuery}%`);
                    } else if (activeTab === 'Boltz') {
                        query = supabase.from('boltz')
                            .select('*, user:profiles!user_id(username, avatar_url, verified)')
                            .order('created_at', { ascending: false })
                            .range(from, to);
                        if (searchQuery) query = query.ilike('description', `%${searchQuery}%`);
                    } else {
                        query = supabase.from('posts')
                            .select('*, profiles!user_id(username, avatar_url, verified)')
                            .order('created_at', { ascending: false })
                            .range(from, to);
                        if (activeTab === 'Photos') query = query.eq('type', 'image');
                        else if (activeTab === 'Videos') query = query.eq('type', 'video');
                        if (searchQuery) query = query.ilike('caption', `%${searchQuery}%`);
                    }

                    const { data: result, error } = await query;
                    if (error) throw error;
                    newItems = result;
                    success = true;
                } catch (err) {
                    attempts++;
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (success) {
                setData(prev => [...prev, ...newItems]);
                setPage(nextPage);
                setHasMore(newItems.length === ITEMS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        } finally {
            setMoreLoading(false);
        }
    };

    // 3. Realtime Subscription (Optional, for 'All' tab)
    useRealtimeSubscription({
        channelName: 'explore-feed-updates',
        table: 'posts',
        event: 'INSERT',
        enabled: activeTab === 'All' && !searchQuery,
        onEvent: (payload) => {
            // Optimistically add new post if it matches current filter
            // setData(prev => [payload.new, ...prev]);
            // Or just show a toast "New posts available"
        }
    });

    return {
        data,
        loading: initialLoading || moreLoading,
        hasMore,
        loadMore,
        refetch: refetchInitial
    };
};
