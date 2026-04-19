import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import MainLayout from '../../components/layout/MainLayout';
import NotificationCard from '../../components/notifications/NotificationCard';
import NotificationsTabs from '../../components/notifications/NotificationsTabs';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationActions } from '../../hooks/useNotificationActions';
// NOTE: useNotificationsRealtime is intentionally removed here.
// useNotifications already contains an internal Supabase Realtime subscription
// via useRealtimeSubscription. Having both active caused duplicate events.
import { useNotificationFilter } from '../../hooks/useNotificationFilter';
import styles from './Notifications.module.css';

// Group notifications by time
const groupNotifications = (notifications) => {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const today = [];
    const thisWeek = [];
    const earlier = [];

    notifications.forEach(n => {
        const d = new Date(n.created_at);
        if (d >= todayStart) today.push(n);
        else if (d >= weekStart) thisWeek.push(n);
        else earlier.push(n);
    });

    return { today, thisWeek, earlier };
};

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const filterState = useNotificationFilter([]);

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

    // Realtime updates handled internally by useNotifications → useRealtimeSubscription.



    const groups = useMemo(() =>
        groupNotifications(fullFilter.filteredNotifications),
        [fullFilter.filteredNotifications]
    );

    const hasAnyNotifications = fullFilter.filteredNotifications.length > 0;
    const hasUnread = fullFilter.unreadCounts?.all > 0;

    const renderGroup = (items, label) => {
        if (!items.length) return null;
        return (
            <div className={styles.group}>
                <div className={styles.groupLabel}>{label}</div>
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
                        <h1 className={styles.title}>Notifications</h1>
                        {hasUnread && (
                            <span className={styles.unreadBadge}>
                                {fullFilter.unreadCounts.all}
                            </span>
                        )}
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
                            <div className={styles.emptyIcon}>
                                <Bell size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className={styles.emptyTitle}>All caught up!</h3>
                            <p className={styles.emptyText}>
                                We'll notify you when something new happens.
                            </p>
                        </div>
                    ) : (
                        <>
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
