/**
 * useFCM Hook - Firebase Cloud Messaging Integration
 * Handles FCM token registration, push notifications, and permission management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { supabase } from '../lib/supabase';

// Firebase configuration
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// VAPID key for web push
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

let app = null;
let messaging = null;

// Initialize Firebase once
const initializeFirebase = () => {
    if (!app && firebaseConfig.apiKey) {
        try {
            app = initializeApp(firebaseConfig);
            messaging = getMessaging(app);
            return { app, messaging };
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return { app: null, messaging: null };
        }
    }
    return { app, messaging };
};

export const useFCM = (userId) => {
    const [permission, setPermission] = useState('default');
    const [token, setToken] = useState(null);
    const [isSupported, setIsSupported] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [foregroundMessage, setForegroundMessage] = useState(null);

    const unsubscribeRef = useRef(null);

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

    // Register service worker and get FCM token
    const registerFCM = useCallback(async () => {
        if (!userId || !isSupported || permission !== 'granted') {
            return { success: false, error: 'Prerequisites not met' };
        }

        setLoading(true);
        setError(null);

        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            await navigator.serviceWorker.ready;

            // Initialize Firebase
            const { messaging: fcm } = initializeFirebase();

            if (!fcm) {
                throw new Error('Firebase messaging not initialized');
            }

            // Get FCM token
            const currentToken = await getToken(fcm, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
            });

            if (!currentToken) {
                throw new Error('No registration token available');
            }

            setToken(currentToken);

            // Save token to database
            const { error: dbError } = await supabase
                .from('user_settings')
                .upsert({
                    user_id: userId,
                    fcm_token: currentToken,
                    push_notifications_enabled: true,
                    updated_at: new Date().toISOString(),
                }, {
                    onConflict: 'user_id'
                });

            if (dbError) {
                console.error('Error saving FCM token:', dbError);
            }

            // Set up foreground message handler
            if (!unsubscribeRef.current) {
                unsubscribeRef.current = onMessage(fcm, (payload) => {

                    setForegroundMessage(payload);

                    // Show in-app notification
                    showInAppNotification(payload);
                });
            }

            return { success: true, token: currentToken };
        } catch (err) {
            console.error('FCM registration error:', err);
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [userId, isSupported, permission]);

    // Unregister FCM
    const unregisterFCM = useCallback(async () => {
        if (!userId) return { success: false };

        setLoading(true);

        try {
            // Unsubscribe from foreground messages
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }

            // Delete FCM token
            const { messaging: fcm } = initializeFirebase();
            if (fcm && token) {
                await deleteToken(fcm);
            }

            // Update database
            await supabase
                .from('user_settings')
                .update({
                    fcm_token: null,
                    push_notifications_enabled: false,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            setToken(null);

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [userId, token]);

    // Show in-app notification for foreground messages
    const showInAppNotification = (payload) => {
        const { notification, data } = payload;

        // Create and show custom notification UI
        if (notification) {
            // Use native notification for visibility
            if (Notification.permission === 'granted') {
                new Notification(notification.title || 'New Notification', {
                    body: notification.body || '',
                    icon: notification.icon || '/logo192.png',
                    badge: '/badge-72x72.png',
                    tag: data?.type || 'notification',
                    data: data,
                });
            }
        }
    };

    // Listen for service worker messages (for notification clicks when app is closed)
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type === 'NOTIFICATION_CLICK') {
                // Handle navigation from service worker
                const url = event.data.url;
                if (url && window.location.pathname !== url) {
                    window.location.href = url;
                }
            }
        };

        navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
        };
    }, []);

    // Auto-register when permission is granted and user is logged in
    useEffect(() => {
        if (permission === 'granted' && userId && !token) {
            registerFCM();
        }
    }, [permission, userId, token, registerFCM]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    return {
        permission,
        token,
        isSupported,
        loading,
        error,
        foregroundMessage,
        isGranted: permission === 'granted',
        isDenied: permission === 'denied',
        requestPermission,
        registerFCM,
        unregisterFCM,
        clearForegroundMessage: () => setForegroundMessage(null),
    };
};

export default useFCM;
