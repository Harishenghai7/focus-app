import React from 'react';
import Avatar from '../shared/Avatar';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import styles from './ThreadItem.module.css';

const ThreadItem = ({ thread, isActive, onClick }) => {
    const { user, lastMessage, unreadCount } = thread;

    const getMessagePreview = () => {
        if (!lastMessage) return '';

        if (lastMessage.message_type === 'image') return '📷 Photo';
        if (lastMessage.message_type === 'video') return '🎥 Video';
        if (lastMessage.message_type === 'audio') return '🎵 Audio';
        if (lastMessage.message_type === 'file') return '📎 File';

        return lastMessage.content || '';
    };

    return (
        <div
            className={`${styles.threadItem} ${isActive ? styles.active : ''}`}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <div className={styles.avatarWrapper}>
                <Avatar
                    src={user?.avatar_url}
                    alt={user?.full_name || user?.username}
                    size="lg"
                    hasStories={user?.is_online}
                />
                {user?.is_online && <div className={styles.onlineIndicator} />}
            </div>

            <div className={styles.threadContent}>
                <div className={styles.threadHeader}>
                    <div className={styles.userInfo}>
                        <span className={styles.username}>
                            {user?.full_name || user?.username}
                        </span>
                        {user?.is_verified && (
                            <svg className={styles.verifiedBadge} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 0L9.79611 2.33689L12.7023 2.47023L12.1803 5.34164L14 7.5L12.1803 9.65836L12.7023 12.5298L9.79611 12.6631L8 15L6.20389 12.6631L3.29772 12.5298L3.81967 9.65836L2 7.5L3.81967 5.34164L3.29772 2.47023L6.20389 2.33689L8 0Z" fill="var(--primary-lavender)" />
                                <path d="M6 8L7.5 9.5L10.5 6.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                    <span className={styles.timestamp}>
                        {formatTimeAgo(lastMessage?.created_at)}
                    </span>
                </div>

                <div className={styles.messagePreview}>
                    <p className={styles.previewText}>
                        {getMessagePreview()}
                    </p>
                    {unreadCount > 0 && (
                        <span className={styles.unreadBadge}>
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ThreadItem;
