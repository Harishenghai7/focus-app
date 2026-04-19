import { useState, useEffect } from 'react';

/**
 * Hook for managing browser push notifications
 * Handles permission requests and notification display
 */
export const usePushNotifications = () => {
    const [permission, setPermission] = useState('default');
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        // Check if notifications are supported
        if ('Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) {
            return { success: false, error: 'Notifications not supported' };
        }

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                return { success: true, permission: result };
            } else {
                return { success: false, error: 'Permission denied' };
            }
        } catch (error) {
            console.error('Push notification permission error:', error);
            return { success: false, error: error.message };
        }
    };

    const showNotification = (title, options = {}) => {
        if (permission !== 'granted') {
            console.warn('Cannot show notification: permission not granted');
            return;
        }

        const defaultOptions = {
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [200, 100, 200],
            ...options
        };

        try {
            new Notification(title, defaultOptions);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    };

    return {
        permission,
        isSupported,
        requestPermission,
        showNotification,
        isGranted: permission === 'granted'
    };
};
