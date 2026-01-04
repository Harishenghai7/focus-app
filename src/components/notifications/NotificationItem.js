import React from 'react';
import styles from './NotificationItem.module.css';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';

const NotificationItem = ({ notification }) => {
    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Icon name="Heart" size={16} fill="white" className={styles.iconLike} />;
            case 'comment': return <Icon name="MessageCircle" size={16} fill="white" className={styles.iconComment} />;
            case 'follow': return <Icon name="UserPlus" size={16} fill="white" className={styles.iconFollow} />;
            default: return null;
        }
    };

    return (
        <div className={`${styles.item} ${!notification.read ? styles.unread : ''}`}>
            <div className={styles.avatarWrapper}>
                <Avatar src={notification.user.avatar_url} size="md" />
                <div className={`${styles.iconBadge} ${styles[notification.type]}`}>
                    {getIcon(notification.type)}
                </div>
            </div>

            <div className={styles.content}>
                <p className={styles.text}>
                    <span className={styles.username}>{notification.user.username}</span>
                    {' '}
                    {notification.type === 'like' && 'liked your post.'}
                    {notification.type === 'comment' && 'commented: "Nice shot!"'}
                    {notification.type === 'follow' && 'started following you.'}
                </p>
                <span className={styles.time}>{notification.time_ago}</span>
            </div>

            {notification.post_image && (
                <img src={notification.post_image} alt="Post" className={styles.postImage} />
            )}
        </div>
    );
};

export default NotificationItem;
