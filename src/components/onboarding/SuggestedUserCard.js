import React from 'react';
import styles from './SuggestedUserCard.module.css';
import Button from '../shared/Button';
import { FaCheckCircle } from 'react-icons/fa';

const SuggestedUserCard = ({ user, isFollowing, onFollow }) => {
    return (
        <div className={styles.card}>
            <div className={styles.userInfo}>
                <img
                    src={user.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMTUwIDE1MCI+PHJlY3Qgd2lkdGg9IjE1MCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiMzMzMiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjUwIiBmaWxsPSIjNjY2IiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VXNlcjwvdGV4dD48L3N2Zz4='}
                    alt={user.username}
                    className={styles.avatar}
                />
                <div className={styles.details}>
                    <div className={styles.nameRow}>
                        <h4 className={styles.name}>
                            @{user.username}
                        </h4>
                        {user.verified && <FaCheckCircle className={styles.verified} />}
                    </div>
                    {user.full_name && (
                        <p className={styles.fullName}>{user.full_name}</p>
                    )}
                    <p className={styles.stats}>
                        {user.followers_count || 0} followers
                    </p>
                    {user.bio && (
                        <p className={styles.bio}>{user.bio.substring(0, 60)}{user.bio.length > 60 ? '...' : ''}</p>
                    )}
                </div>
            </div>
            <button
                className={`${styles.followBtn} ${isFollowing ? styles.followingBtn : 'glass-button'}`}
                onClick={onFollow}
                disabled={isFollowing}
            >
                {isFollowing ? 'Following' : 'Follow'}
            </button>
        </div>
    );
};

export default SuggestedUserCard;
