/**
 * usePosts Hook
 * Advanced post fetching with infinite scroll, smart feed algorithm, and caching
 */

import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { generateFeed } from '../utils/feedAlgorithm';

const POSTS_PER_PAGE = 10;

export const usePosts = (feedType = 'home') => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const fetchPosts = async ({ pageParam = 0 }) => {
        const offset = pageParam * POSTS_PER_PAGE;

        // Use optimized RPC function for home feed
        if (feedType === 'home' && user) {
            try {
                const { data, error } = await supabase
                    .rpc('get_feed_posts', {
                        current_user_id: user.id,
                        limit_count: POSTS_PER_PAGE,
                        offset_count: offset
                    });

                if (error) {
                    console.error('RPC error, falling back to advanced feed:', error);
                    // Fallback to advanced feed algorithm
                    const feedItems = await generateFeed(user.id, pageParam, POSTS_PER_PAGE);
                    return {
                        posts: feedItems,
                        hasMore: feedItems.length >= POSTS_PER_PAGE,
                    };
                }

                const rawPosts = data || [];

                // Fetch user interactions for RPC result
                let userInteractions = { likes: [], saves: [] };
                if (user && rawPosts.length > 0) {
                    const postIds = rawPosts.map(p => p.id);
                    const [likesRes, savesRes] = await Promise.all([
                        supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
                        supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
                    ]);

                    userInteractions.likes = (likesRes.data || []).map(l => l.post_id);
                    userInteractions.saves = (savesRes.data || []).map(s => s.post_id);
                }

                const processedPosts = rawPosts.map(post => ({
                    ...post,
                    is_liked: userInteractions.likes.includes(post.id),
                    is_saved: userInteractions.saves.includes(post.id),
                    likes_count: post.likes_count || post.post_analytics?.[0]?.likes_count || 0,
                    comments_count: post.comments_count || post.post_analytics?.[0]?.comments_count || 0,
                    saves_count: post.saves_count || post.post_analytics?.[0]?.saves_count || 0,
                    shares_count: post.shares_count || post.post_analytics?.[0]?.shares_count || 0,
                    views_count: post.views_count || post.post_analytics?.[0]?.views_count || 0,
                }));

                return {
                    posts: processedPosts,
                    hasMore: (data?.length || 0) >= POSTS_PER_PAGE,
                };
            } catch (err) {
                console.error('Feed fetch error:', err);
                // Fallback to advanced feed algorithm
                const feedItems = await generateFeed(user.id, pageParam, POSTS_PER_PAGE);
                return {
                    posts: feedItems,
                    hasMore: feedItems.length >= POSTS_PER_PAGE,
                };
            }
        }


        let query = supabase
            .from('posts')
            .select(`
                *,
                profiles:profiles!posts_user_id_fkey (
                    id,
                    username,
                    avatar_url,
                    is_verified
                ),
                post_analytics (
                    likes_count,
                    comments_count,
                    saves_count,
                    shares_count,
                    views_count
                )
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .range(offset, offset + POSTS_PER_PAGE - 1);

        // Apply feed type filters
        if (feedType === 'following' && user) {
            // Get posts from users the current user follows
            const { data: following } = await supabase
                .from('follows')
                .select('following_id')
                .eq('follower_id', user.id);

            const followingIds = following?.map(f => f.following_id) || [];
            if (followingIds.length > 0) {
                query = query.in('user_id', followingIds);
            } else {
                // No following, return empty
                return { posts: [], hasMore: false };
            }
        } else if (feedType === 'explore') {
            // Explore: public posts, ranked by engagement
            query = query.eq('visibility', 'public');
        }

        // Apply visibility filters
        if (user) {
            query = query.or(`visibility.eq.public,visibility.eq.followers,user_id.eq.${user.id}`);
        } else {
            query = query.eq('visibility', 'public');
        }

        const { data, error } = await query;

        if (error) throw error;

        // Fetch user interactions (likes/saves)
        let userInteractions = { likes: [], saves: [] };
        if (user && data && data.length > 0) {
            const postIds = data.map(p => p.id);
            const [likesRes, savesRes] = await Promise.all([
                supabase.from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
                supabase.from('saved_posts').select('post_id').eq('user_id', user.id).in('post_id', postIds)
            ]);

            userInteractions.likes = (likesRes.data || []).map(l => l.post_id);
            userInteractions.saves = (savesRes.data || []).map(s => s.post_id);
        }

        // Process posts to add computed fields
        const posts = data.map(post => ({
            ...post,
            is_liked: userInteractions.likes.includes(post.id),
            is_saved: userInteractions.saves.includes(post.id),
            likes_count: post.likes_count || post.post_analytics?.[0]?.likes_count || 0,
            comments_count: post.comments_count || post.post_analytics?.[0]?.comments_count || 0,
            saves_count: post.saves_count || post.post_analytics?.[0]?.saves_count || 0,
            shares_count: post.shares_count || post.post_analytics?.[0]?.shares_count || 0,
            views_count: post.views_count || post.post_analytics?.[0]?.views_count || 0,
        }));

        return {
            posts,
            hasMore: posts.length === POSTS_PER_PAGE,
        };
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['posts', feedType, user?.id],
        queryFn: fetchPosts,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length : undefined;
        },
        enabled: !!user || feedType === 'explore',
    });

    // Flatten all pages into single array
    const posts = data?.pages.flatMap(page => page.posts) || [];

    // Prefetch next page when near end
    const prefetchNextPage = () => {
        if (hasNextPage && !isFetchingNextPage) {
            queryClient.prefetchInfiniteQuery({
                queryKey: ['posts', feedType, user?.id],
                queryFn: fetchPosts,
            });
        }
    };

    return {
        posts,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch,
        prefetchNextPage,
    };
};
