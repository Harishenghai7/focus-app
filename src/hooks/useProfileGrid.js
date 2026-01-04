import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useProfileGrid = (userId, tabType, isOwnProfile = false) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [error, setError] = useState(null);
    const PAGE_SIZE = 12;

    const fetchItems = useCallback(async (pageNumber = 0, isRefresh = false) => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            let data = [];
            let fetchError = null;

            switch (tabType) {
                case 'posts': {
                    // Fetch user's posts (excluding boltz)
                    const { data: postsData, error: postsError } = await supabase
                        .from('posts')
                        .select(`
                            id,
                            type,
                            media,
                            caption,
                            created_at,
                            likes:post_likes(count),
                            comments:comments(count)
                        `)
                        .eq('user_id', userId)
                        .neq('type', 'boltz')
                        .order('created_at', { ascending: false })
                        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

                    data = postsData;
                    fetchError = postsError;
                    break;
                }

                case 'boltz': {
                    // Fetch user's boltz videos
                    const { data: boltzData, error: boltzError } = await supabase
                        .from('posts')
                        .select(`
                            id,
                            type,
                            media,
                            caption,
                            created_at,
                            likes:post_likes(count),
                            comments:comments(count),
                            views_count
                        `)
                        .eq('user_id', userId)
                        .eq('type', 'boltz')
                        .order('created_at', { ascending: false })
                        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

                    data = boltzData;
                    fetchError = boltzError;
                    break;
                }

                case 'saved': {
                    // Fetch saved posts (only for own profile)
                    if (!isOwnProfile) {
                        data = [];
                        break;
                    }

                    const { data: savedData, error: savedError } = await supabase
                        .from('saved_posts')
                        .select(`
                            post_id,
                            created_at,
                            post:posts(
                                id,
                                type,
                                media,
                                caption,
                                created_at,
                                likes:post_likes(count),
                                comments:comments(count)
                            )
                        `)
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

                    data = savedData?.map(item => item.post) || [];
                    fetchError = savedError;
                    break;
                }

                case 'tagged': {
                    // Fetch posts where user is tagged
                    const { data: taggedData, error: taggedError } = await supabase
                        .from('post_tags')
                        .select(`
                            post_id,
                            created_at,
                            post:posts(
                                id,
                                type,
                                media,
                                caption,
                                created_at,
                                likes:post_likes(count),
                                comments:comments(count)
                            )
                        `)
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .range(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE - 1);

                    data = taggedData?.map(item => item.post) || [];
                    fetchError = taggedError;
                    break;
                }

                default:
                    data = [];
            }

            if (fetchError) throw fetchError;

            // Format items
            const formattedItems = (data || []).map(item => ({
                ...item,
                likes_count: item.likes?.[0]?.count || 0,
                comments_count: item.comments?.[0]?.count || 0,
                thumbnail: item.media?.[0]?.url || item.media?.[0]?.thumbnail_url || null
            }));

            if (isRefresh || pageNumber === 0) {
                setItems(formattedItems);
            } else {
                setItems(prev => [...prev, ...formattedItems]);
            }

            setHasMore((data || []).length === PAGE_SIZE);
            setPage(pageNumber);

        } catch (err) {
            console.error(`Error fetching ${tabType}:`, err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [userId, tabType, isOwnProfile]);

    useEffect(() => {
        fetchItems(0, true);
    }, [fetchItems]);

    // Real-time subscription for new posts
    useEffect(() => {
        if (!userId || tabType === 'saved' || tabType === 'tagged') return;

        const channel = supabase
            .channel(`profile-grid-${userId}-${tabType}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    // Only add if matches current tab type
                    if (tabType === 'posts' && payload.new.type !== 'boltz') {
                        setItems(prev => [payload.new, ...prev]);
                    } else if (tabType === 'boltz' && payload.new.type === 'boltz') {
                        setItems(prev => [payload.new, ...prev]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, tabType]);

    const loadMore = useCallback(() => {
        if (!loading && hasMore) {
            fetchItems(page + 1, false);
        }
    }, [loading, hasMore, page, fetchItems]);

    const refresh = useCallback(() => {
        return fetchItems(0, true);
    }, [fetchItems]);

    return {
        items,
        loading,
        hasMore,
        error,
        loadMore,
        refresh
    };
};
