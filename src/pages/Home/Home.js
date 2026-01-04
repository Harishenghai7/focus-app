/**
 * Home Page - Updated with New Feed System
 * Integrates new PostCard and Feed components with existing features
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import MainLayout from '../../components/layout/MainLayout';
import FlashStoriesBar from '../../components/home/FlashStoriesBar';
import Feed from '../../components/feed/Feed';
import FlashViewer from '../../components/modals/FlashViewer';
import ShareModal from '../../components/modals/ShareModal';

const Home = () => {
    const navigate = useNavigate();
    const [activeStoryGroup, setActiveStoryGroup] = useState(null);
    const [shareItem, setShareItem] = useState(null);

    const handleAddStory = () => {
        navigate('/create?tab=flash');
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                <FlashStoriesBar
                    onStoryClick={setActiveStoryGroup}
                    onAddStory={handleAddStory}
                />

                {/* New Advanced Feed Component */}
                <Feed feedType="home" />

                <FlashViewer
                    isOpen={!!activeStoryGroup}
                    onClose={() => setActiveStoryGroup(null)}
                    storyGroup={activeStoryGroup}
                />

                {shareItem && (
                    <ShareModal
                        item={shareItem}
                        type={shareItem.type || 'post'}
                        onClose={() => setShareItem(null)}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default Home;
