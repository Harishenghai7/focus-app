import React from 'react';
import styles from './FlashStoriesBar.module.css';
import StoryTile from './StoryTile';
import { useStories } from '../../hooks/useStories'; // Ensure this hook exists
import { useFocusIdentity } from '../../context/FocusIdentityContext';

const FlashStoriesBar = ({ onStoryClick, onAddStory }) => {
    const { userId, avatarUrl, displayName, handle, isVerified } = useFocusIdentity();
    // Fixed: Removed the emptyArray state that was causing issues
    const { stories = [], loading } = useStories(); 

    // Safe filtering
    const myStory = userId ? stories.find((s) => s?.user?.id === userId) : null;
    const otherStories = userId ? stories.filter((s) => s?.user?.id && s.user.id !== userId) : [];

    return (
        <div className={styles.container}>
            <div className={styles.scrollArea}>
                {/* My Story Tile */}
                <StoryTile
                    isOwn={true}
                    story={myStory || { user: { id: userId, avatar_url: avatarUrl, username: handle, full_name: displayName, is_verified: isVerified } }}
                    onClick={myStory ? () => onStoryClick(myStory) : onAddStory}
                />

                {/* Other Stories */}
                {loading ? (
                    // Simple inline loader skeleton
                    [1, 2, 3].map(i => (
                        <div key={i} style={{ 
                            width: 65, height: 65, borderRadius: '50%', 
                            background: '#222', flexShrink: 0 
                        }} />
                    ))
                ) : (
                    otherStories.map((storyGroup) => (
                        <StoryTile
                            key={storyGroup.user.id}
                            story={storyGroup}
                            onClick={() => onStoryClick(storyGroup)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default FlashStoriesBar;