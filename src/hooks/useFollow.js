import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useFollow - Hook for follow/unfollow functionality with optimistic updates
 * @param {string} currentUserId - Current user's ID
 * @param {string} targetUserId - Target user's ID to follow/unfollow
 * @returns {object} Follow state and methods
 */
export const useFollow = (currentUserId, targetUserId) => {
  const [followStatus, setFollowStatus] = useState(null); // null, 'pending', 'accepted'
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const mounted = useRef(true);
  const subscription = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, []);

  // Check follow status
  const checkFollowStatus = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setChecking(false);
      return;
    }

    try {
      setChecking(true);

      const { data, error } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (mounted.current) {
        setFollowStatus(data?.status || null);
      }
    } catch (err) {
      console.error('Error checking follow status:', err);
      if (mounted.current) {
        setFollowStatus(null);
      }
    } finally {
      if (mounted.current) {
        setChecking(false);
      }
    }
  }, [currentUserId, targetUserId]);

  // Follow user
  const follow = useCallback(async () => {
    if (!currentUserId || !targetUserId || loading) return;

    const previousStatus = followStatus;

    try {
      setLoading(true);

      // Check if target profile is private
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('is_private')
        .eq('id', targetUserId)
        .single();

      const newStatus = targetProfile?.is_private ? 'pending' : 'accepted';

      // Optimistic update
      setFollowStatus(newStatus);

      // Insert follow record
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: currentUserId,
          following_id: targetUserId,
          status: newStatus
        });

      if (error) throw error;

      // Send notification if accepted
      if (newStatus === 'accepted') {
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: currentUserId,
          type: 'follow',
          read: false
        });
      } else {
        // Send follow request notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: currentUserId,
          type: 'follow_request',
          read: false
        });
      }
    } catch (err) {
      console.error('Error following user:', err);
      // Revert optimistic update
      if (mounted.current) {
        setFollowStatus(previousStatus);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [currentUserId, targetUserId, followStatus, loading]);

  // Unfollow user
  const unfollow = useCallback(async () => {
    if (!currentUserId || !targetUserId || loading) return;

    const previousStatus = followStatus;

    try {
      setLoading(true);

      // Optimistic update
      setFollowStatus(null);

      // Delete follow record
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;

      // Delete follow notification
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', targetUserId)
        .eq('actor_id', currentUserId)
        .in('type', ['follow', 'follow_request']);
    } catch (err) {
      console.error('Error unfollowing user:', err);
      // Revert optimistic update
      if (mounted.current) {
        setFollowStatus(previousStatus);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [currentUserId, targetUserId, followStatus, loading]);

  // Toggle follow
  const toggleFollow = useCallback(async () => {
    if (followStatus) {
      await unfollow();
    } else {
      await follow();
    }
  }, [followStatus, follow, unfollow]);

  // Setup real-time subscription
  useEffect(() => {
    if (!currentUserId || !targetUserId) return;

    const channel = supabase
      .channel(`follow:${currentUserId}:${targetUserId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `follower_id=eq.${currentUserId},following_id=eq.${targetUserId}`
      }, (payload) => {
        if (mounted.current) {
          if (payload.eventType === 'DELETE') {
            setFollowStatus(null);
          } else if (payload.new) {
            setFollowStatus(payload.new.status);
          }
        }
      })
      .subscribe();

    subscription.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId, targetUserId]);

  // Initial check
  useEffect(() => {
    checkFollowStatus();
  }, [checkFollowStatus]);

  return {
    followStatus,
    loading,
    checking,
    isFollowing: followStatus === 'accepted',
    isPending: followStatus === 'pending',
    follow,
    unfollow,
    toggleFollow,
    refresh: checkFollowStatus
  };
};

/**
 * useFollowersList - Hook for fetching and managing followers list
 */
export const useFollowersList = (userId) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchFollowers = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('follows')
        .select(`
          follower_id,
          created_at,
          profiles:follower_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('following_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (mounted.current) {
        setFollowers(data?.map(f => f.profiles).filter(Boolean) || []);
      }
    } catch (err) {
      console.error('Error fetching followers:', err);
      if (mounted.current) {
        setError(err.message);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  return {
    followers,
    loading,
    error,
    refresh: fetchFollowers
  };
};

/**
 * useFollowingList - Hook for fetching and managing following list
 */
export const useFollowingList = (userId) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchFollowing = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('follows')
        .select(`
          following_id,
          created_at,
          profiles:following_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('follower_id', userId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (mounted.current) {
        setFollowing(data?.map(f => f.profiles).filter(Boolean) || []);
      }
    } catch (err) {
      console.error('Error fetching following:', err);
      if (mounted.current) {
        setError(err.message);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [userId]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  return {
    following,
    loading,
    error,
    refresh: fetchFollowing
  };
};

export default useFollow;
