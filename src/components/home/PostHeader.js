import React from 'react';
import { Link } from 'react-router-dom';
import styles from './PostHeader.module.css';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { formatTimeAgo } from '../../utils/formatTimeAgo';

const PostHeader = ({ user, createdAt, location, onMenuClick }) => {
    return (
        <div className={styles.header}>
            <Link to={`/profile/${user.username}`} className={styles.userInfo}>
                <Avatar src={user.avatar_url} size="md" />
                <div className={styles.meta}>
                    <div className={styles.nameRow}>
                        <span className={styles.username}>{user.username}</span>
                        {user.verified && <Icon name="BadgeCheck" size={14} color="var(--primary-lavender)" />}
                        <span className={styles.dot}>•</span>
                        <span className={styles.time}>{formatTimeAgo(createdAt)}</span>
                    </div>
                    {location && <span className={styles.location}>{location}</span>}
                </div>
            </Link>

            <button className={styles.menuBtn} onClick={onMenuClick}>
                <Icon name="MoreHorizontal" size={20} color="var(--text-secondary)" />
            </button>
        </div>
    );
};

export default PostHeader;
