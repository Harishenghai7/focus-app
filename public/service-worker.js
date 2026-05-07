/**
 * FREE & OPEN SOURCE Service Worker for Web Push Notifications
 * Uses native Web Push API - NO Firebase, NO FCM, 100% Free
 * 
 * This service worker handles:
 * - Push notification delivery
 * - Background sync
 * - Deep link navigation
 * - Notification click handling
 */

const CACHE_NAME = 'focus-app-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/logo192.png',
    '/logo512.png',
    '/badge-72x72.png',
];

// ============================================================================
// INSTALL & ACTIVATE
// ============================================================================

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    self.skipWaiting();

    // Cache static assets
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(self.clients.claim());

    // Clean up old caches
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

// ============================================================================
// PUSH NOTIFICATION HANDLING (FREE Web Push API)
// ============================================================================

self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    let payload = {};
    try {
        payload = event.data?.json() || {};
    } catch (e) {
        payload = { title: 'New Notification', body: event.data?.text() || '' };
    }

    const { notification, data } = payload;

    const title = notification?.title || 'New Notification';
    const options = {
        body: notification?.body || '',
        icon: notification?.icon || '/logo192.png',
        badge: '/badge-72x72.png',
        tag: data?.type || 'notification',
        requireInteraction: isSecurityType(data?.type),
        vibrate: getVibrationPattern(data?.type),
        data: data || {},
        actions: getNotificationActions(data?.type, data),
        timestamp: Date.now(),
        renotify: true,
        silent: false,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );

    // Notify all clients about the push (for foreground handling)
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: 'PUSH_NOTIFICATION',
                    payload: { title, options: { ...options, data } }
                });
            });
        })
    );
});

// ============================================================================
// NOTIFICATION CLICK HANDLING (DEEP LINKING)
// ============================================================================

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event);

    const notification = event.notification;
    const action = event.action;
    const data = notification.data || {};

    notification.close();

    // Handle actions
    if (action === 'dismiss') {
        return;
    }

    // Calculate deep link URL
    const url = getDeepLinkUrl(data, action);

    // Open or focus the app
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Try to focus existing window
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    client.focus();
                    // Navigate to the deep link
                    client.navigate(url);
                    return;
                }
            }

            // If no existing window, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});

// ============================================================================
// NOTIFICATION CLOSE HANDLING
// ============================================================================

self.addEventListener('notificationclose', (event) => {
    console.log('[SW] Notification closed:', event);
});

// ============================================================================
// FETCH HANDLING (CACHE STRATEGY)
// ============================================================================

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) {
                return cached;
            }

            return fetch(event.request).then((response) => {
                // Don't cache non-success responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Cache the response
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            });
        })
    );
});

// ============================================================================
// MESSAGE HANDLING (COMMUNICATION WITH MAIN APP)
// ============================================================================

self.addEventListener('message', (event) => {
    console.log('[SW] Message from main app:', event.data);

    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data?.type === 'GET_SUBSCRIPTION') {
        self.registration.pushManager.getSubscription().then((subscription) => {
            event.source.postMessage({
                type: 'SUBSCRIPTION',
                subscription: subscription ? subscription.toJSON() : null
            });
        });
    }
});

// ============================================================================
// SYNC HANDLING (BACKGROUND SYNC)
// ============================================================================

self.addEventListener('sync', (event) => {
    console.log('[SW] Sync event:', event);

    if (event.tag === 'sync-notifications') {
        event.waitUntil(syncNotifications());
    }
});

async function syncNotifications() {
    // Handle background notification sync
    console.log('[SW] Syncing notifications...');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isSecurityType(type) {
    return ['security_alert', 'login_new_device', 'suspicious_login', 'account_locked'].includes(type);
}

function getVibrationPattern(type) {
    if (isSecurityType(type)) {
        return [200, 100, 200, 100, 200]; // Alert pattern
    }
    if (type === 'message') {
        return [100, 50, 100]; // Message pattern
    }
    return [100]; // Default pattern
}

function getNotificationActions(type, data) {
    switch (type) {
        case 'message':
            return [
                { action: 'reply', title: 'Reply' },
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' }
            ];

        case 'follow':
            return [
                { action: 'follow_back', title: 'Follow Back' },
                { action: 'view_profile', title: 'View Profile' },
                { action: 'dismiss', title: 'Dismiss' }
            ];

        case 'security_alert':
        case 'login_new_device':
        case 'suspicious_login':
            return [
                { action: 'review', title: 'Review' },
                { action: 'secure_account', title: 'Secure Account' },
                { action: 'dismiss', title: 'Dismiss' }
            ];

        case 'like':
        case 'comment':
        case 'boltz_like':
        case 'boltz_comment':
        case 'mention':
            return [
                { action: 'view', title: 'View' },
                { action: 'reply', title: 'Reply' },
                { action: 'dismiss', title: 'Dismiss' }
            ];

        default:
            return [
                { action: 'view', title: 'View' },
                { action: 'dismiss', title: 'Dismiss' }
            ];
    }
}

function getDeepLinkUrl(data, action) {
    const baseUrl = self.location.origin;
    const { type, content_id, content_type, actor_username, conversation_id } = data || {};

    // Handle action-specific URLs
    if (action === 'reply' && conversation_id) {
        return `${baseUrl}/messages/${conversation_id}`;
    }

    if (action === 'follow_back' || action === 'view_profile') {
        return actor_username ? `${baseUrl}/profile/${actor_username}` : `${baseUrl}/notifications`;
    }

    if (action === 'secure_account' || action === 'review') {
        return `${baseUrl}/settings/security`;
    }

    // Default navigation based on notification type
    if (['like', 'comment', 'mention', 'tag', 'share', 'reply', 'boltz_like', 'boltz_comment'].includes(type) && content_id) {
        if (content_type === 'boltz') {
            return `${baseUrl}/boltz/${content_id}`;
        }
        return `${baseUrl}/p/${content_id}`;
    }

    if (type === 'follow' && actor_username) {
        return `${baseUrl}/profile/${actor_username}`;
    }

    if (type === 'message') {
        return conversation_id ? `${baseUrl}/messages/${conversation_id}` : `${baseUrl}/messages`;
    }

    if (['security_alert', 'login_new_device', 'suspicious_login', 'password_change', 'account_locked'].includes(type)) {
        return `${baseUrl}/settings/security`;
    }

    if (['badge_granted', 'verification_approved', 'trust_level_up', 'focusid_upgrade'].includes(type)) {
        return `${baseUrl}/verification-center`;
    }

    return `${baseUrl}/notifications`;
}

// ============================================================================
// PERIODIC SYNC (FOR BACKGROUND CHECKS - Optional)
// ============================================================================

self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-notifications') {
        event.waitUntil(checkNewNotifications());
    }
});

async function checkNewNotifications() {
    // Optional: Check for new notifications in background
    console.log('[SW] Periodic sync: checking notifications...');
}

console.log('[SW] Service Worker loaded successfully - FREE & OPEN SOURCE');
