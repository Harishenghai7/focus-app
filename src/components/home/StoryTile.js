import React, { useMemo } from 'react';
import styles from './FlashStoriesBar.module.css';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { useFocusIdentity } from '../../context/FocusIdentityContext';

// 🛡️ ROYAL LAVENDER CONIC GRADIENT CONFIGURATION
const SOVEREIGN_COLORS = {
    primary: '#8b5cf6',    // Royal Lavender
    secondary: '#a78bfa',  // Light Lavender  
    accent: '#ec4899',     // Magenta
    gold: '#f59e0b',       // Trust Shield Gold
};

const flashThumbFrom = (row) => {
    if (!row || typeof row !== 'object') return null;
    return (
        row.thumbnail_url ||
        row.thumb_url ||
        row.media_url ||
        row.image_url ||
        row.cover_url ||
        row.content_url ||
        (Array.isArray(row.media_urls) ? row.media_urls[0] : null) ||
        null
    );
};

const latestThumbFromList = (list) => {
    if (!Array.isArray(list) || list.length === 0) return null;
    const sorted = [...list].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );
    return flashThumbFrom(sorted[0]);
};

// 🛡️ Trust Shield Badge Component
const TrustShieldBadge = ({ tier = 'verified', size = 'small' }) => {
    const isGold = tier === 'gold' || tier === 'premium';
    const badgeClass = size === 'large' ? styles.shieldBadgeLarge : styles.shieldBadge;
    
    return (
        <div className={`${badgeClass} ${isGold ? styles.shieldGold : styles.shieldPurple}`}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                    d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" 
                    fill="currentColor"
                />
                <path 
                    d="M9 12l2 2 4-4" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};

const StoryTile = ({ story, isOwn, onClick }) => {
    const { avatarUrl, displayName, handle, isVerified, trustTier } = useFocusIdentity();
    const ownAvatar = avatarUrl || undefined;

    const latestThumb = useMemo(() => latestThumbFromList(story?.stories), [story?.stories]);

    // 🎨 Royal Lavender Conic Gradient Ring with Trust Shield
    const renderSovereignRing = (content, hasUnviewed, isOwnStory = false, userTrustTier = null) => {
        const isVerifiedUser = isOwn ? isVerified : story?.user?.is_verified;
        const userTier = isOwn ? trustTier : userTrustTier;
        
        return (
            <div 
                className={`${styles.sovereignRing} ${
                    hasUnviewed ? styles.sovereignRingUnviewed : styles.sovereignRingViewed
                } ${isOwnStory ? styles.ownRing : ''}`}
                data-verified={isVerifiedUser}
                data-tier={userTier}
            >
                {/* Conic Gradient Pulse Background */}
                <div className={styles.conicPulse} />
                
                {/* Avatar/Thumbnail Content */}
                <div className={styles.sovereignAvatarWrapper}>
                    {content}
                </div>
                
                {/* 🛡️ Trust Shield Badge - positioned on the ring */}
                {isVerifiedUser && (
                    <TrustShieldBadge tier={userTier} size="small" />
                )}
                
                {/* Add Icon for own story without active flash */}
                {isOwnStory && !story?.stories?.length && (
                    <div className={styles.sovereignAddIcon} aria-hidden>
                        <Icon name="Plus" size={14} color="white" />
                    </div>
                )}
            </div>
        );
    };

    if (isOwn) {
        const hasStory = story?.stories?.length > 0;
        const hasUnviewed = Boolean(story?.hasUnviewed);

        // Own story with active flash - show thumbnail in ring
        if (hasStory && latestThumb) {
            return (
                <div className={styles.storyTile} onClick={onClick}>
                    {renderSovereignRing(
                        <img
                            src={latestThumb}
                            alt="Your Flash"
                            className={styles.sovereignThumb}
                            loading="eager"
                        />,
                        hasUnviewed,
                        true,
                        trustTier
                    )}
                    <span className={styles.sovereignUsername}>Your Flash</span>
                </div>
            );
        }

        // Own story without media - show avatar in ring
        if (hasStory) {
            return (
                <div className={styles.storyTile} onClick={onClick}>
                    {renderSovereignRing(
                        <Avatar
                            src={ownAvatar}
                            username={handle}
                            fullName={displayName}
                            eager
                            isVerified={isVerified}
                            size="lg"
                            className={styles.sovereignAvatar}
                        />,
                        hasUnviewed,
                        true,
                        trustTier
                    )}
                    <span className={styles.sovereignUsername}>Your Flash</span>
                </div>
            );
        }

        // No story - show create prompt with subtle ring
        return (
            <div className={styles.storyTile} onClick={onClick}>
                <div className={styles.sovereignRingEmpty}>
                    <div className={styles.sovereignAvatarWrapper}>
                        <Avatar
                            src={ownAvatar}
                            username={handle}
                            fullName={displayName}
                            eager
                            isVerified={isVerified}
                            size="lg"
                            className={styles.sovereignAvatar}
                        />
                    </div>
                    <div className={styles.sovereignAddIcon} aria-hidden>
                        <Icon name="Plus" size={14} color="white" />
                    </div>
                </div>
                <span className={styles.sovereignUsername}>Add Flash</span>
            </div>
        );
    }

    // Other users' stories
    const hasUnviewed = story?.hasUnviewed;
    const u = story?.user || {};
    const otherThumb = latestThumbFromList(story?.stories);

    return (
        <div className={styles.storyTile} onClick={() => onClick(story)}>
            {renderSovereignRing(
                otherThumb ? (
                    <img
                        src={otherThumb}
                        alt={`${u.username}'s Flash`}
                        className={styles.sovereignThumb}
                        loading="lazy"
                    />
                ) : (
                    <Avatar
                        src={u.avatar_url}
                        username={u.username}
                        fullName={u.full_name}
                        size="lg"
                        className={styles.sovereignAvatar}
                    />
                ),
                hasUnviewed,
                false,
                u.trust_tier
            )}
            <span className={styles.sovereignUsername}>
                {u.username || u.full_name || 'Flash'}
            </span>
        </div>
    );
};

export default StoryTile;
