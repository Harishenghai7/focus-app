import React from 'react';
import styles from './BoltzUserInfo.module.css';
import BoltzCaption from './BoltzCaption';
import { BadgeCheck, UserPlus } from 'lucide-react';

const BoltzUserInfo = ({ user, caption, onFollow, isOwnContent, category }) => {
    const profile = Array.isArray(user) ? user[0] : user;
    const displayName = profile?.full_name || profile?.username || 'Creator';
    const handle = profile?.username ? `@${profile.username}` : '';
    const isVerified = profile?.is_verified || profile?.trust_tier >= 4;
    const avatarUrl = profile?.avatar_url;

    return (
        <div className={styles.container}>
            <div className={styles.userRow}>
                <div className={`${styles.avatarContainer} ${isVerified ? styles.verified : ''}`}>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="" className={styles.avatar} loading="lazy" />
                    ) : (
                        <div className={styles.avatarFallback}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {isVerified && <div className={styles.avatarRing} />}
                </div>

                <div className={styles.nameContainer}>
                    <div className={styles.nameRow}>
                        <span className={styles.displayName}>{displayName}</span>
                        {isVerified && (
                            <BadgeCheck size={16} className={styles.verifiedBadge} />
                        )}
                    </div>
                    {handle && <span className={styles.handle}>{handle}</span>}
                </div>

                {!isOwnContent && (
                    <button className={styles.followBtn} onClick={(e) => { e.stopPropagation(); onFollow?.(); }}>
                        <UserPlus size={14} />
                        <span>Follow</span>
                    </button>
                )}
            </div>

            <BoltzCaption text={caption} />

            {category && category !== 'entertainment' && (
                <span className={styles.categoryBadge}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                </span>
            )}
        </div>
    );
};

export default BoltzUserInfo;
