/**
 * Home Page - Ultimate Lavender Theme v3.0
 * Fixed: Hook errors & missing CSS
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFocusUser } from '../../context/FocusUserContext';
import styles from './Home.module.css'; // Uses the Lavender CSS above

// Components
import MainLayout from '../../components/layout/MainLayout';
import FlashStoriesBar from '../../components/home/FlashStoriesBar';
import BoltzPreviewRow from '../../components/boltz/BoltzPreviewRow';
import Feed from '../../components/feed/Feed';
import FlashViewer from '../../components/modals/FlashViewer';
import HomeSkeleton from './HomeSkeleton';
import HomeErrorBoundary from './HomeErrorBoundary';

const Home = () => {
    const navigate = useNavigate();
    const { user, loading } = useFocusUser();
    
    // Local State
    const [activeStoryGroup, setActiveStoryGroup] = useState(null);

    const handleAddStory = () => {
        navigate('/create?tab=flash');
    };

    if (loading) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <HomeSkeleton />
                </div>
            </MainLayout>
        );
    }

    if (!user) return null;

    return (
        <MainLayout>
            <HomeErrorBoundary>
                <div className={styles.container}>
                    <div className={styles.homeStack}>
                        <FlashStoriesBar
                            onStoryClick={setActiveStoryGroup}
                            onAddStory={handleAddStory}
                        />

                        <BoltzPreviewRow />

                        <div className={styles.feed}>
                            <Feed feedType="home" />
                        </div>
                    </div>

                    {activeStoryGroup && (
                        <FlashViewer
                            isOpen={!!activeStoryGroup}
                            onClose={() => setActiveStoryGroup(null)}
                            storyGroup={activeStoryGroup}
                        />
                    )}
                </div>
            </HomeErrorBoundary>
        </MainLayout>
    );
};

export default Home;