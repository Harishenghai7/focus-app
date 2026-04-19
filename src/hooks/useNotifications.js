import { useState, useEffect, useCallback } from 'react';
import { fetchNotifications, markNotificationRead, supabaseFetch } from '../utils/supabaseRest';
import { focusToast } from '../utils/focusToast';
import { useRobustQuery } from './useRobustQuery';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useAudio } from '../context/AudioProvider';
import { playNotification } from '../utils/audioFX';

export const useNotifications = (userId, filter = 'all', pageSize = 20) => {
    const { play } = useAudio();
    const normalizeNotification = useCallback((n) => ({
        ...n,
        is_read: Boolean(n.is_read ?? n.read),
        read: Boolean(n.read ?? n.is_read),
    }), []);

    const groupNotifications = useCallback((notifs) => {
        const grouped = [];
        const seen = new Map();

        notifs.forEach(n => {
            const key = (n.type === 'like' || n.type === 'comment') && n.post_id 
                ? `${n.type}-${n.post_id}` 
                : n.id;
                
            if (seen.has(key) && key !== n.id) {
                const existing = seen.get(key);
                existing.group_count = (existing.group_count || 1) + 1;
                existing.latest_actor = existing.latest_actor || [existing.actor];
                if (!existing.latest_actor.find(a => a?.id === n.actor?.id)) {
                    existing.latest_actor.push(n.actor);
                }
                existing.is_read = existing.is_read && n.is_read;
                existing.read = existing.read && n.read;
            } else {
                const item = { ...n, group_count: 1, latest_actor: [n.actor] };
                seen.set(key, item);
                grouped.push(item);
            }
        });
        return grouped;
    }, []);

    const [notifications, setNotifications] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [moreLoading, setMoreLoading] = useState(false);

    // Play unified premium notification sound.
    const playNotificationSound = useCallback(async () => {
        playNotification();
    }, []);

    // Show browser notification
    const showBrowserNotification = useCallback((notification) => {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const title = getNotificationTitle(notification);
            const body = getNotificationBody(notification);

            new Notification(title, {
                body,
                icon: notification.actor?.avatar_url || '/logo192.png',
                badge: '/logo192.png',
                tag: notification.id
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, []);

    const getNotificationTitle = (notification) => {
        const actors = notification.latest_actor || [notification.actor];
        const actorName = actors[0]?.full_name || actors[0]?.username || 'Someone';
        const count = notification.group_count > 1 ? ` and ${notification.group_count - 1} others` : '';
        
        switch (notification.type) {
            case 'follow': return `${actorName}${count} started following you`;
            case 'like': return `${actorName}${count} liked your post`;
            case 'comment': return `${actorName}${count} commented on your post`;
            case 'mention': return `${actorName}${count} mentioned you`;
            case 'message': return `New message from ${actorName}`;
            default: return 'New notification';
        }
    };

    const getNotificationBody = (notification) => {
        return (notification.type === 'comment' || notification.type === 'message')
            ? (notification.body || 'Tap to view')
            : '';
    };

    // 1. Initial Fetch with Robust Query (using REST API)
    const fetchInitialNotifications = useCallback(async () => {
        if (!userId) return [];

        console.log('🔔 Fetching notifications via REST API...');

        try {
            const notifs = await fetchNotifications(userId, {
                limit: pageSize,
                offset: 0,
                unreadOnly: filter === 'unread'
            });

            console.log(`✅ Fetched ${notifs.length} notifications`);
            return notifs;
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            throw error;
        }
    }, [userId, filter, pageSize]);

    const {
        data: initialData,
        loading: initialLoading,
        error: initialError,
        refetch: refetchInitial
    } = useRobustQuery(fetchInitialNotifications, {
        enabled: !!userId,
        retries: 3,
        onSuccess: (data) => {
            console.log('✅ Notifications loaded:', data?.length);
            const normalized = (data || []).map(normalizeNotification);
            setNotifications(groupNotifications(normalized));
            setPage(0);
            setHasMore((data || []).length === pageSize);

            // Count unread
            const unread = (data || []).filter(n => !(n.is_read ?? n.read)).length;
            setUnreadCount(unread);
        }
    });

    // 2. Load More
    const loadMore = async () => {
        if (moreLoading || !hasMore || initialLoading) return;
        setMoreLoading(true);

        try {
            const nextPage = page + 1;
            console.log('🔔 Loading more notifications, page:', nextPage);

            const newNotifs = await fetchNotifications(userId, {
                limit: pageSize,
                offset: nextPage * pageSize,
                unreadOnly: filter === 'unread'
            });

            const normalized = (newNotifs || []).map(normalizeNotification);
            setNotifications(prev => groupNotifications([...prev, ...normalized]));
            setPage(nextPage);
            setHasMore(newNotifs.length === pageSize);
            console.log(`✅ Loaded ${newNotifs.length} more notifications`);
        } catch (error) {
            console.error('❌ Error loading more notifications:', error);
        } finally {
            setMoreLoading(false);
        }
    };

    // 3. Mark as Read
    const markAsRead = async (notificationId) => {
        try {
            await markNotificationRead(notificationId);

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true, is_read: true } : n)
            );

            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // 4. Mark All as Read
    const markAllAsRead = async () => {
        try {
            // Update all unread notifications
            await supabaseFetch(`/notifications?user_id=eq.${userId}&read=eq.false`, {
                method: 'PATCH',
                body: JSON.stringify({ read: true })
            });

            setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
            setUnreadCount(0);
            focusToast.success('All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            focusToast.error('Failed to mark all as read');
        }
    };

    // 5. Realtime Subscription
    useRealtimeSubscription({
        channelName: `notifications-${userId}`,
        table: 'notifications',
        event: 'INSERT',
        enabled: !!userId,
        filter: `user_id=eq.${userId}`,
        onEvent: (payload) => {
            console.log('🔔 New notification received');
            const newNotif = normalizeNotification(payload.new);

            setNotifications(prev => groupNotifications([newNotif, ...prev]));
            setUnreadCount(prev => prev + 1);

            playNotificationSound();
            play('notification');
            showBrowserNotification(newNotif);

            focusToast.info(getNotificationTitle(newNotif));
        }
    });

    return {
        notifications,
        setNotifications,
        loading: initialLoading || moreLoading,
        error: initialError,
        hasMore,
        unreadCount,
        loadMore,
        markAsRead,
        markAllAsRead,
        refresh: refetchInitial,
    };
};
