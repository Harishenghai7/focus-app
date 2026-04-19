import React, { useMemo } from 'react';
import styles from './FlashStoriesBar.module.css';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { useFocusIdentity } from '../../context/FocusIdentityContext';

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

const StoryTile = ({ story, isOwn, onClick }) => {
    const { avatarUrl, displayName, handle, isVerified } = useFocusIdentity();
    const ownAvatar = avatarUrl || undefined;

    const latestThumb = useMemo(() => latestThumbFromList(story?.stories), [story?.stories]);

    if (isOwn) {
        const hasStory = story?.stories?.length > 0;

        if (hasStory && latestThumb) {
            const hasUnviewed = Boolean(story.hasUnviewed);
            return (
                <div className={styles.storyTile} onClick={onClick}>
                    <div
                        className={`${styles.storyRing} ${styles.activeGlow} ${
                            hasUnviewed ? styles.unviewed : styles.viewed
                        }`}
                    >
                        <div className={styles.avatarWrapper}>
                            <img
                                src={latestThumb}
                                alt=""
                                className={styles.thumbFill}
                                loading="lazy"
                            />
                        </div>
                        <div className={styles.addIcon} aria-hidden title="Add Flash">
                            <Icon name="Plus" size={12} color="white" />
                        </div>
                    </div>
                    <span className={styles.username}>Your Flash</span>
                </div>
            );
        }

        if (hasStory) {
            const hasUnviewed = Boolean(story.hasUnviewed);
            return (
                <div className={styles.storyTile} onClick={onClick}>
                    <div
                        className={`${styles.storyRing} ${styles.activeGlow} ${
                            hasUnviewed ? styles.unviewed : styles.viewed
                        }`}
                    >
                        <div className={styles.avatarWrapper}>
                            <Avatar
                                src={ownAvatar}
                                username={handle}
                                fullName={displayName}
                                eager
                                isVerified={isVerified}
                                size="lg"
                                className={styles.avatar}
                            />
                        </div>
                        <div className={styles.addIcon} aria-hidden>
                            <Icon name="Plus" size={12} color="white" />
                        </div>
                    </div>
                    <span className={styles.username}>Your Flash</span>
                </div>
            );
        }

        return (
            <div className={styles.storyTile} onClick={onClick}>
                <div className={styles.ownStoryRing}>
                    <div className={styles.avatarWrapper}>
                        <Avatar
                            src={ownAvatar}
                            username={handle}
                            fullName={displayName}
                            eager
                            isVerified={isVerified}
                            size="lg"
                            className={styles.avatar}
                        />
                    </div>
                    <div className={styles.addIcon} aria-hidden>
                        <Icon name="Plus" size={14} color="white" />
                    </div>
                </div>
                <span className={styles.username}>Your Flash</span>
            </div>
        );
    }

    const hasUnviewed = story.hasUnviewed;
    const u = story.user || {};
    const otherThumb = latestThumbFromList(story?.stories);

    return (
        <div className={styles.storyTile} onClick={() => onClick(story)}>
            <div
                className={`${styles.storyRing} ${
                    hasUnviewed ? styles.unviewed : styles.viewed
                }`}
            >
                <div className={styles.avatarWrapper}>
                    {otherThumb ? (
                        <img
                            src={otherThumb}
                            alt=""
                            className={styles.thumbFill}
                            loading="lazy"
                        />
                    ) : (
                        <Avatar
                            src={u.avatar_url}
                            username={u.username}
                            fullName={u.full_name}
                            size="lg"
                            className={styles.avatar}
                        />
                    )}
                </div>
            </div>
            <span className={styles.username}>
                {u.username || u.full_name || 'Flash'}
            </span>
        </div>
    );
};

export default StoryTile;
