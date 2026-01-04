import { useState, useCallback } from 'react';
import { fetchBoltz, supabaseFetch } from '../utils/supabaseRest';
import { useAuth } from './useAuth';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const useBoltzFeed = (tab = 'foryou') => {
    const { user } = useAuth();
    const [boltz, setBoltz] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [moreLoading, setMoreLoading] = useState(false);
    const ITEMS_PER_PAGE = 10;

    // 1. Initial Fetch with Robust Query (using REST API)
    const fetchInitialBoltz = useCallback(async () => {
        console.log('🎬 Fetching initial Boltz via REST API:', { tab });

        try {
            let boltzData;

            if (tab === 'following' && user) {
                // Get following list first
                const followingData = await supabaseFetch(
                    `/follows?select=following_id&follower_id=eq.${user.id}`
                ).catch(() => []);

                const followingIds = followingData?.map(f => f.following_id) || [];

                if (followingIds.length === 0) {
                    console.log('⚠️ No following users');
                    return [];
                }

                // Fetch boltz from following users
                boltzData = await fetchBoltz({
                    limit: ITEMS_PER_PAGE,
                    offset: 0
                });

                // Filter client-side for now (could optimize with query params)
                boltzData = boltzData.filter(b => followingIds.includes(b.user_id));
            } else {
                // For You tab - fetch all boltz
                boltzData = await fetchBoltz({
                    limit: ITEMS_PER_PAGE,
                    offset: 0
                });
            }

            // Fetch user interactions (likes/saves) if user is logged in
            let userInteractions = { likes: [], saves: [] };
            if (user) {
                const boltzIds = boltzData.map(b => b.id);
                if (boltzIds.length > 0) {
                    const [likesRes, savesRes] = await Promise.all([
                        supabaseFetch(`/boltz_likes?user_id=eq.${user.id}&boltz_id=in.(${boltzIds.join(',')})`),
                        supabaseFetch(`/boltz_saves?user_id=eq.${user.id}&boltz_id=in.(${boltzIds.join(',')})`)
                    ]);
                    userInteractions.likes = likesRes.map(l => l.boltz_id);
                    userInteractions.saves = savesRes.map(s => s.boltz_id);
                }
            }

            console.log(`✅ Fetched ${boltzData.length} boltz`);

            // Merge interactions
            return boltzData.map(item => ({
                ...item,
                likes_count: item.likes_count || 0,
                comments_count: item.comments_count || 0,
                is_liked: userInteractions.likes.includes(item.id),
                is_saved: userInteractions.saves.includes(item.id),
            }));
        } catch (error) {
            console.error('❌ Error fetching boltz:', error);
            throw error;
        }
    }, [tab, user]);

    const {
        data: initialData,
        loading: initialLoading,
        error: initialError,
        refetch: refetchInitial
    } = useRobustQuery(fetchInitialBoltz, {
        enabled: !!user || tab === 'foryou',
        retries: 3,
        onSuccess: (data) => {
            console.log('✅ Boltz loaded:', data?.length);
            setBoltz(data || []);
            setPage(0);
            setHasMore((data || []).length === ITEMS_PER_PAGE);
        }
    });

    // 2. Load More (using REST API)
    const loadMore = async () => {
        if (moreLoading || !hasMore || initialLoading) return;
        setMoreLoading(true);

        try {
            const nextPage = page + 1;
            const offset = nextPage * ITEMS_PER_PAGE;
            console.log('🎬 Loading more Boltz page:', nextPage);

            let attempts = 0;
            let success = false;
            let newItems = [];

            while (attempts < 3 && !success) {
                try {
                    if (tab === 'following' && user) {
                        // Get following list
                        const followingData = await supabaseFetch(
                            `/follows?select=following_id&follower_id=eq.${user.id}`
                        ).catch(() => []);

                        const followingIds = followingData?.map(f => f.following_id) || [];

                        if (followingIds.length === 0) {
                            success = true;
                            break;
                        }

                        // Fetch boltz
                        const boltzData = await fetchBoltz({
                            limit: ITEMS_PER_PAGE,
                            offset
                        });

                        // Filter for following
                        newItems = boltzData.filter(b => followingIds.includes(b.user_id));
                    } else {
                        // For You tab
                        newItems = await fetchBoltz({
                            limit: ITEMS_PER_PAGE,
                            offset
                        });
                    }

                    success = true;
                } catch (err) {
                    attempts++;
                    console.warn(`⚠️ Load more attempt ${attempts} failed:`, err);
                    await new Promise(r => setTimeout(r, 1000));
                }
            }

            if (success) {
                // Fetch user interactions for new items
                let userInteractions = { likes: [], saves: [] };
                if (user && newItems.length > 0) {
                    const boltzIds = newItems.map(b => b.id);
                    const [likesRes, savesRes] = await Promise.all([
                        supabaseFetch(`/boltz_likes?user_id=eq.${user.id}&boltz_id=in.(${boltzIds.join(',')})`),
                        supabaseFetch(`/boltz_saves?user_id=eq.${user.id}&boltz_id=in.(${boltzIds.join(',')})`)
                    ]);
                    userInteractions.likes = likesRes.map(l => l.boltz_id);
                    userInteractions.saves = savesRes.map(s => s.boltz_id);
                }

                const processedData = newItems.map(item => ({
                    ...item,
                    likes_count: item.likes_count || 0,
                    comments_count: item.comments_count || 0,
                    is_liked: userInteractions.likes.includes(item.id),
                    is_saved: userInteractions.saves.includes(item.id),
                }));
                setBoltz(prev => [...prev, ...processedData]);
                setPage(nextPage);
                setHasMore(newItems.length === ITEMS_PER_PAGE);
                console.log(`✅ Loaded ${newItems.length} more boltz`);
            } else {
                setHasMore(false);
                console.log('⚠️ No more boltz to load');
            }
        } finally {
            setMoreLoading(false);
        }
    };

    // 3. Realtime Subscription
    useRealtimeSubscription({
        channelName: 'boltz-feed-updates',
        table: 'boltz',
        event: 'INSERT',
        enabled: tab === 'foryou',
        onEvent: (payload) => {
            console.log('🔔 New boltz detected');
            // Could optimistically add: setBoltz(prev => [payload.new, ...prev]);
        }
    });

    return {
        boltz,
        loading: initialLoading || moreLoading,
        hasMore,
        loadMore,
        refresh: refetchInitial,
        setBoltz
    };
};
