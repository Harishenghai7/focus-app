/**
 * Firebase Cloud Messaging Service Worker
 * Handles push notifications in the background
 */

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Firebase configuration - will be injected by the app
// This is a placeholder that gets replaced with actual config
const firebaseConfig = {
    apiKey: self.__FIREBASE_API_KEY__ || 'YOUR_API_KEY',
    authDomain: self.__FIREBASE_AUTH_DOMAIN__ || 'your-project.firebaseapp.com',
    projectId: self.__FIREBASE_PROJECT_ID__ || 'your-project',
    storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || 'your-project.appspot.com',
    messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '123456789',
    appId: self.__FIREBASE_APP_ID__ || '1:123456789:web:abcdef',
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

/**
 * Handle background push messages
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Notification';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || '/logo192.png',
        badge: '/badge-72x72.png',
        tag: payload.data?.type || 'default',
        requireInteraction: ['security_alert', 'login_new_device', 'suspicious_login'].includes(payload.data?.type),
        vibrate: payload.data?.type?.includes('security') ? [200, 100, 200, 100, 200] : [100, 50, 100],
        data: payload.data || {},
        actions: getNotificationActions(payload.data),
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

/**
 * Get notification actions based on type
 */
function getNotificationActions(data) {
    const type = data?.type;

    switch (type) {
        case 'message':
            return [
                { action: 'reply', title: 'Reply' },
                { action: 'view', title: 'View' },
            ];
        case 'follow':
            return [
                { action: 'follow_back', title: 'Follow Back' },
                { action: 'view_profile', title: 'View Profile' },
            ];
        case 'security_alert':
        case 'login_new_device':
        case 'suspicious_login':
            return [
                { action: 'review', title: 'Review' },
                { action: 'secure_account', title: 'Secure Account' },
            ];
        default:
            return [
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' },
            ];
    }
}

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click:', event);

    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    notification.close();

    // Handle different actions
    let url = '/';

    if (action === 'dismiss') {
        return;
    }

    if (action === 'reply' && data.conversation_id) {
        url = `/messages/${data.conversation_id}`;
    } else if (action === 'follow_back' && data.actor_id) {
        url = `/profile/${data.actor_username || data.actor_id}`;
    } else if (action === 'secure_account' || action === 'review') {
        url = '/settings/security';
    } else if (data.content_id) {
        // Deep link to content
        if (data.content_type === 'boltz') {
            url = `/boltz/${data.content_id}`;
        } else if (data.content_type === 'post') {
            url = `/p/${data.content_id}`;
        } else {
            url = `/notifications`;
        }
    } else if (data.type === 'follow' && data.actor_username) {
        url = `/profile/${data.actor_username}`;
    } else if (data.type === 'message') {
        url = data.conversation_id ? `/messages/${data.conversation_id}` : '/messages';
    } else if (['security_alert', 'login_new_device'].includes(data.type)) {
        url = '/settings/security';
    } else if (['badge_granted', 'verification_approved', 'trust_level_up'].includes(data.type)) {
        url = '/verification-center';
    } else {
        url = '/notifications';
    }

    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Try to focus existing window
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.focus();
                    // Post message to client to handle navigation
                    client.postMessage({
                        type: 'NOTIFICATION_CLICK',
                        url: url,
                        notificationData: data,
                    });
                    return;
                }
            }

            // If no existing window, open a new one
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        })
    );
});

/**
 * Handle notification close
 */
self.addEventListener('notificationclose', (event) => {
    console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

/**
 * Handle push events (fallback for non-FCM pushes)
 */
self.addEventListener('push', (event) => {
    console.log('[firebase-messaging-sw.js] Push received:', event);

    let data = {};
    try {
        data = event.data?.json() || {};
    } catch (e) {
        data = { notification: { title: 'New Notification', body: event.data?.text() || '' } };
    }

    const title = data.notification?.title || data.title || 'New Notification';
    const options = {
        body: data.notification?.body || data.body || '',
        icon: data.notification?.icon || '/logo192.png',
        badge: '/badge-72x72.png',
        tag: data.tag || 'push-notification',
        data: data.data || {},
        requireInteraction: false,
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Handle service worker install
 */
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker installing...');
    self.skipWaiting();
});

/**
 * Handle service worker activate
 */
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker activating...');
    event.waitUntil(self.clients.claim());
});

// Message handler for communication with the main app
self.addEventListener('message', (event) => {
    console.log('[firebase-messaging-sw.js] Message from main app:', event.data);

    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
