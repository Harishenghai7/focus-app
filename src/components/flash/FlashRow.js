/**
 * FlashRow — Focus App v2.0
 *
 * Full implementation replacing the 353-byte stub.
 * Horizontal scrollable Stories bar with:
 * - Own story first (Add Story button)
 * - All followed users with active stories
 * - Skeleton loading state
 * - Seen/unseen differentiation
 */

import React from 'react';
import FlashAvatar from './FlashAvatar';
import styles from './FlashRow.module.css';

/* ── Skeleton item ─────────────────────────────────────────── */
const SkeletonItem = () => (
    <div className={styles.skeletonItem}>
        <div className={styles.skeletonRing} />
        <div className={styles.skeletonLabel} />
    </div>
);

/* ── Main FlashRow ─────────────────────────────────────────── */
const FlashRow = ({
    stories = [],       // array of story groups: { user, stories[], seen }
    currentUser = null, // own user object
    onStoryClick,       // (storyGroup) => void
    onAddStory,         // () => void
    loading = false,
}) => {
    if (loading) {
        return (
            <div className={styles.row} aria-label="Stories loading">
                {[...Array(6)].map((_, i) => (
                    <SkeletonItem key={i} />
                ))}
            </div>
        );
    }

    return (
        <div
            className={styles.row}
            aria-label="Flash Stories"
            role="list"
        >
            {/* Own story / Add Story — always first */}
            <div role="listitem">
                <FlashAvatar
                    user={currentUser}
                    isOwn
                    hasUnseenStory={false}
                    onClick={onAddStory}
                    size="md"
                />
            </div>

            {/* Other users' stories */}
            {stories.map((group) => (
                <div key={group.user.id} role="listitem">
                    <FlashAvatar
                        user={group.user}
                        hasUnseenStory={!group.seen}
                        expiresAt={group.expires_at}
                        onClick={() => onStoryClick?.(group)}
                        size="md"
                    />
                </div>
            ))}

            {/* Empty state — no stories from following */}
            {!loading && stories.length === 0 && (
                <p className={styles.emptyLabel}>
                    Follow people to see their Flash stories here
                </p>
            )}
        </div>
    );
};

export default FlashRow;
