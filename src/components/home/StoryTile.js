import React from 'react';
import styles from './FlashStoriesBar.module.css';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';
import { getUserAvatarUrl } from '../../utils/avatarManager';

const StoryTile = ({ story, isOwn, onClick }) => {
    const { user, profile } = useAuth();

    if (isOwn) {
        const hasStory = story?.stories?.length > 0;

        if (hasStory) {
            const hasUnviewed = story.hasUnviewed;
            return (
                <div className={styles.storyTile} onClick={onClick}>
                    <div className={`
                        ${styles.storyRing} 
                        ${hasUnviewed ? styles.unviewed : styles.viewed}
                    `}>
                        <div className={styles.avatarWrapper}>
                            <Avatar
                                src={getUserAvatarUrl(user, profile)}
                                size="lg"
                                className={styles.avatar}
                            />
                        </div>
                    </div>
                    <span className={styles.username}>Your Flash</span>
                </div>
            );
        }

        return (
            <div className={styles.storyTile} onClick={onClick}>
                <div className={styles.ownStoryRing}>
                    <Avatar
                        src={getUserAvatarUrl(user, profile)}
                        size="lg"
                        className={styles.avatar}
                    />
                    <div className={styles.addIcon}>
                        <Icon name="Plus" size={14} color="white" />
                    </div>
                </div>
                <span className={styles.username}>Your Flash</span>
            </div>
        );
    }

    const hasUnviewed = story.hasUnviewed;

    return (
        <div className={styles.storyTile} onClick={() => onClick(story)}>
            <div className={`
                ${styles.storyRing} 
                ${hasUnviewed ? styles.unviewed : styles.viewed}
                ${story.isCloseFriend ? styles.closeFriend : ''}
            `}>
                <div className={styles.avatarWrapper}>
                    <Avatar src={story.user.avatar_url} size="lg" className={styles.avatar} />
                </div>
            </div>
            <span className={styles.username}>{story.user.username}</span>
        </div>
    );
};

export default StoryTile;
