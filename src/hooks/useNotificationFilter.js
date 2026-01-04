import { useState, useMemo } from 'react';

export const useNotificationFilter = (notifications) => {
    const [activeTab, setActiveTab] = useState('all');

    // Calculate unread counts per type
    const unreadCounts = useMemo(() => {
        const counts = {
            all: 0,
            unread: 0,
            mention: 0,
            comment: 0,
            like: 0,
            follow: 0,
            boltz: 0,
            system: 0,
            message_request: 0
        };

        notifications.forEach(notif => {
            if (!notif.is_read) {
                counts.all++;
                counts.unread++;

                if (notif.type === 'mention') counts.mention++;
                else if (notif.type === 'comment') counts.comment++;
                else if (notif.type === 'like') counts.like++;
                else if (notif.type === 'follow') counts.follow++;
                else if (notif.type === 'boltz') counts.boltz++;
                else if (notif.type === 'system') counts.system++;
                else if (notif.type === 'message_request') counts.message_request++;
            }
        });

        return counts;
    }, [notifications]);

    // Filter notifications based on active tab
    const filteredNotifications = useMemo(() => {
        if (activeTab === 'all') {
            return notifications;
        }

        if (activeTab === 'unread') {
            return notifications.filter(notif => !notif.is_read);
        }

        return notifications.filter(notif => notif.type === activeTab);
    }, [notifications, activeTab]);

    // Tab configuration
    const tabs = useMemo(() => [
        { id: 'all', label: 'All', count: unreadCounts.all },
        { id: 'unread', label: 'Unread', count: unreadCounts.unread },
        { id: 'mention', label: 'Mentions', count: unreadCounts.mention },
        { id: 'comment', label: 'Comments', count: unreadCounts.comment },
        { id: 'like', label: 'Likes', count: unreadCounts.like },
        { id: 'follow', label: 'Follows', count: unreadCounts.follow },
        { id: 'boltz', label: 'Boltz', count: unreadCounts.boltz },
        { id: 'system', label: 'System', count: unreadCounts.system },
        { id: 'message_request', label: 'Requests', count: unreadCounts.message_request }
    ], [unreadCounts]);

    return {
        activeTab,
        setActiveTab,
        filteredNotifications,
        unreadCounts,
        tabs
    };
};
