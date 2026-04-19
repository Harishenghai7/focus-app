import React, { useState } from 'react';
import styles from './Avatar.module.css';
import { Check } from 'lucide-react';

/**
 * UserAvatar — Universal Avatar Component for Focus App
 *
 * Features:
 * - Shimmer placeholder while image loads (no white flash)
 * - Deterministic gradient initials fallback per username
 * - Story ring (new / watched states)
 * - Online dot indicator
 * - Sizes: xs → 3xl
 * - Graceful error recovery (instant fallback to initials)
 */

const GRADIENTS = [
    ['#7C3AED', '#A78BFA'], // purple
    ['#2563EB', '#60A5FA'], // blue
    ['#059669', '#34D399'], // green
    ['#DC2626', '#F87171'], // red
    ['#D97706', '#FCD34D'], // amber
    ['#7C3AED', '#EC4899'], // purple-pink
    ['#0891B2', '#22D3EE'], // cyan
    ['#9333EA', '#F472B6'], // fuchsia-pink
];

const getGradient = (str = '') => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

const getInitials = (username = '', fullName = '') => {
    const source = fullName?.trim() || username?.trim() || '?';
    const parts = source.split(/[\s_-]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return source.slice(0, 2).toUpperCase();
};

const UserAvatar = ({
    src,
    username = '',
    fullName = '',
    size = 'md',
    online = false,
    isVerified = false,
    hasStory = false,
    storyWatched = false,
    className = '',
    onClick,
    style = {},
    alt,
    eager = false,   // Set true for above-the-fold avatars (sidebar, header)
}) => {
    const [imgState, setImgState] = useState('loading'); // 'loading' | 'loaded' | 'error'

    const hasValidSrc = src && src.trim() !== '';
    const showImage = hasValidSrc && imgState !== 'error';
    const showShimmer = hasValidSrc && imgState === 'loading';
    const initials = getInitials(username, fullName);
    const [gradStart, gradEnd] = getGradient(username || fullName);

    return (
        <div
            className={[
                styles.wrapper,
                styles[`size-${size}`],
                hasStory && !storyWatched ? styles.storyNew : '',
                hasStory && storyWatched ? styles.storyWatched : '',
                onClick ? styles.clickable : '',
                className,
            ].filter(Boolean).join(' ')}
            onClick={onClick}
            style={style}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            aria-label={alt || username || 'User avatar'}
        >
            <div className={styles.avatarInner}>
                {/* Shimmer placeholder — visible while image is loading */}
                {showShimmer && (
                    <div className={styles.shimmer} aria-hidden="true" />
                )}

                {showImage ? (
                    <img
                        src={src}
                        alt={alt || username || 'avatar'}
                        className={styles.image}
                        style={{ opacity: imgState === 'loaded' ? 1 : 0 }}
                        onLoad={() => setImgState('loaded')}
                        onError={() => setImgState('error')}
                        loading={eager ? 'eager' : 'lazy'}
                        decoding="async"
                    />
                ) : (
                    !showShimmer && (
                        <div
                            className={styles.initials}
                            style={{
                                background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
                            }}
                            aria-hidden="true"
                        >
                            {initials}
                        </div>
                    )
                )}

                {/* Show initials under shimmer if no image is loaded yet */}
                {showShimmer && (
                    <div
                        className={styles.initialsUnderShimmer}
                        style={{ background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})` }}
                        aria-hidden="true"
                    >
                        {initials}
                    </div>
                )}
            </div>

            {isVerified && (
                <div className={styles.verifiedBadge} aria-label="Verified">
                    <Check strokeWidth={3} />
                </div>
            )}
            
            {online && !isVerified && <span className={styles.onlineDot} aria-label="Online" />}
        </div>
    );
};

export default UserAvatar;
