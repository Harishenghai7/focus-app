/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FlashStoriesBar — Cinematic Universe Edition
 * Animated gradient rings, live indicators, story tiles with premium transitions.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React from 'react';
import styles from './FlashStoriesBar.module.css';
import StoryTile from './StoryTile';
import { useStories } from '../../hooks/useStories';
import { useFocusIdentity } from '../../context/FocusIdentityContext';
import { FaPlus } from 'react-icons/fa';

const FlashStoriesBar = ({ onStoryClick, onAddStory }) => {
    const { userId, avatarUrl, displayName, handle, isVerified } = useFocusIdentity();
    const { stories = [], loading } = useStories(); 

    // Safe filtering
    const myStory = userId ? stories.find((s) => s?.user?.id === userId) : null;
    const otherStories = userId ? stories.filter((s) => s?.user?.id && s.user.id !== userId) : [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>Flash</span>
                <span className={styles.subtitle}>{otherStories.length} stories</span>
            </div>
            <div className={styles.scrollArea}>
                {/* My Story / Add Story */}
                <div className={styles.myStoryWrapper}>
                    <div
                        className={`${styles.storyTile} ${myStory ? styles.hasStory : styles.addStory}`}
                        onClick={myStory ? () => onStoryClick(myStory) : onAddStory}
                    >
                        <div className={styles.avatarRing}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={handle || 'You'} className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarFallback}>
                                    {(displayName || handle || 'U')[0]?.toUpperCase()}
                                </div>
                            )}
                            {!myStory && (
                                <span className={styles.addBadge}>
                                    <FaPlus />
                                </span>
                            )}
                        </div>
                        <span className={styles.storyLabel}>
                            {myStory ? 'Your story' : 'Add story'}
                        </span>
                    </div>
                </div>

                {/* Other Stories */}
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className={styles.skeletonTile}>
                            <div className={styles.skeletonAvatar} />
                            <div className={styles.skeletonLabel} />
                        </div>
                    ))
                ) : (
                    otherStories.map((storyGroup) => {
                        const storyUser = storyGroup.user || {};
                        const hasUnwatched = !storyGroup.allWatched;
                        const isLive = storyGroup.isLive || false;

                        return (
                            <div
                                key={storyUser.id}
                                className={styles.storyTile}
                                onClick={() => onStoryClick(storyGroup)}
                            >
                                <div className={`${styles.avatarRing} ${hasUnwatched ? styles.unwatched : styles.watched}`}>
                                    {storyUser.avatar_url ? (
                                        <img src={storyUser.avatar_url} alt={storyUser.username} className={styles.avatar} />
                                    ) : (
                                        <div className={styles.avatarFallback}>
                                            {(storyUser.full_name || storyUser.username || '?')[0]?.toUpperCase()}
                                        </div>
                                    )}
                                    {isLive && <span className={styles.liveBadge}>LIVE</span>}
                                </div>
                                <span className={`${styles.storyLabel} ${hasUnwatched ? styles.labelBold : ''}`}>
                                    {storyUser.username || 'User'}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default FlashStoriesBar;