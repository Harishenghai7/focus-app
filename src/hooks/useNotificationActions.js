import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { focusToast } from '../utils/focusToast';

export const useNotificationActions = (userId, setNotifications) => {
    const [processing, setProcessing] = useState(false);

    const markAsRead = useCallback(async (notificationId) => {
        if (!notificationId) return;

        // Optimistic update
        setNotifications(prev =>
            prev.map(notif =>
                notif.id === notificationId
                    ? { ...notif, is_read: true, read_at: new Date().toISOString() }
                    : notif
            )
        );

        try {
            const { error } = await supabase
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', notificationId);

            if (error) throw error;
        } catch (err) {
            console.error('Error marking notification as read:', err);

            // Rollback optimistic update
            setNotifications(prev =>
                prev.map(notif =>
                    notif.id === notificationId
                        ? { ...notif, is_read: false, read_at: null }
                        : notif
                )
            );

            focusToast.error('Failed to mark as read');
        }
    }, [setNotifications]);

    const markAllAsRead = useCallback(async () => {
        if (!userId) return;

        setProcessing(true);

        // Get all unread notification IDs for optimistic update
        const unreadIds = [];
        setNotifications(prev => {
            const updated = prev.map(notif => {
                if (!notif.is_read) {
                    unreadIds.push(notif.id);
                    return { ...notif, is_read: true, read_at: new Date().toISOString() };
                }
                return notif;
            });
            return updated;
        });

        try {
            const { error } = await supabase
                .from('notifications')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .eq('is_read', false);

            if (error) throw error;

            focusToast.success('All notifications marked as read');
        } catch (err) {
            console.error('Error marking all as read:', err);

            // Rollback optimistic update
            setNotifications(prev =>
                prev.map(notif =>
                    unreadIds.includes(notif.id)
                        ? { ...notif, is_read: false, read_at: null }
                        : notif
                )
            );

            focusToast.error('Failed to mark all as read');
        } finally {
            setProcessing(false);
        }
    }, [userId, setNotifications]);

    const deleteNotification = useCallback(async (notificationId) => {
        if (!notificationId) return;

        // Store for rollback
        let deletedNotification = null;

        // Optimistic update
        setNotifications(prev => {
            deletedNotification = prev.find(n => n.id === notificationId);
            return prev.filter(notif => notif.id !== notificationId);
        });

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

            if (error) throw error;
        } catch (err) {
            console.error('Error deleting notification:', err);

            // Rollback optimistic update
            if (deletedNotification) {
                setNotifications(prev => [...prev, deletedNotification].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                ));
            }

            focusToast.error('Failed to delete notification');
        }
    }, [setNotifications]);

    const clearAll = useCallback(async () => {
        if (!userId) return;

        setProcessing(true);

        // Store for rollback
        let previousNotifications = [];
        setNotifications(prev => {
            previousNotifications = [...prev];
            return [];
        });

        try {
            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', userId);

            if (error) throw error;

            focusToast.success('All notifications cleared');
        } catch (err) {
            console.error('Error clearing notifications:', err);

            // Rollback
            setNotifications(previousNotifications);

            focusToast.error('Failed to clear notifications');
        } finally {
            setProcessing(false);
        }
    }, [userId, setNotifications]);

    return {
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        processing
    };
};
