import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import NotificationToast from './NotificationToast';
import pushNotifications from '../utils/pushNotifications';

/**
 * RealtimeNotifications Component
 * Handles real-time notification delivery with toast notifications and badge updates
 */
export default function RealtimeNotifications({ user, onUnreadCountChange }) {
  const [currentNotification, setCurrentNotification] = useState(null);
  const subscriptionRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time notifications
    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        // Fetch the complete notification with actor profile data
        const { data } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:actor_id(id, username, full_name, avatar_url, is_verified)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data) {
          // Show toast notification
          showToastNotification(data);

          // Update unread count
          if (onUnreadCountChange) {
            const { data: unreadData } = await supabase
              .from('notifications')
              .select('id')
              .eq('user_id', user.id)
              .eq('is_read', false);
            
            onUnreadCountChange(unreadData?.length || 0);
          }

          // Show browser push notification if app is in background
          if (document.hidden) {
            showPushNotification(data);
          }
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async () => {
        // Update unread count when notifications are marked as read
        if (onUnreadCountChange) {
          const { data: unreadData } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_read', false);
          
          onUnreadCountChange(unreadData?.length || 0);
        }
      })
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [user, onUnreadCountChange]);

  const showToastNotification = (notification) => {
    // Clear any existing toast timeout
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    // Show the toast
    setCurrentNotification(notification);

    // Auto-hide after 5 seconds
    toastTimeoutRef.current = setTimeout(() => {
      setCurrentNotification(null);
    }, 5000);
  };

  const showPushNotification = async (notification) => {
    const actor = notification.actor;
    const actorName = actor?.full_name || actor?.username || 'Someone';

    switch (notification.type) {
      case 'like':
        await pushNotifications.notifyLike(actorName, notification.content_type);
        break;
      case 'comment':
        await pushNotifications.notifyComment(actorName, notification.text, notification.content_type);
        break;
      case 'follow':
        await pushNotifications.notifyFollow(actorName);
        break;
      case 'follow_request':
        await pushNotifications.notifyFollowRequest(actorName);
        break;
      case 'message':
        await pushNotifications.notifyMessage(actorName, notification.text);
        break;
      case 'group_message':
        await pushNotifications.showNotification('New Group Message', {
          body: notification.text,
          tag: `group-${notification.reference_id}`,
          icon: actor?.avatar_url
        });
        break;
      default:
        await pushNotifications.showNotification(actorName, {
          body: notification.text,
          tag: `notification-${notification.id}`
        });
    }
  };

  const handleCloseToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setCurrentNotification(null);
  };

  return (
    <>
      {currentNotification && (
        <NotificationToast
          notification={currentNotification}
          onClose={handleCloseToast}
        />
      )}
    </>
  );
}

/**
 * Hook version for use in other components
 */
export const useRealtimeNotifications = (user, onNotification) => {
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`notifications_hook_${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, async (payload) => {
        const { data } = await supabase
          .from('notifications')
          .select(`
            *,
            actor:actor_id(id, username, full_name, avatar_url, is_verified)
          `)
          .eq('id', payload.new.id)
          .single();

        if (data && onNotification) {
          onNotification(data);
        }
      })
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user, onNotification]);

  return subscriptionRef.current;
};