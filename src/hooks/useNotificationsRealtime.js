import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export const useNotificationsRealtime = (userId, setNotifications, onNewNotification) => {
    const channelRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        // Subscribe to notifications for current user
        channelRef.current = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                async (payload) => {
                    // Fetch the complete notification with actor data
                    const { data, error } = await supabase
                        .from('notifications')
                        .select(`
                            *,
                            actor:profiles!actor_id(
                                id,
                                username,
                                full_name,
                                avatar_url,
                                is_verified
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (!error && data) {
                        // Add to notifications list at the top
                        setNotifications(prev => [data, ...prev]);

                        // Trigger callback for additional actions (sound, browser notification, etc.)
                        if (onNewNotification) {
                            onNewNotification(data);
                        }

                        // Request browser notification permission if not already granted
                        if ('Notification' in window && Notification.permission === 'default') {
                            Notification.requestPermission();
                        }

                        // Show browser notification if permitted
                        if ('Notification' in window && Notification.permission === 'granted') {
                            const notificationTitle = data.actor?.username || 'Focus';
                            const notificationBody = getNotificationText(data);

                            const notification = new Notification(notificationTitle, {
                                body: notificationBody,
                                icon: data.actor?.avatar_url || '/logo192.png',
                                badge: '/logo192.png',
                                tag: data.id,
                                requireInteraction: false
                            });

                            // Auto-close after 5 seconds
                            setTimeout(() => notification.close(), 5000);
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    // Update notification in list
                    setNotifications(prev =>
                        prev.map(notif =>
                            notif.id === payload.new.id ? { ...notif, ...payload.new } : notif
                        )
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    // Remove notification from list
                    setNotifications(prev =>
                        prev.filter(notif => notif.id !== payload.old.id)
                    );
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [userId, setNotifications, onNewNotification]);
};

// Helper function to generate notification text
const getNotificationText = (notification) => {
    const actorName = notification.actor?.username || 'Someone';

    switch (notification.type) {
        case 'like':
            return `${actorName} liked your ${notification.content_type || 'post'}`;
        case 'comment':
            return `${actorName} commented on your ${notification.content_type || 'post'}`;
        case 'mention':
            return `${actorName} mentioned you`;
        case 'follow':
            return `${actorName} started following you`;
        case 'boltz':
            return `${actorName} posted a new Boltz`;
        case 'message_request':
            return `${actorName} sent you a message request`;
        case 'system':
            return notification.text || 'You have a new notification';
        default:
            return notification.text || 'You have a new notification';
    }
};
