import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import styles from './Notifications.module.css';
import MainLayout from '../../components/layout/MainLayout';
import NotificationsTabs from '../../components/notifications/NotificationsTabs';
import NotificationList from '../../components/notifications/NotificationList';
import MarkAllReadButton from '../../components/notifications/MarkAllReadButton';
import NotificationSettingsShortcut from '../../components/notifications/NotificationSettingsShortcut';
import { useNotifications } from '../../hooks/useNotifications';
import { useNotificationActions } from '../../hooks/useNotificationActions';
import { useNotificationsRealtime } from '../../hooks/useNotificationsRealtime';
import { useNotificationFilter } from '../../hooks/useNotificationFilter';

const Notifications = () => {
    const { user } = useAuth();
    const { activeTab, setActiveTab, unreadCounts } = useNotificationFilter([]);

    const {
        notifications,
        loading,
        hasMore,
        loadMore,
        setNotifications
    } = useNotifications(user?.id, activeTab);

    const {
        markAsRead,
        markAllAsRead,
        deleteNotification,
        processing
    } = useNotificationActions(user?.id, setNotifications);

    // Update filter with current notifications
    const filterState = useNotificationFilter(notifications);

    // Real-time subscription
    useNotificationsRealtime(user?.id, setNotifications, (newNotification) => {
        // Optional: Play sound or show toast for new notification
        console.log('New notification received:', newNotification);
    });

    const hasUnreadNotifications = unreadCounts.all > 0;

    return (
        <MainLayout>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Notifications</h1>
                    <div className={styles.headerActions}>
                        {hasUnreadNotifications && (
                            <MarkAllReadButton
                                onClick={markAllAsRead}
                                disabled={processing}
                                loading={processing}
                            />
                        )}
                        <NotificationSettingsShortcut />
                    </div>
                </div>

                <NotificationsTabs
                    tabs={filterState.tabs}
                    activeTab={filterState.activeTab}
                    onTabChange={(tabId) => {
                        filterState.setActiveTab(tabId);
                        setActiveTab(tabId);
                    }}
                />

                <NotificationList
                    notifications={filterState.filteredNotifications}
                    loading={loading}
                    hasMore={hasMore}
                    onLoadMore={loadMore}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    activeTab={filterState.activeTab}
                />
            </div>
        </MainLayout>
    );
};

export default Notifications;
