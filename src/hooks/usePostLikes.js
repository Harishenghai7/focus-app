/**
 * usePostLikes Hook
 * Fetch users who liked a post with infinite scroll
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

const LIKES_PER_PAGE = 20;

export const usePostLikes = (postId) => {
    const fetchLikes = async ({ pageParam = 0 }) => {
        const offset = pageParam * LIKES_PER_PAGE;

        const { data, error } = await supabase
            .from('post_likes')
            .select(`
                *,
                profiles:user_id (
                    id,
                    username,
                    avatar_url,
                    is_verified
                )
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: false })
            .range(offset, offset + LIKES_PER_PAGE - 1);

        if (error) throw error;

        return {
            likes: data || [],
            hasMore: data?.length === LIKES_PER_PAGE,
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
    } = useInfiniteQuery({
        queryKey: ['post-likes', postId],
        queryFn: fetchLikes,
        getNextPageParam: (lastPage, allPages) => {
            return lastPage.hasMore ? allPages.length : undefined;
        },
        enabled: !!postId,
    });

    const likes = data?.pages.flatMap(page => page.likes) || [];

    return {
        likes,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    };
};
