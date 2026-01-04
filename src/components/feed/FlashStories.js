import React from 'react';
import styles from './FlashStories.module.css';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import { useAuth } from '../../hooks/useAuth';
import { getUserAvatarUrl } from '../../utils/avatarManager';

const FlashStories = ({ stories = [], onStoryClick }) => {
    const { user, profile } = useAuth();

    return (
        <div className={styles.storiesContainer}>
            {/* Create Story Button */}
            <div className={styles.storyItem} onClick={() => onStoryClick && onStoryClick('create')}>
                <div className={`${styles.storyRing} ${styles.createRing}`}>
                    <div className={styles.createIcon}>
                        <Icon name="Plus" size={24} color="#fff" />
                    </div>
                    <Avatar src={getUserAvatarUrl(user, profile)} size="lg" className={styles.myAvatar} />
                </div>
                <span className={styles.username}>Your Flash</span>
            </div>

            {/* Stories List */}
            {stories.map((story) => (
                <div key={story.id} className={styles.storyItem} onClick={() => onStoryClick && onStoryClick(story.id)}>
                    <div className={`${styles.storyRing} ${story.seen ? styles.seen : styles.unseen}`}>
                        <Avatar src={story.user.avatar_url} size="lg" className={styles.storyAvatar} />
                    </div>
                    <span className={styles.username}>{story.user.username}</span>
                </div>
            ))}
        </div>
    );
};

export default FlashStories;
