/**
 * FlashAvatar — Focus App v2.0
 *
 * Full implementation replacing the 279-byte stub.
 * Features:
 * - Gradient ring (unseen story) with pulse animation
 * - Grey ring (all stories seen)
 * - Countdown conic-gradient ring (time remaining)
 * - Add-Story variant (own avatar with + badge)
 * - Handles missing avatar gracefully via UserAvatar
 */

import React, { useMemo } from 'react';
import UserAvatar from '../ui/Avatar';
import styles from './FlashAvatar.module.css';

const FlashAvatar = ({
    user,                   // { id, username, full_name, avatar_url }
    hasUnseenStory = true,  // false → grey ring
    isOwn = false,          // true → show + badge for "Add Story"
    expiresAt = null,       // ISO string — used for countdown ring
    onClick,
    size = 'md',            // 'sm' | 'md' | 'lg'
}) => {
    // Calculate how much of the ring to show (0→1 remaining ratio)
    const ringProgress = useMemo(() => {
        if (!expiresAt) return 1;
        const created = new Date(expiresAt).getTime() - 24 * 60 * 60 * 1000; // 24h before
        const expires = new Date(expiresAt).getTime();
        const now = Date.now();
        const ratio = (expires - now) / (expires - created);
        return Math.max(0, Math.min(1, ratio));
    }, [expiresAt]);

    const ringDeg = Math.round(ringProgress * 360);

    const wrapperClass = [
        styles.wrapper,
        styles[`size-${size}`],
        isOwn ? styles.ownWrapper : '',
    ].filter(Boolean).join(' ');

    const ringClass = [
        styles.ring,
        hasUnseenStory && !isOwn ? styles.ringUnseen : styles.ringWatched,
        hasUnseenStory && !isOwn ? styles.ringPulse : '',
    ].filter(Boolean).join(' ');

    return (
        <button
            className={wrapperClass}
            onClick={onClick}
            aria-label={isOwn ? 'Add to your Flash story' : `View ${user?.username}'s story`}
            type="button"
        >
            {/* Gradient / countdown ring */}
            <div
                className={ringClass}
                style={
                    expiresAt && hasUnseenStory
                        ? {
                            background: `conic-gradient(
                                from 0deg,
                                #7E57C2 0deg,
                                #EC4899 ${ringDeg * 0.5}deg,
                                #F97316 ${ringDeg}deg,
                                rgba(255,255,255,0.12) ${ringDeg}deg 360deg
                            )`,
                          }
                        : undefined
                }
            >
                <div className={styles.ringInner}>
                    <UserAvatar
                        src={user?.avatar_url}
                        username={user?.username}
                        fullName={user?.full_name}
                        size={size}
                        eager
                    />
                </div>
            </div>

            {/* Caption */}
            <span className={styles.label}>
                {isOwn ? 'Your Flash' : (user?.username || 'User').slice(0, 10)}
            </span>

            {/* Add Story badge */}
            {isOwn && (
                <div className={styles.addBadge} aria-hidden="true">+</div>
            )}
        </button>
    );
};

export default FlashAvatar;
