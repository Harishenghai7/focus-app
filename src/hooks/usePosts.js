/**
 * usePosts Hook — Production v3
 * Uses explicit FK join syntax for profiles (profiles:user_id)
 * Works with or without auth — always shows public posts
 */
import { useEffect, useCallback, useRef } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useFocusUser } from '../context/FocusUserContext';
import { fetchUserPostLikeIds, fetchUserSavedPostIds } from '../utils/postInteractions';
import { normalizeHydratedProfile } from '../utils/identityHydration';
import { assertTrustShieldVerified } from '../utils/trustShieldAccess';

const POSTS_PER_PAGE = 10;
// Normalize profile/author shapes across:
// - FK join results (post.profiles = object/array)
// - Legacy results (post.author = object/array)
// - RPC results (flat columns: username/avatar_url/full_name/is_verified/trust_tier)
const normalizeProfile = (post) => {
  if (!post) return null;

  const joinedProfile =
    Array.isArray(post.profiles) ? post.profiles[0] :
    Array.isArray(post.author)   ? post.author[0]   :
    post.profiles || post.author || null;

  if (joinedProfile) {
    const hasLabel =
      (joinedProfile.username && String(joinedProfile.username).trim()) ||
      (joinedProfile.full_name && String(joinedProfile.full_name).trim()) ||
      (joinedProfile.avatar_url && String(joinedProfile.avatar_url).trim());
    if (hasLabel || joinedProfile.id) return joinedProfile;
  }

  // RPC fallback: build a profile-like object so UI components can rely on `post.profiles.*`
  const username = post.username || null;
  const full_name = post.full_name || null;
  const avatar_url = post.avatar_url || null;
  const is_verified =
    post.is_verified === true ||
    post.verified === true;
  const trust_tier =
    typeof post.trust_tier === 'number' ? post.trust_tier : null;

  if (!username && !full_name && !avatar_url && !is_verified && !trust_tier) return null;

  return {
    id: post.user_id,
    username,
    full_name,
    avatar_url,
    is_verified,
    trust_tier,
  };
};

// Enrich posts with profile data and user interactions
const enrichPosts = (rawPosts, userLikes = [], userSaves = []) =>
  rawPosts.map((post) => {
    const safeProfile = normalizeProfile(post);

    return {
      ...post,
      profiles: normalizeHydratedProfile(safeProfile, post.user_id),
      is_liked:       userLikes.includes(post.id),
      is_saved:       userSaves.includes(post.id),
      likes_count:    post.likes_count    || 0,
      comments_count: post.comments_count || 0,
      saves_count:    post.saves_count    || 0,
      shares_count:   post.shares_count   || 0,
      views_count:    post.views_count    || 0,
    };
  });

