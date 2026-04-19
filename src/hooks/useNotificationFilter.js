/**
 * useNotificationFilter — Focus App v2.0
 *
 * 4-category semantic notification tabs:
 * All | Interactions | Security | Verification
 */
import { useState, useMemo } from 'react';

/* ─── Category Map ─────────────────────────────────────────── */
const CATEGORY_MAP = {
    // Interactions — social actions from other users
    interactions: [
        'like', 'comment', 'follow', 'mention', 'tag',
        'share', 'reply', 'react', 'boltz_like', 'boltz_comment',
        'message_request', 'story_view', 'highlight_view',
    ],
    // Security — account safety events
    security: [
        'login_new_device', 'session_revoked', 'suspicious_login',
        'password_change', 'oauth_linked', 'oauth_unlinked',
        'account_locked', 'two_factor_enabled', 'two_factor_disabled',
        'suspicious_activity', 'biometric_changed', 'security_alert',
    ],
    // Verification — identity & trust events
    verification: [
        'badge_granted', 'badge_revoked', 'trust_level_up', 'trust_level_down',
        'vouched', 'vouched_received', 'guardian_action', 'teen_alert',
        'government_id_update', 'focusid_upgrade', 'phone_verified',
        'community_vouched', 'digilocker_update', 'verification_approved',
        'verification_rejected', 'parent_consent_granted',
    ],
};

const getCategoryForType = (type = '') => {
    for (const [category, types] of Object.entries(CATEGORY_MAP)) {
        if (types.includes(type)) return category;
    }
    return 'interactions'; // Default unmapped types to interactions
};

/* ─── Hook ──────────────────────────────────────────────────── */
export const useNotificationFilter = (notifications = []) => {
    const [activeTab, setActiveTab] = useState('all');

    /* Unread counts per category */
    const unreadCounts = useMemo(() => {
        const counts = {
            all: 0,
            interactions: 0,
            security: 0,
            verification: 0,
        };

        notifications.forEach(n => {
            if (!n.is_read) {
                counts.all++;
                const category = getCategoryForType(n.type);
                if (category in counts) counts[category]++;
            }
        });

        return counts;
    }, [notifications]);

    /* Filtered notifications for current tab */
    const filteredNotifications = useMemo(() => {
        if (activeTab === 'all') return notifications;
        return notifications.filter(n => getCategoryForType(n.type) === activeTab);
    }, [notifications, activeTab]);

    /* Tab config */
    const tabs = useMemo(() => [
        { id: 'all',           label: 'All',           icon: '🔔', count: unreadCounts.all },
        { id: 'interactions',  label: 'Interactions',  icon: '❤️', count: unreadCounts.interactions },
        { id: 'security',      label: 'Security',      icon: '🔒', count: unreadCounts.security },
        { id: 'verification',  label: 'Verification',  icon: '✅', count: unreadCounts.verification },
    ], [unreadCounts]);

    return {
        activeTab,
        setActiveTab,
        filteredNotifications,
        unreadCounts,
        tabs,
        getCategoryForType, // expose for NotificationCard icon coloring
    };
};
