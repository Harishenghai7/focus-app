import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Settings, Shield, Crown, Moon, Sun, Volume2, VolumeX } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import MainLayout from '../../components/layout/MainLayout';
import NotificationCard from '../../components/notifications/NotificationCard';
import NotificationsTabs from '../../components/notifications/NotificationsTabs';
import NotificationCommandBar from '../../components/notifications/NotificationCommandBar';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationActions } from '../../hooks/useNotificationActions';
import { useNotificationFilter } from '../../hooks/useNotificationFilter';
import { useNotificationPreferences } from '../../hooks/useNotificationPreferences';
import { useWebPush } from '../../hooks/useWebPush';
import { groupByTime, getSuppressedCount, shouldShowBanner, PRIORITY } from '../../services/notificationService';
import styles from './Notifications.module.css';

const Notifications = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [quickFilters, setQuickFilters] = useState([]);

    // Preferences (quiet/focus mode)
    const {
        prefs,
        effectiveQuietMode,
        toggleQuietMode,
        toggleFocusMode,
    } = useNotificationPreferences(user?.id);

    const filterState = useNotificationFilter([]);
    const { permission } = useWebPush(user?.id);

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
        processing,
    } = useNotificationActions(user?.id, setNotifications);

    const fullFilter = useNotificationFilter(notifications);

    // Quick filter toggle
    const handleQuickFilterToggle = useCallback((filterId) => {
        setQuickFilters(prev =>
            prev.includes(filterId)
                ? prev.filter(f => f !== filterId)
                : [...prev, filterId]
        );
    }, []);

    // Apply search + quick filters
    const filteredNotifications = useMemo(() => {
        let result = fullFilter.filteredNotifications;

        // Focus mode: only show critical
        if (prefs.focusMode) {
            result = result.filter(n => {
                return shouldShowBanner(n, { focusMode: true, quietMode: false });
            });
        }

        // Search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(n => {
                const text = [
                    n.actor?.full_name, n.actor?.username,
                    n.body, n.content, n.text, n.type
                ].filter(Boolean).join(' ').toLowerCase();
                return text.includes(q);
            });
        }

        // Quick filters
        if (quickFilters.includes('unread')) {
            result = result.filter(n => !n.is_read);
        }
        if (quickFilters.includes('mentions')) {
            result = result.filter(n => ['mention', 'tag', 'reply'].includes(n.type));
        }
        if (quickFilters.includes('verified')) {
            result = result.filter(n => n.actor?.trust_shield_verified || n.actor?.verified);
        }
        if (quickFilters.includes('media')) {
            result = result.filter(n => n.metadata?.preview_image);
        }

        return result;
    }, [fullFilter.filteredNotifications, searchQuery, quickFilters, prefs.focusMode]);

    // Time-based groups
    const groups = useMemo(() => groupByTime(filteredNotifications), [filteredNotifications]);

    const hasAny = filteredNotifications.length > 0;
    const hasUnread = fullFilter.unreadCounts?.all > 0;
    const suppressedCount = useMemo(
        () => getSuppressedCount(notifications, { focusMode: prefs.focusMode, quietMode: effectiveQuietMode }),
        [notifications, prefs.focusMode, effectiveQuietMode]
    );

    const renderGroup = (items, label, isPinned = false) => {
        if (!items.length) return null;
        return (
            <div className={styles.group} key={label}>
                <div className={`${styles.groupLabel} ${isPinned ? styles.pinnedLabel : ''}`}>
                    {isPinned && <Shield size={13} className={styles.pinnedIcon} />}
                    <span>{label}</span>
                    <span className={styles.groupCount}>{items.length}</span>
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
                            <div className={styles.titleIconWrap}>
                                <Bell size={20} className={styles.titleIcon} />
                            </div>
                            Notifications
                        </h1>
                        {hasUnread && (
                            <span className={styles.unreadBadge}>
                                {fullFilter.unreadCounts.all > 99 ? '99+' : fullFilter.unreadCounts.all}
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
                                <CheckCheck size={16} />
                                <span>All read</span>
                            </button>
                        )}
                        <button
                            className={styles.settingsBtn}
                            onClick={() => navigate('/settings', { state: { section: 'notifications' } })}
                            aria-label="Notification settings"
                        >
                            <Settings size={17} />
                        </button>
                    </div>
                </div>

                {/* ── Focus Mode Banner ──────────────────── */}
                {prefs.focusMode && (
                    <div className={styles.modeBanner + ' ' + styles.focusBanner}>
                        <div className={styles.modeBannerContent}>
                            <Moon size={16} className={styles.modeBannerIcon} />
                            <div>
                                <strong>Focus Mode Active</strong>
                                <p>Only safety alerts are shown. {suppressedCount > 0 && `${suppressedCount} notifications waiting.`}</p>
                            </div>
                        </div>
                        <button className={styles.modeBannerBtn} onClick={toggleFocusMode}>
                            <Sun size={14} /> Exit
                        </button>
                    </div>
                )}

                {/* ── Quiet Mode Banner ──────────────────── */}
                {!prefs.focusMode && effectiveQuietMode && (
                    <div className={styles.modeBanner + ' ' + styles.quietBanner}>
                        <div className={styles.modeBannerContent}>
                            <VolumeX size={16} className={styles.modeBannerIcon} />
                            <div>
                                <strong>Quiet Mode</strong>
                                <p>Low-priority notifications are batched.</p>
                            </div>
                        </div>
                        <button className={styles.modeBannerBtn} onClick={toggleQuietMode}>
                            <Volume2 size={14} /> Disable
                        </button>
                    </div>
                )}

                {/* ── Tabs ───────────────────────────────── */}
                <NotificationsTabs
                    tabs={fullFilter.tabs}
                    activeTab={fullFilter.activeTab}
                    onTabChange={(id) => {
                        fullFilter.setActiveTab(id);
                        filterState.setActiveTab(id);
                    }}
                />

                {/* ── Command Bar ────────────────────────── */}
                <NotificationCommandBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    quickFilters={quickFilters}
                    onQuickFilterToggle={handleQuickFilterToggle}
                    focusMode={prefs.focusMode}
                    onFocusModeToggle={toggleFocusMode}
                    quietMode={effectiveQuietMode}
                    onQuietModeToggle={toggleQuietMode}
                />

                {/* ── Content ────────────────────────────── */}
                <div className={styles.content}>
                    {notificationsError && (
                        <div className={styles.errorBanner} role="alert">
                            <p>Could not load notifications.</p>
                            <button className={styles.retryBtn} onClick={() => refreshNotifications?.()}>Try again</button>
                        </div>
                    )}

                    {loading ? (
                        <div className={styles.skeletonList}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={styles.skeletonRow} style={{ animationDelay: `${i * 0.08}s` }}>
                                    <div className={styles.skeletonAvatar} />
                                    <div className={styles.skeletonText}>
                                        <div className={styles.skeletonLine} style={{ width: '65%' }} />
                                        <div className={styles.skeletonLine} style={{ width: '40%' }} />
                                    </div>
                                    <div className={styles.skeletonThumb} />
                                </div>
                            ))}
                        </div>
                    ) : !hasAny ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIconWrap}>
                                <Bell size={40} strokeWidth={1.2} className={styles.emptyIcon} />
                                <div className={styles.emptyGlow} />
                                <div className={styles.emptyRing} />
                            </div>
                            <h3 className={styles.emptyTitle}>
                                {prefs.focusMode ? 'Focus Mode — All Clear' : 'No Notifications Yet'}
                            </h3>
                            <p className={styles.emptyText}>
                                {prefs.focusMode
                                    ? 'No safety alerts. Your account is secure.'
                                    : searchQuery
                                        ? 'No notifications match your search.'
                                        : 'You\'re all caught up. We\'ll notify you when something meaningful happens.'}
                            </p>
                            {prefs.focusMode && suppressedCount > 0 && (
                                <button className={styles.viewSuppressed} onClick={toggleFocusMode}>
                                    View {suppressedCount} suppressed notification{suppressedCount !== 1 ? 's' : ''}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {renderGroup(groups.pinned, 'Priority Alerts', true)}
                            {renderGroup(groups.fresh, 'New')}
                            {renderGroup(groups.today, 'Today')}
                            {renderGroup(groups.thisWeek, 'This Week')}
                            {renderGroup(groups.earlier, 'Earlier')}

                            {hasMore && (
                                <button className={styles.loadMoreBtn} onClick={loadMore}>
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
