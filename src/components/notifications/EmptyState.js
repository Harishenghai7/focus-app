import React from 'react';
import styles from './EmptyState.module.css';
import Icon from '../ui/Icon';

const EmptyState = ({ type = 'all' }) => {
    const getEmptyStateContent = () => {
        switch (type) {
            case 'unread':
                return {
                    icon: 'CheckCircle',
                    title: "You're all caught up!",
                    message: 'No unread notifications'
                };
            case 'mention':
                return {
                    icon: 'AtSign',
                    title: 'No mentions yet',
                    message: "You haven't been mentioned in any posts"
                };
            case 'comment':
                return {
                    icon: 'MessageCircle',
                    title: 'No comments',
                    message: 'No one has commented on your posts yet'
                };
            case 'like':
                return {
                    icon: 'Heart',
                    title: 'No likes yet',
                    message: 'Your posts are waiting for some love'
                };
            case 'follow':
                return {
                    icon: 'UserPlus',
                    title: 'No new followers',
                    message: 'No one has followed you recently'
                };
            case 'boltz':
                return {
                    icon: 'Zap',
                    title: 'No Boltz notifications',
                    message: 'No new Boltz from people you follow'
                };
            case 'message_request':
                return {
                    icon: 'Mail',
                    title: 'No message requests',
                    message: 'You have no pending message requests'
                };
            case 'system':
                return {
                    icon: 'Bell',
                    title: 'No system notifications',
                    message: 'No updates from Focus'
                };
            default:
                return {
                    icon: 'Bell',
                    title: 'No notifications yet',
                    message: "When you get notifications, they'll show up here"
                };
        }
    };

    const { icon, title, message } = getEmptyStateContent();

    return (
        <div className={styles.container}>
            <div className={styles.iconWrapper}>
                <Icon name={icon} size={48} className={styles.icon} />
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.message}>{message}</p>
        </div>
    );
};

export default EmptyState;