/** When embedded `profiles:user_id` is empty (RLS/embed quirk), batch-load authors. */
const attachMissingProfiles = async (posts) => {
  if (!posts?.length) return posts;
  const missing = posts.filter((p) => {
    const n = normalizeHydratedProfile(normalizeProfile(p), p.user_id);
    if (!p.user_id) return false;
    if (!n) return true;
    return !(n?.username || n?.full_name || n?.avatar_url);
  });
  if (!missing.length) return posts;
  const ids = [...new Set(missing.map((p) => p.user_id))];
  const { data: profs, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, is_verified, trust_tier')
    .in('id', ids);
  if (error || !profs?.length) return posts;
  const map = Object.fromEntries(profs.map((row) => [row.id, row]));
  return posts.map((p) => {
    if (normalizeProfile(p)) return p;
    const row = map[p.user_id];
    return row ? { ...p, profiles: normalizeHydratedProfile(row, p.user_id) } : p;
  });
};

export const usePosts = (feedType = 'home') => {
  const { user } = useFocusUser();
  const queryClient = useQueryClient();

  // Use ref so fetchPosts callback never goes stale
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const fetchPosts = useCallback(async ({ pageParam = 0 }) => {
    const currentUser = userRef.current;
    const offset = pageParam * POSTS_PER_PAGE;

    // ── The explicit FK join syntax that always works in Supabase ──────
    const PROFILE_SELECT = `
      profiles:user_id (
        id, username, full_name, avatar_url, is_verified, trust_tier
      )
    `;

    let rawPosts = [];

    // ── Home feed ─────────────────────────────────────────────────────
    if (feedType === 'home') {
      if (currentUser?.id) {
        await assertTrustShieldVerified(currentUser.id);
      }

      // Home should always be public/global posts (works with or without auth).
      // The RPC `get_feed_posts` is "following feed" semantics and can return 0
      // when you do not follow anyone, which makes Home look broken.
      const { data: secureData, error: secureError } = currentUser?.id
        ? await supabase.rpc('get_home_feed_secure', {
            p_user_id: currentUser.id,
            p_limit: POSTS_PER_PAGE,
            p_offset: offset,
          })
        : { data: null, error: new Error('UNAUTHENTICATED') };

      if (!secureError && Array.isArray(secureData)) {
        rawPosts = secureData || [];
      } else {
        const { data, error } = await supabase
          .from('posts')
          .select(`*, ${PROFILE_SELECT}`)
          .order('created_at', { ascending: false })
          .range(offset, offset + POSTS_PER_PAGE - 1);

        if (error) {
          // If the FK join fails (unusual schema), retry with basic select
          const { data: basic, error: basicErr } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + POSTS_PER_PAGE - 1);

          if (basicErr) throw basicErr;
          rawPosts = basic || [];
        } else {
          rawPosts = data || [];
        }
      }
    }

    // ── Following feed ────────────────────────────────────────────────
    else if (feedType === 'following' && currentUser?.id) {
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      const ids = following?.map((f) => f.following_id) || [];
      if (ids.length === 0) return { posts: [], hasMore: false };

      const { data, error } = await supabase
        .from('posts')
        .select(`*, ${PROFILE_SELECT}`)
        .in('user_id', ids)
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (error) throw error;
      rawPosts = data || [];
    }

    // ── Explore / other ───────────────────────────────────────────────
    else {
      let query = supabase
        .from('posts')
        .select(`*, ${PROFILE_SELECT}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      if (feedType === 'explore') {
        query = query.not('media_url', 'is', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      rawPosts = data || [];
    }

    rawPosts = await attachMissingProfiles(rawPosts);

    // ── Fetch user interaction data (non-blocking) ────────────────────
    let userLikes = [];
    let userSaves = [];
    if (currentUser?.id && rawPosts.length > 0) {
      const postIds = rawPosts.map((p) => p.id);
      const [likeIds, saveIds] = await Promise.all([
        fetchUserPostLikeIds(currentUser.id, postIds),
        fetchUserSavedPostIds(currentUser.id, postIds),
      ]);
      userLikes = likeIds;
      userSaves = saveIds;
    }

    return {
      posts:   enrichPosts(rawPosts, userLikes, userSaves),
      hasMore: rawPosts.length >= POSTS_PER_PAGE,
    };
  }, [feedType]); // ← only feedType dep; user comes from ref

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
    queryKey:         ['posts', feedType, user?.id],
    queryFn:          fetchPosts,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length : undefined,
    initialPageParam: 0,
    enabled:          true,   // Always fetch — shows public posts even logged-out
    staleTime:        30_000,
    gcTime:           5 * 60_000,
    retry:            2,
  });

  const posts = Array.from(
    new Map(
      (data?.pages?.flatMap((p) => p.posts) || []).map((post) => [post.id, post])
    ).values()
  );

  const prefetchNextPage = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      queryClient.prefetchInfiniteQuery({
        queryKey:         ['posts', feedType, user?.id],
        queryFn:          fetchPosts,
        initialPageParam: 0,
      });
    }
  }, [hasNextPage, isFetchingNextPage, queryClient, feedType, user?.id, fetchPosts]);

  // ── Realtime: update counts without full refetch ──────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('public:posts_counts_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          const updated = payload.new;
          if (!updated) return;
          queryClient.setQueriesData({ queryKey: ['posts'] }, (old) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                posts: (page.posts || []).map((post) =>
                  post.id === updated.id
                    ? {
                        ...post,
                        likes_count:    updated.likes_count    ?? post.likes_count,
                        comments_count: updated.comments_count ?? post.comments_count,
                        saves_count:    updated.saves_count    ?? post.saves_count,
                        shares_count:   updated.shares_count   ?? post.shares_count,
                      }
                    : post
                ),
              })),
            };
          });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

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
