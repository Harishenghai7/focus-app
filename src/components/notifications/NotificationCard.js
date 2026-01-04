import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './NotificationCard.module.css';
import Avatar from '../shared/Avatar';
import Icon from '../ui/Icon';
import NotificationMedia from './NotificationMedia';
import NotificationActions from './NotificationActions';
import { formatNotificationText, getNotificationIcon, getNotificationColor } from '../../utils/formatNotificationText';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

const NotificationCard = ({ notification, onMarkAsRead, onDelete }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        // Mark as read when clicked
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }

        // Deep link to content
        handleDeepLink();
    };

    const handleDeepLink = () => {
        const { type, content_id, content_type, actor } = notification;

        switch (type) {
            case 'like':
            case 'comment':
                // Open post or boltz detail modal
                if (content_type === 'boltz') {
                    navigate(`/boltz/${content_id}`);
                } else {
                    navigate(`/post/${content_id}`);
                }
                break;

            case 'mention':
                // Navigate to content with mention
                if (content_type === 'boltz') {
                    navigate(`/boltz/${content_id}`);
                } else if (content_type === 'post') {
                    navigate(`/post/${content_id}`);
                }
                break;

            case 'follow':
                // Navigate to actor's profile
                if (actor?.username) {
                    navigate(`/profile/${actor.username}`);
                }
                break;

            case 'boltz':
                // Navigate to boltz
                if (content_id) {
                    navigate(`/boltz/${content_id}`);
                }
                break;

            case 'message_request':
                // Navigate to messages
                navigate('/messages');
                break;

            default:
                break;
        }
    };

    const iconName = getNotificationIcon(notification.type);
    const iconColor = getNotificationColor(notification.type);

    return (
        <div
            className={`${styles.card} ${!notification.is_read ? styles.unread : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-label={`Notification from ${notification.actor?.username || 'someone'}`}
        >
            {!notification.is_read && <div className={styles.unreadDot} aria-label="Unread" />}

            <div className={styles.avatarWrapper}>
                <Avatar
                    src={notification.actor?.avatar_url}
                    alt={notification.actor?.username}
                    size="md"
                />
                <div
                    className={styles.iconBadge}
                    style={{ backgroundColor: iconColor }}
                >
                    <Icon name={iconName} size={14} fill="white" />
                </div>
            </div>

            <div className={styles.content}>
                <div className={styles.text}>
                    {formatNotificationText(notification)}
                </div>
                <div className={styles.time}>
                    {formatTimeAgo(notification.created_at)}
                </div>
            </div>

            {notification.metadata?.preview_image && (
                <NotificationMedia
                    src={notification.metadata.preview_image}
                    alt="Preview"
                    contentType={notification.content_type}
                />
            )}

            {(notification.type === 'follow' || notification.type === 'message_request') && (
                <NotificationActions
                    notification={notification}
                    onActionComplete={() => onMarkAsRead(notification.id)}
                />
            )}

            <button
                className={styles.deleteButton}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                }}
                aria-label="Delete notification"
            >
                <Icon name="X" size={16} />
            </button>
        </div>
    );
};

export default NotificationCard;
