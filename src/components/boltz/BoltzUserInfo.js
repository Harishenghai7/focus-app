import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './BoltzUserInfo.module.css';
import VerifiedBadge from '../shared/VerifiedBadge';
import BoltzCaption from './BoltzCaption';
import UserAvatar from '../ui/Avatar';

const FALLBACK_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=Focusly';

const BoltzUserInfo = ({ user, caption, onFollow, isOwnContent }) => {
    const navigate = useNavigate();

    if (!user) return null;
    const safeHandle = user.username || `focusly_${(user.actual_user_id || user.id || 'guest').toString().slice(0, 6)}`;

    const handleProfileClick = (e) => {
        e.stopPropagation();
        if (user?.username) navigate(`/profile/${user.username}`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.userRow}>
                <UserAvatar
                    src={user.avatar_url || FALLBACK_AVATAR}
                    username={safeHandle}
                    fullName={user.full_name || safeHandle}
                    size="md"
                    onClick={handleProfileClick}
                    className={styles.avatar}
                />
                <div className={styles.userDetails}>
                    <div className={styles.username} onClick={handleProfileClick}>
                        @{safeHandle}
                        {(user.is_verified || (user.trust_tier || 0) >= 4) && <VerifiedBadge size={14} />}
                    </div>
                    {!user.is_following && !isOwnContent && (
                        <button onClick={onFollow} className={styles.followBtn}>
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
