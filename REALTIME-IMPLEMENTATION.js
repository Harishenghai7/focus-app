// Realtime Implementation Examples for Focus App

// ============================================
// 1. HOME FEED - Posts with realtime updates
// ============================================
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export function useHomeFeed(userId) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*), post_likes(count)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error) setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();

    // Realtime subscription
    const channel = supabase
      .channel('home-feed')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts(prev => [payload.new, ...prev]);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  return { posts, loading };
}

// ============================================
// 2. MESSAGES - Chat with typing indicators
// ============================================
export function useChatMessages(chatId, currentUserId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    if (!chatId) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });
      
      setMessages(data || []);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages(prev => [...prev, payload.new].sort((a, b) => 
            new Date(a.created_at) - new Date(b.created_at)
          ));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typing = Object.values(state)
          .flat()
          .filter(u => u.typing && u.user_id !== currentUserId)
          .map(u => u.user_id);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, typing: false });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [chatId, currentUserId]);

  const setTyping = async (isTyping) => {
    const channel = supabase.channel(`chat:${chatId}`);
    await channel.track({ user_id: currentUserId, typing: isTyping });
  };

  return { messages, typingUsers, setTyping };
}

// ============================================
// 3. NOTIFICATIONS - Real-time notifications
// ============================================
export function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Fetch initial
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    };
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
          if (payload.new.read && !payload.old.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
  };

  return { notifications, unreadCount, markAsRead };
}

// ============================================
// 4. BOLTZ - Video interactions
// ============================================
export function useBoltzInteractions(boltzId, userId) {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!boltzId) return;

    // Fetch initial data
    const fetchData = async () => {
      const [likesRes, userLikeRes, commentsRes] = await Promise.all([
        supabase.from('boltz_likes').select('id', { count: 'exact' }).eq('boltz_id', boltzId),
        supabase.from('boltz_likes').select('id').eq('boltz_id', boltzId).eq('user_id', userId).single(),
        supabase.from('boltz_comments').select('*').eq('boltz_id', boltzId).order('created_at', { ascending: false })
      ]);
      
      setLikes(likesRes.count || 0);
      setIsLiked(!!userLikeRes.data);
      setComments(commentsRes.data || []);
    };
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel(`boltz:${boltzId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'boltz_likes', filter: `boltz_id=eq.${boltzId}` },
        async () => {
          const { count } = await supabase.from('boltz_likes').select('id', { count: 'exact' }).eq('boltz_id', boltzId);
          setLikes(count || 0);
        }
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'boltz_comments', filter: `boltz_id=eq.${boltzId}` },
        (payload) => {
          setComments(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boltzId, userId]);

  return { likes, isLiked, comments };
}

// ============================================
// 5. PROFILE - Follow counts
// ============================================
export function useProfileCounts(profileUserId) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (!profileUserId) return;

    // Fetch initial counts
    const fetchCounts = async () => {
      const [followersRes, followingRes] = await Promise.all([
        supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', profileUserId),
        supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', profileUserId)
      ]);
      
      setFollowers(followersRes.count || 0);
      setFollowing(followingRes.count || 0);
    };
    fetchCounts();

    // Realtime subscription
    const channel = supabase
      .channel(`profile:${profileUserId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'followers', filter: `following_id=eq.${profileUserId}` },
        async () => {
          const { count } = await supabase.from('followers').select('id', { count: 'exact' }).eq('following_id', profileUserId);
          setFollowers(count || 0);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'followers', filter: `follower_id=eq.${profileUserId}` },
        async () => {
          const { count } = await supabase.from('followers').select('id', { count: 'exact' }).eq('follower_id', profileUserId);
          setFollowing(count || 0);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profileUserId]);

  return { followers, following };
}
