import React, { useState } from 'react';
import styles from './SuggestedUserCard.module.css';
import { FaCheckCircle, FaUserPlus, FaCheck, FaHeart } from 'react-icons/fa';

const SuggestedUserCard = ({ user, isFollowing, onFollow }) => {
    const [animateFollow, setAnimateFollow] = useState(false);

    const handleFollowClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!isFollowing) {
            setAnimateFollow(true);
            setTimeout(() => setAnimateFollow(false), 800);
        }
        
        onFollow();
    };

    const getInitials = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    const formatFollowers = (count) => {
        if (!count) return 'New';
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.avatarWrapper}>
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className={styles.avatar} />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {getInitials(user.full_name || user.username)}
                        </div>
                    )}
                    {user.verified && (
                        <div className={styles.verifiedBadge}>
                            <FaCheckCircle />
                        </div>
                    )}
                </div>

                <div className={styles.userInfo}>
                    <h3 className={styles.name}>{user.full_name || user.username}</h3>
                    <span className={styles.username}>@{user.username}</span>
                </div>
            </div>

            {user.bio && (
                <p className={styles.bio}>
                    {user.bio.length > 60 ? `${user.bio.substring(0, 60)}...` : user.bio}
                </p>
            )}

            <div className={styles.footer}>
                <span className={styles.stats}>
                    <strong>{formatFollowers(user.followers_count)}</strong> followers
                </span>

                <button
                    className={`${styles.followBtn} ${isFollowing ? styles.followingBtn : ''}`}
                    onClick={handleFollowClick}
                >
                    {isFollowing ? (
                        <>
                            <FaCheck className={styles.btnIcon} />
                            <span>Following</span>
                        </>
                    ) : (
                        <>
                            <FaUserPlus className={styles.btnIcon} />
                            <span>Follow</span>
                        </>
                    )}
                    
                    {animateFollow && (
                        <div className={styles.heartBurst}>
                            <FaHeart className={styles.burstIcon} />
                        </div>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SuggestedUserCard;
