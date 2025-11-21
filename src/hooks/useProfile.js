import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useProfile - Comprehensive hook for profile data, tabs, grids, and stats
 * @param {string} username - Username or user ID to fetch profile for
 * @param {object} currentUser - Current logged-in user
 * @returns {object} Profile state and methods
 */
export const useProfile = (username, currentUser) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Content states
  const [posts, setPosts] = useState([]);
  const [boltz, setBoltz] = useState([]);
  const [flash, setFlash] = useState([]);
  const [tagged, setTagged] = useState([]);
  const [saved, setSaved] = useState([]);
  
  // Loading states
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingBoltz, setLoadingBoltz] = useState(false);
  const [loadingFlash, setLoadingFlash] = useState(false);
  const [loadingTagged, setLoadingTagged] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
    boltz: 0,
    flash: 0
  });
  
  // Follow state
  const [followStatus, setFollowStatus] = useState(null);
  
  const mounted = useRef(true);
  const subscriptions = useRef([]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Cleanup subscriptions
      subscriptions.current.forEach(sub => {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      });
    };
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    if (!username) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch profile by username or ID
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${username},id.eq.${username}`)
        .single();

      if (profileError) throw profileError;

      if (mounted.current) {
        setProfile(data);
        await Promise.all([
          fetchStats(data.id),
          fetchFollowStatus(data.id)
        ]);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      if (mounted.current) {
        setError(err.message);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [username]);

  // Fetch profile stats
  const fetchStats = useCallback(async (profileId) => {
    if (!profileId) return;

    try {
      // Fetch posts count
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId);

      // Fetch followers count
      const { count: followersCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profileId)
        .eq('status', 'accepted');

      // Fetch following count
      const { count: followingCount } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', profileId)
        .eq('status', 'accepted');

      // Fetch boltz count
      const { count: boltzCount } = await supabase
        .from('boltz')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId);

      // Fetch flash count
      const { count: flashCount } = await supabase
        .from('flash')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileId)
        .gte('expires_at', new Date().toISOString());

      if (mounted.current) {
        setStats({
          posts: postsCount || 0,
          followers: followersCount || 0,
          following: followingCount || 0,
          boltz: boltzCount || 0,
          flash: flashCount || 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, []);

  // Fetch follow status
  const fetchFollowStatus = useCallback(async (profileId) => {
    if (!currentUser?.id || !profileId || currentUser.id === profileId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', currentUser.id)
        .eq('following_id', profileId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (mounted.current) {
        setFollowStatus(data?.status || null);
      }
    } catch (err) {
      console.error('Error fetching follow status:', err);
    }
  }, [currentUser?.id]);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoadingPosts(true);

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (mounted.current) {
        setPosts(data || []);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      if (mounted.current) {
        setLoadingPosts(false);
      }
    }
  }, [profile?.id]);

  // Fetch boltz
  const fetchBoltz = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoadingBoltz(true);

      const { data, error } = await supabase
        .from('boltz')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (mounted.current) {
        setBoltz(data || []);
      }
    } catch (err) {
      console.error('Error fetching boltz:', err);
    } finally {
      if (mounted.current) {
        setLoadingBoltz(false);
      }
    }
  }, [profile?.id]);

  // Fetch flash
  const fetchFlash = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoadingFlash(true);

      const { data, error } = await supabase
        .from('flash')
        .select('*')
        .eq('user_id', profile.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (mounted.current) {
        setFlash(data || []);
      }
    } catch (err) {
      console.error('Error fetching flash:', err);
    } finally {
      if (mounted.current) {
        setLoadingFlash(false);
      }
    }
  }, [profile?.id]);

  // Fetch tagged posts
  const fetchTagged = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoadingTagged(true);

      const { data, error } = await supabase
        .from('post_tags')
        .select('post_id, posts(*)')
        .eq('user_id', profile.id);

      if (error) throw error;

      if (mounted.current) {
        setTagged(data?.map(item => item.posts).filter(Boolean) || []);
      }
    } catch (err) {
      console.error('Error fetching tagged posts:', err);
    } finally {
      if (mounted.current) {
        setLoadingTagged(false);
      }
    }
  }, [profile?.id]);

  // Fetch saved posts (only for own profile)
  const fetchSaved = useCallback(async () => {
    if (!currentUser?.id || profile?.id !== currentUser.id) return;

    try {
      setLoadingSaved(true);

      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id, posts(*)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (mounted.current) {
        setSaved(data?.map(item => item.posts).filter(Boolean) || []);
      }
    } catch (err) {
      console.error('Error fetching saved posts:', err);
    } finally {
      if (mounted.current) {
        setLoadingSaved(false);
      }
    }
  }, [currentUser?.id, profile?.id]);

  // Setup real-time subscriptions
  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to profile updates
    const profileSub = supabase
      .channel(`profile:${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profile.id}`
      }, (payload) => {
        if (mounted.current && payload.new) {
          setProfile(payload.new);
        }
      })
      .subscribe();

    // Subscribe to follows changes for stats
    const followsSub = supabase
      .channel(`follows:${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${profile.id}`
      }, () => {
        if (mounted.current) {
          fetchStats(profile.id);
          if (currentUser?.id) {
            fetchFollowStatus(profile.id);
          }
        }
      })
      .subscribe();

    subscriptions.current = [profileSub, followsSub];

    return () => {
      profileSub.unsubscribe();
      followsSub.unsubscribe();
    };
  }, [profile?.id, currentUser?.id, fetchStats, fetchFollowStatus]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Update profile
  const updateProfile = useCallback(async (updates) => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      if (mounted.current) {
        setProfile(data);
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error updating profile:', err);
      return { data: null, error: err };
    }
  }, [profile?.id]);

  return {
    profile,
    loading,
    error,
    posts,
    boltz,
    flash,
    tagged,
    saved,
    loadingPosts,
    loadingBoltz,
    loadingFlash,
    loadingTagged,
    loadingSaved,
    stats,
    followStatus,
    fetchPosts,
    fetchBoltz,
    fetchFlash,
    fetchTagged,
    fetchSaved,
    updateProfile,
    refreshProfile: fetchProfile,
    refreshStats: () => fetchStats(profile?.id)
  };
};

export default useProfile;
