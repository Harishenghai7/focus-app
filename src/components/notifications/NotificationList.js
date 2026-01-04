import React from 'react';
import styles from './NotificationList.module.css';
import NotificationCard from './NotificationCard';
import EmptyState from './EmptyState';
import NotificationsSkeleton from './NotificationsSkeleton';

const NotificationList = ({
    notifications,
    loading,
    hasMore,
    onLoadMore,
    onMarkAsRead,
    onDelete,
    activeTab
}) => {
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;

        // Load more when scrolled to bottom
        if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
            onLoadMore();
        }
    };

    if (loading && notifications.length === 0) {
        return <NotificationsSkeleton count={8} />;
    }

    if (notifications.length === 0) {
        return <EmptyState type={activeTab} />;
    }

    return (
        <div className={styles.container} onScroll={handleScroll}>
            <div className={styles.list}>
                {notifications.map(notification => (
                    <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            {loading && (
                <div className={styles.loadingMore}>
                    <NotificationsSkeleton count={3} />
                </div>
            )}
        </div>
    );
};

export default NotificationList;
