import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './TopBar.module.css';
import CustomIcon from '../CustomIcon/CustomIcon';
import { supabase } from '../../lib/supabase';

const TopBar = () => {
    const navigate = useNavigate();
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        // Fetch unread counts
        fetchUnreadCounts();

        // Subscribe to real-time updates
        const notificationsSubscription = supabase
            .channel('notifications-unread')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'notifications' },
                fetchUnreadCounts
            )
            .subscribe();

        const messagesSubscription = supabase
            .channel('messages-unread')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'messages' },
                fetchUnreadCounts
            )
            .subscribe();

        return () => {
            notificationsSubscription.unsubscribe();
            messagesSubscription.unsubscribe();
        };
    }, []);

    const fetchUnreadCounts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get unread notifications count
            const { count: notifCount } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('read', false);

            // Get unread messages count
            const { count: msgCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('recipient_id', user.id)
                .eq('read', false);

            setUnreadNotifications(notifCount || 0);
            setUnreadMessages(msgCount || 0);
        } catch (error) {
            console.error('Error fetching unread counts:', error);
        }
    };

    const handleNotificationsClick = () => {
        if (navigator.vibrate) navigator.vibrate(10);
        navigate('/notifications');
    };

    const handleMessagesClick = () => {
        if (navigator.vibrate) navigator.vibrate(10);
        navigate('/messages');
    };

    return (
        <header className={styles.topBar}>
            <div className={styles.logo} onClick={() => navigate('/home')}>
                <h1 className="text-gradient">Focus</h1>
            </div>

            <div className={styles.actions}>
                {/* Notifications Button */}
                <button
                    className={styles.actionBtn}
                    onClick={handleNotificationsClick}
                    aria-label="Notifications"
                >
                    <CustomIcon name="notifications" size={24} />
                    {unreadNotifications > 0 && (
                        <span className={styles.badge} aria-label={`${unreadNotifications} unread notifications`}>
                            {unreadNotifications > 99 ? '99+' : unreadNotifications}
                        </span>
                    )}
                </button>

                {/* Messages Button */}
                <button
                    className={styles.actionBtn}
                    onClick={handleMessagesClick}
                    aria-label="Messages"
                >
                    <CustomIcon name="messages" size={24} />
                    {unreadMessages > 0 && (
                        <span className={styles.badge} aria-label={`${unreadMessages} unread messages`}>
                            {unreadMessages > 99 ? '99+' : unreadMessages}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};

export default TopBar;
