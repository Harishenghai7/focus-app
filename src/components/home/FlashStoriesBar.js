import React from 'react';
import styles from './FlashStoriesBar.module.css';
import StoryTile from './StoryTile';
import { useStories } from '../../hooks/useStories';
import { useAuth } from '../../hooks/useAuth';
import Loader from '../ui/Loader';

const FlashStoriesBar = ({ onStoryClick, onAddStory }) => {
    const { user } = useAuth();
    // Use stable empty array to prevent infinite loop
    const [emptyArray] = React.useState([]);
    const { stories, loading } = useStories(emptyArray);

    // Filter stories to separate "My Story" from others
    const myStory = user ? stories.find(s => s.user.id === user.id) : null;
    const otherStories = user ? stories.filter(s => s.user.id !== user.id) : stories;

    return (
        <div className={styles.container}>
            <div className={styles.scrollArea}>
                <StoryTile
                    isOwn={true}
                    story={myStory || { user }}
                    onClick={myStory ? () => onStoryClick(myStory) : onAddStory}
                />

                {loading ? (
                    <div className={styles.loader}>
                        <Loader size="sm" />
                    </div>
                ) : (
                    otherStories.map((storyGroup) => (
                        <StoryTile
                            key={storyGroup.user.id}
                            story={storyGroup}
                            onClick={onStoryClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default FlashStoriesBar;
