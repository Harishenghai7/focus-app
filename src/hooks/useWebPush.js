/**
 * useWebPush Hook - FREE & OPEN SOURCE Web Push Notifications
 * Uses native Web Push API (NO Firebase, NO FCM, 100% Free)
 * 
 * Technologies:
 * - Web Push API (browser standard, free)
 * - VAPID keys for authentication (self-generated, free)
 * - Service Worker for background delivery (browser standard, free)
 * - Supabase for subscription storage (free tier available)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

/**
 * Convert VAPID key to Uint8Array for push subscription
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const useWebPush = (userId) => {
    const [permission, setPermission] = useState('default');
    const [subscription, setSubscription] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [foregroundMessage, setForegroundMessage] = useState(null);

    const serviceWorkerRef = useRef(null);

    // Check browser support
    useEffect(() => {
        const checkSupport = () => {
            const supported =
                'Notification' in window &&
                'serviceWorker' in navigator &&
                'PushManager' in window;
            setIsSupported(supported);

            if (supported) {
                setPermission(Notification.permission);
            }
        };

        checkSupport();
    }, []);

    // Register service worker
    const registerServiceWorker = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            serviceWorkerRef.current = registration;
            return registration;
        } catch (err) {
            console.error('Service Worker registration failed:', err);
            throw err;
        }
    }, []);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            setError('Push notifications not supported in this browser');
            return { success: false, error: 'Not supported' };
        }

        setLoading(true);
        setError(null);

        try {
            const result = await Notification.requestPermission();
            setPermission(result);

            if (result === 'granted') {
                return { success: true, permission: result };
            } else {
                setError('Notification permission denied');
                return { success: false, error: 'Permission denied' };
            }
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [isSupported]);

    // Subscribe to push notifications
    const subscribe = useCallback(async () => {
        if (!userId || !isSupported || permission !== 'granted' || !VAPID_PUBLIC_KEY) {
            return { success: false, error: 'Prerequisites not met' };
        }

        setLoading(true);
        setError(null);

        try {
            // Register service worker
            let registration = serviceWorkerRef.current;
            if (!registration) {
                registration = await registerServiceWorker();
            }

            // Check for existing subscription
            let pushSubscription = await registration.pushManager.getSubscription();

            // Create new subscription if none exists
            if (!pushSubscription) {
                pushSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
            }

            setSubscription(pushSubscription);

            // Save to Supabase
            const subscriptionJson = pushSubscription.toJSON();
            const { error: dbError } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: userId,
                    push_subscription: subscriptionJson,
                    push_notifications_enabled: true,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id'
                });

            if (dbError) {
                console.error('Error saving push subscription:', dbError);
            }

            return { success: true, subscription: pushSubscription };
        } catch (err) {
            console.error('Push subscription error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [userId, isSupported, permission, registerServiceWorker]);

    // Unsubscribe from push notifications
    const unsubscribe = useCallback(async () => {
        if (!userId) return { success: false };

        setLoading(true);

        try {
            const registration = serviceWorkerRef.current;
            if (registration) {
                const pushSubscription = await registration.pushManager.getSubscription();
                if (pushSubscription) {
                    await pushSubscription.unsubscribe();
                }
            }

            // Update database
            await supabase
                .from('user_settings')
                .update({
                    push_subscription: null,
                    push_notifications_enabled: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            setSubscription(null);

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Show local notification
    const showLocalNotification = useCallback((title, options = {}) => {
        if (permission !== 'granted') {
            console.warn('Cannot show notification: permission not granted');
            return;
        }

        const defaultOptions = {
            icon: '/logo192.png',
            badge: '/badge-72x72.png',
            vibrate: [200, 100, 200],
            ...options
        };

        try {
            new Notification(title, defaultOptions);
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }, [permission]);

    // Listen for foreground messages from service worker
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type === 'PUSH_NOTIFICATION') {
                setForegroundMessage(event.data.payload);

                // Show in-app notification
                if (event.data.payload?.title) {
                    showLocalNotification(
                        event.data.payload.title,
                        event.data.payload.options
                    );
                }
            }
        };

        navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
        };
    }, [showLocalNotification]);

    // Auto-subscribe when permission is granted and user is logged in
    useEffect(() => {
        if (permission === 'granted' && userId && !subscription) {
            subscribe();
        }
    }, [permission, userId, subscription, subscribe]);

    // Check existing subscription on mount
    useEffect(() => {
        const checkExistingSubscription = async () => {
            if (!isSupported) return;

            try {
                const registration = await navigator.serviceWorker.ready;
                serviceWorkerRef.current = registration;

                const existingSub = await registration.pushManager.getSubscription();
                if (existingSub) {
                    setSubscription(existingSub);
                }
            } catch (err) {
                console.error('Error checking subscription:', err);
            }
        };

        checkExistingSubscription();
    }, [isSupported]);

    return {
        permission,
        subscription,
        isSupported,
        loading,
        error,
        foregroundMessage,
        isGranted: permission === 'granted',
        isDenied: permission === 'denied',
        requestPermission,
        subscribe,
        unsubscribe,
        showLocalNotification,
        clearForegroundMessage: () => setForegroundMessage(null),
    };
};

export default useWebPush;
