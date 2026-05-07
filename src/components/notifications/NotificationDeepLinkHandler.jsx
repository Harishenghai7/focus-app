/**
 * NotificationDeepLinkHandler
 * Handles deep linking from push notifications and in-app notification clicks
 * Routes users to the appropriate content based on notification type
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFCM } from '../../hooks/useFCM';

export const NotificationDeepLinkHandler = ({ userId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { foregroundMessage, clearForegroundMessage } = useFCM(userId);

    // Handle foreground FCM messages
    useEffect(() => {
        if (!foregroundMessage) return;

        const { data, notification } = foregroundMessage;
        const type = data?.type;

        // Show toast or in-app notification
        showInAppNotification(notification?.title, notification?.body, type);

        // Navigate based on type (optional - can be triggered by user click instead)
        // handleDeepLink(type, data, navigate);

        clearForegroundMessage();
    }, [foregroundMessage, clearForegroundMessage]);

    // Handle URL params for deep links (e.g., /notifications?type=post&id=123)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const type = params.get('type');
        const contentId = params.get('id');
        const source = params.get('source');

        if (source === 'notification' && type && contentId) {
            handleDeepLink(type, { content_id: contentId }, navigate);

            // Clean up URL params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [location, navigate]);

    // Handle service worker messages for notification clicks
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type === 'NOTIFICATION_CLICK') {
                const { url, notificationData } = event.data;

                if (url && window.location.pathname !== url) {
                    navigate(url);
                }
            }
        };

        navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

        return () => {
            navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
        };
    }, [navigate]);

    return null; // This is a logic-only component
};

/**
 * Show in-app notification toast
 */
const showInAppNotification = (title, body, type) => {
    // Dispatch custom event for InAppNotificationBanner to pick up
    window.dispatchEvent(new CustomEvent('notification-toast', {
        detail: { title, body, type }
    }));
};

/**
 * Handle deep linking logic
 */
export const handleDeepLink = (type, data, navigate) => {
    const { content_id, content_type, actor_username, conversation_id } = data || {};

    switch (type) {
        case 'like':
        case 'comment':
        case 'mention':
        case 'tag':
        case 'share':
        case 'reply':
            if (content_id) {
                const path = content_type === 'boltz' ? `/boltz/${content_id}` : `/p/${content_id}`;
                const state = type === 'comment' || type === 'reply' ? { openComments: true } : undefined;
                navigate(path, { state });
            }
            break;

        case 'boltz_like':
        case 'boltz_comment':
            if (content_id) {
                navigate(`/boltz/${content_id}`, { state: type === 'boltz_comment' ? { openComments: true } : undefined });
            }
            break;

        case 'follow':
            if (actor_username) {
                navigate(`/profile/${actor_username}`);
            }
            break;

        case 'message':
            navigate(conversation_id ? `/messages/${conversation_id}` : '/messages');
            break;

        case 'security_alert':
        case 'login_new_device':
        case 'suspicious_login':
        case 'password_change':
        case 'account_locked':
            navigate('/settings', { state: { section: 'security' } });
            break;

        case 'badge_granted':
        case 'trust_level_up':
        case 'trust_level_down':
        case 'verification_approved':
        case 'verification_rejected':
        case 'focusid_upgrade':
            navigate('/verification-center');
            break;

        default:
            navigate('/notifications');
            break;
    }
};

export default NotificationDeepLinkHandler;
