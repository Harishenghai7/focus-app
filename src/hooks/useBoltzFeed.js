import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useFocusUser } from '../context/FocusUserContext';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { normalizeHydratedProfile } from '../utils/identityHydration';
import { assertTrustShieldVerified } from '../utils/trustShieldAccess';
import { rankBoltzFeed } from '../services/boltzRecommendationEngine';

export const useBoltzFeed = (tab = 'foryou') => {
  const { user } = useFocusUser();
  const [boltz, setBoltz] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [moreLoading, setMoreLoading] = useState(false);
  const ITEMS_PER_PAGE = 10;
  // Always use boltz_saves as the correct table
  const BOLTZ_SAVES_TABLE = 'boltz_saves';

  // ── Use ref for user so fetchInitialBoltz is STABLE (only tab dep) ──
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── Initial Fetch — fetchInitialBoltz only changes when `tab` changes ─
  const fetchInitialBoltz = useCallback(async () => {
    const currentUser = userRef.current;
    let boltzData = [];

    if (tab === 'following' && currentUser?.id) {
      const { data: followingData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);

      const followingIds = followingData?.map((f) => f.following_id) || [];
      if (followingIds.length === 0) return [];

      const { data, error } = await supabase
        .from('boltz')
        .select('*, profiles:user_id(id, username, full_name, avatar_url, is_verified)')
        .in('user_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(ITEMS_PER_PAGE);

      if (error) throw error;
      boltzData = data || [];
    } else {
      if (currentUser?.id) {
        await assertTrustShieldVerified(currentUser.id);
      }

      // Use unified RPC that handles all column variations
      const { data: secureData, error: secureError } = currentUser?.id
        ? await supabase.rpc('get_boltz_feed_secure', {
            p_user_id: currentUser.id,
            p_limit: ITEMS_PER_PAGE,
            p_offset: 0,
          })
        : { data: null, error: new Error('UNAUTHENTICATED') };

      // For You — public boltz, no auth required
      const { data, error } = !secureError
        ? { data: secureData, error: null }
        : await supabase.rpc('get_public_boltz_feed', {
            p_limit: ITEMS_PER_PAGE,
            p_offset: 0,
          });

      if (error) throw error;
      boltzData = data || [];
    }

    // Fetch interactions (non-blocking, never fails the whole fetch)
    let userLikes = [];
    let userSaves = [];
    if (currentUser?.id && boltzData.length > 0) {
      const boltzIds = boltzData.map((b) => b.id);
      const saveTable = BOLTZ_SAVES_TABLE;
      const [likesRes, savesRes] = await Promise.allSettled([
        supabase.from('boltz_likes').select('boltz_id').eq('user_id', currentUser.id).in('boltz_id', boltzIds),
        supabase.from(saveTable).select('boltz_id').eq('user_id', currentUser.id).in('boltz_id', boltzIds),
      ]);
      if (likesRes.status === 'fulfilled') {
        userLikes = likesRes.value?.data?.map((l) => l.boltz_id) || [];
      }
      if (savesRes.status === 'fulfilled') {
        userSaves = savesRes.value?.data?.map((s) => s.boltz_id) || [];
      }
    }

    return boltzData.map((item) => {
      const profileObj =
        (Array.isArray(item.profiles) ? item.profiles[0] : item.profiles) ||
        {
          id: item.user_id,
          username: item.username,
          full_name: item.full_name,
          avatar_url: item.avatar_url,
          is_verified: item.is_verified,
        };
      const safeProfile = normalizeHydratedProfile(profileObj, item.user_id);
      return {
        ...item,
        user: safeProfile,
        profiles: safeProfile,
        likes_count:    item.likes_count    || 0,
        comments_count: item.comments_count || 0,
        saves_count:    item.saves_count    || 0,
        shares_count:   item.shares_count   || 0,
        is_liked:       userLikes.includes(item.id),
        is_saved:       userSaves.includes(item.id),
        thumbnail_url:  item.thumbnail_url || item.poster_url || item.preview_image || item.cover_url || null,
      };
    });
  }, [tab]); // ← ONLY tab dep + stable helpers.

  const {
    loading: initialLoading,
    error:   initialError,
    refetch: refetchInitial,
  } = useRobustQuery(fetchInitialBoltz, {
    enabled:    true,
    retries:    2,
    retryDelay: 1500,
    timeout:    12000,
    onSuccess: (data) => {
      // Apply recommendation engine ranking for 'foryou' tab
      const ranked = (tab === 'foryou' || tab === 'trending') ? rankBoltzFeed(data || []) : (data || []);
      setBoltz(ranked);
      setPage(0);
      setHasMore((data || []).length >= ITEMS_PER_PAGE);
    },
  });

  // ── Load More ─────────────────────────────────────────────────────────
  const loadMore = async () => {
    if (moreLoading || !hasMore || initialLoading) return;
    setMoreLoading(true);

    try {
      const currentUser = userRef.current;
      const nextPage = page + 1;
      const offset   = nextPage * ITEMS_PER_PAGE;
      let newItems   = [];

      if (tab === 'following' && currentUser?.id) {
        // Use following-specific RPC
        const { data } = await supabase.rpc('get_following_boltz_feed', {
          p_user_id: currentUser.id,
          p_limit: ITEMS_PER_PAGE,
          p_offset: offset,
        });
        newItems = data || [];
      } else {
        // Use unified RPC that handles all column variations
        const { data: secureData, error: secureError } = currentUser?.id
          ? await supabase.rpc('get_boltz_feed_secure', {
              p_user_id: currentUser.id,
              p_limit: ITEMS_PER_PAGE,
              p_offset: offset,
            })
          : { data: null, error: new Error('UNAUTHENTICATED') };

        const { data: publicData } = await supabase.rpc('get_public_boltz_feed', {
          p_limit: ITEMS_PER_PAGE,
          p_offset: offset,
        });

        newItems = secureError ? (publicData || []) : (secureData || publicData || []);
      }

      let userLikes = [], userSaves = [];
      if (userRef.current?.id && newItems.length > 0) {
        const boltzIds = newItems.map((b) => b.id);
        const saveTable = BOLTZ_SAVES_TABLE;
        const [likesRes, savesRes] = await Promise.allSettled([
          supabase.from('boltz_likes').select('boltz_id').eq('user_id', userRef.current.id).in('boltz_id', boltzIds),
          supabase.from(saveTable).select('boltz_id').eq('user_id', userRef.current.id).in('boltz_id', boltzIds),
        ]);
        if (likesRes.status === 'fulfilled') userLikes = likesRes.value?.data?.map((l) => l.boltz_id) || [];
        if (savesRes.status === 'fulfilled') userSaves = savesRes.value?.data?.map((s) => s.boltz_id) || [];
      }

      const processed = newItems.map((item) => {
        const p =
          (Array.isArray(item.profiles) ? item.profiles[0] : item.profiles) ||
          {
            id: item.user_id,
            username: item.username,
            full_name: item.full_name,
            avatar_url: item.avatar_url,
            is_verified: item.is_verified,
          };
        const safeProfile = normalizeHydratedProfile(p, item.user_id);
        return {
          ...item,
          user:           safeProfile,
          profiles:       safeProfile,
          likes_count:    item.likes_count    || 0,
          comments_count: item.comments_count || 0,
          saves_count:    item.saves_count    || 0,
          shares_count:   item.shares_count   || 0,
          is_liked:       userLikes.includes(item.id),
          is_saved:       userSaves.includes(item.id),
          thumbnail_url:  item.thumbnail_url || item.poster_url || item.preview_image || item.cover_url || null,
        };
      });

      setBoltz((prev) => [...prev, ...processed]);
      setPage(nextPage);
      setHasMore(newItems.length >= ITEMS_PER_PAGE);
    } catch (err) {
      console.warn('Load more boltz failed:', err);
      setHasMore(false);
    } finally {
      setMoreLoading(false);
    }
  };

  // ── Realtime: new boltz in for-you tab ───────────────────────────────
  useRealtimeSubscription({
    channelName: 'boltz-feed-updates',
    table:       'boltz',
    event:       'INSERT',
    enabled:     tab === 'foryou',
    onEvent:     () => { /* Could show "New boltz" banner */ },
  });

  return {
    boltz,
    loading: initialLoading || moreLoading,
    initialLoading,
    error:   initialError,
    hasMore,
    loadMore,
    refresh: refetchInitial,
    setBoltz,
  };
};
