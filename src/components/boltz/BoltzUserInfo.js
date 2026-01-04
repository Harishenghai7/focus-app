import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BoltzUserInfo.module.css';
import VerifiedBadge from '../shared/VerifiedBadge';
import BoltzCaption from './BoltzCaption';
import { getUserAvatarUrl } from '../../utils/avatarManager';

const BoltzUserInfo = ({ user, caption, onFollow, isOwnContent }) => {
    const navigate = useNavigate();

    if (!user) {
        return null;
    }

    // Get avatar URL with proper fallback
    const avatarUrl = getUserAvatarUrl(null, { username: user.username, avatar_url: user.avatar_url });

    const handleProfileClick = (e) => {
        e.stopPropagation();
        if (user?.username) {
            navigate(`/profile/${user.username}`);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.userRow}>
                <img
                    src={avatarUrl}
                    alt={user.username}
                    className={styles.avatar}
                    onClick={handleProfileClick}
                />
                <div className={styles.userDetails}>
                    <div
                        className={styles.username}
                        onClick={handleProfileClick}
                    >
                        @{user.username || 'Unknown User'}
                        {user.is_verified && <VerifiedBadge size={14} />}
                    </div>
                    {!user.is_following && !isOwnContent && (
                        <button
                            onClick={onFollow}
                            className={styles.followBtn}
                        >
                            Follow
                        </button>
                    )}
                </div>
            </div>
            {caption && <BoltzCaption text={caption} />}
        </div>
    );
};

export default BoltzUserInfo;
