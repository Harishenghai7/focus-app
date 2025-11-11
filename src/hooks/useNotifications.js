// src/hooks/useNotifications.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:actor_id(username, full_name, avatar_url)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);
        
        if (error) throw error;
        
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.is_read).length || 0);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const { data: fullNotif } = await supabase
            .from('notifications')
            .select(`
              *,
              actor:actor_id(username, full_name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (fullNotif) {
            setNotifications(prev => [fullNotif, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => prev.map(n => 
            n.id === payload.new.id ? { ...n, ...payload.new } : n
          ));
          
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          } else if (!payload.new.is_read && payload.old.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          if (!payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  return { 
    notifications, 
    unreadCount, 
    loading,
    markAsRead,
    markAllAsRead
  };
};
