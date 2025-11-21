// src/hooks/useNotifications.js
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

export const useNotifications = (userId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:actor_id(id, username, full_name, avatar_url, is_verified)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (fetchError) throw fetchError;
        
        const validNotifications = (data || []).filter(n => n.actor);
        setNotifications(validNotifications);
        setUnreadCount(validNotifications.filter(n => !n.is_read).length || 0);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
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
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);
      
      if (updateError) throw updateError;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
      throw err;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);
      
      if (deleteError) throw deleteError;
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deletedNotif = notifications.find(n => n.id === notificationId);
        return deletedNotif && !deletedNotif.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      throw err;
    }
  };

  const refetch = async () => {
    if (!userId) return;
    
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:actor_id(id, username, full_name, avatar_url, is_verified)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (fetchError) throw fetchError;
      
      const validNotifications = (data || []).filter(n => n.actor);
      setNotifications(validNotifications);
      setUnreadCount(validNotifications.filter(n => !n.is_read).length || 0);
    } catch (err) {
      console.error('Error refetching notifications:', err);
      setError('Failed to refresh notifications');
      throw err;
    }
  };

  return { 
    notifications, 
    unreadCount, 
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch
  };
};
