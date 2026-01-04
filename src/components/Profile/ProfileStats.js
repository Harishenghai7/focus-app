import React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import styles from './ProfileStats.module.css';

const ProfileStats = ({ postsCount, followersCount, followingCount, onFollowersClick, onFollowingClick }) => {
    return (
        <div className={styles.stats}>
            <div className={styles.stat}>
                <span className={styles.statValue}>{formatNumber(postsCount)}</span>
                <span className={styles.statLabel}>posts</span>
            </div>
            <button
                className={styles.stat}
                onClick={onFollowersClick}
                aria-label={`${followersCount} followers`}
            >
                <span className={styles.statValue}>{formatNumber(followersCount)}</span>
                <span className={styles.statLabel}>followers</span>
            </button>
            <button
                className={styles.stat}
                onClick={onFollowingClick}
                aria-label={`Following ${followingCount} users`}
            >
                <span className={styles.statValue}>{formatNumber(followingCount)}</span>
                <span className={styles.statLabel}>following</span>
            </button>
        </div>
    );
};

export default ProfileStats;
