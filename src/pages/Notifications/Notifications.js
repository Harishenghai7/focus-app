import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Settings, Shield, AlertTriangle, Crown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import MainLayout from '../../components/layout/MainLayout';
import NotificationCard from '../../components/notifications/NotificationCard';
import NotificationsTabs from '../../components/notifications/NotificationsTabs';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationActions } from '../../hooks/useNotificationActions';
import { useNotificationFilter } from '../../hooks/useNotificationFilter';
import { useWebPush } from '../../hooks/useWebPush';
import styles from './Notifications.module.css';

// Group notifications with Sovereign Priority Logic
// Security alerts pinned at top for 24 hours, then by time
const groupNotifications = (notifications) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // Sovereign Priority: Security alerts (pinned for 24h)
    const pinned = [];
    const today = [];
    const thisWeek = [];
    const earlier = [];

    notifications.forEach(n => {
        const d = new Date(n.created_at);
        const isSecurity = ['security_alert', 'login_new_device', 'suspicious_login', 'account_locked'].includes(n.type);
        const isVerification = ['badge_granted', 'verification_approved', 'trust_level_up', 'focusid_upgrade'].includes(n.type);

        // Pin critical security alerts for 24 hours
        const hoursSinceCreated = (now - d) / (1000 * 60 * 60);
        if (isSecurity && hoursSinceCreated < 24) {
            pinned.push({ ...n, isPinned: true });
        } else if (isVerification && hoursSinceCreated < 24) {
            pinned.push({ ...n, isPinned: true });
        } else if (d >= todayStart) {
            today.push(n);
        } else if (d >= weekStart) {
            thisWeek.push(n);
        } else {
            earlier.push(n);
        }
    });

    return { pinned, today, thisWeek, earlier };
};

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const filterState = useNotificationFilter([]);

    // Initialize FREE Web Push (NO Firebase!)
    const { permission, requestPermission, isGranted, subscribe } = useWebPush(user?.id);

    const {
        notifications,
        loading,
        error: notificationsError,
        hasMore,
        loadMore,
        setNotifications,
        refresh: refreshNotifications,
    } = useNotifications(user?.id, filterState.activeTab);

    const {
        markAsRead,
        markAllAsRead,
        deleteNotification,
        processing
    } = useNotificationActions(user?.id, setNotifications);

    const fullFilter = useNotificationFilter(notifications);

    // Check for push notification permission on first load
    useEffect(() => {
        if (isGranted === false && permission !== 'denied') {
            // Auto-request permission for better UX
            // Uncomment if you want to auto-prompt:
            // requestPermission().then(() => subscribe());
        }
    }, [isGranted, permission, requestPermission, subscribe]);

    // Realtime updates handled internally by useNotifications → useRealtimeSubscription.



    const groups = useMemo(() =>
        groupNotifications(fullFilter.filteredNotifications),
        [fullFilter.filteredNotifications]
    );

    const hasAnyNotifications = fullFilter.filteredNotifications.length > 0;
    const hasUnread = fullFilter.unreadCounts?.all > 0;
    const hasSecurity = fullFilter.unreadCounts?.security > 0;
    const hasCritical = notifications.some(n =>
        !n.is_read && ['security_alert', 'login_new_device', 'suspicious_login', 'account_locked'].includes(n.type)
    );

    const renderGroup = (items, label, isPinned = false) => {
        if (!items.length) return null;
        return (
            <div className={styles.group}>
                <div className={`${styles.groupLabel} ${isPinned ? styles.pinnedLabel : ''}`}>
                    {isPinned && <Shield size={14} className={styles.pinnedIcon} />}
                    {label}
                    {isPinned && <span className={styles.pinnedBadge}>Priority</span>}
                </div>
                {items.map(n => (
                    <NotificationCard
                        key={n.id}
                        notification={n}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                    />
                ))}
            </div>
        );
    };

    return (
        <MainLayout>
            <div className={styles.page}>
                {/* ── Header ─────────────────────────────── */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <h1 className={styles.title}>
                            <Crown size={24} className={styles.titleIcon} />
                            Notifications
                        </h1>
                        {hasCritical ? (
                            <span className={`${styles.unreadBadge} ${styles.criticalBadge}`}>
                                <AlertTriangle size={12} />
                                {fullFilter.unreadCounts.all}
                            </span>
                        ) : hasUnread ? (
                            <span className={styles.unreadBadge}>
                                {fullFilter.unreadCounts.all}
                            </span>
                        ) : null}
                    </div>
                    <div className={styles.headerActions}>
                        {hasUnread && (
                            <button
                                className={styles.markAllBtn}
                                onClick={markAllAsRead}
                                disabled={processing}
                                aria-label="Mark all as read"
                            >
                                <CheckCheck size={18} />
                                <span>Mark all read</span>
                            </button>
                        )}
                        <button
                            className={styles.settingsBtn}
                            onClick={() => navigate('/settings', { state: { section: 'notifications' } })}
                            aria-label="Notification settings"
                        >
                            <Settings size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Tabs ───────────────────────────────── */}
                <NotificationsTabs
                    tabs={fullFilter.tabs}
                    activeTab={fullFilter.activeTab}
                    onTabChange={(id) => {
                        fullFilter.setActiveTab(id);
                        filterState.setActiveTab(id);
                    }}
                />

                {/* ── Content ────────────────────────────── */}
                <div className={styles.content}>
                    {notificationsError && (
                        <div className={styles.errorBanner} role="alert">
                            <p>Could not load notifications.</p>
                            <button
                                type="button"
                                className={styles.retryBtn}
                                onClick={() => refreshNotifications?.()}
                            >
                                Try again
                            </button>
                        </div>
                    )}
                    {loading ? (
                        <div className={styles.skeletonList}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={styles.skeletonRow}>
                                    <div className={styles.skeletonAvatar} />
                                    <div className={styles.skeletonText}>
                                        <div className={styles.skeletonLine} style={{ width: '60%' }} />
                                        <div className={styles.skeletonLine} style={{ width: '40%' }} />
                                    </div>
                                    <div className={styles.skeletonThumb} />
                                </div>
                            ))}
                        </div>
                    ) : !hasAnyNotifications ? (
                        <div className={styles.empty}>
                            <div className={`${styles.emptyIcon} ${styles.sovereignEmpty}`}>
                                <Bell size={48} strokeWidth={1.5} />
                                <div className={styles.emptyGlow} />
                            </div>
                            <h3 className={styles.emptyTitle}>Sovereign Inbox Empty</h3>
                            <p className={styles.emptyText}>
                                All systems secure. You'll be notified when something requires your attention.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Pinned security/verification alerts */}
                            {renderGroup(groups.pinned, '🔒 Priority Alerts', true)}

                            {/* Time-grouped notifications */}
                            {renderGroup(groups.today, 'Today')}
                            {renderGroup(groups.thisWeek, 'This Week')}
                            {renderGroup(groups.earlier, 'Earlier')}

                            {hasMore && (
                                <button
                                    className={styles.loadMoreBtn}
                                    onClick={loadMore}
                                >
                                    Load more
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Notifications;
