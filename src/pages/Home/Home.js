/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏛️ HOME - THE TRINITY FEED ARCHITECTURE
 * H2 Universal Theme | Sovereign Edition
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * THE TRINITY:
 * 1. FLASH (Stories) - Horizontal sovereign pulse at top
 * 2. POSTS (Feed) - Vertical infinite scroll with glassmorphism
 * 3. BOLTZ (Short-form) - Immersive video overlay
 * 
 * Features:
 * - Auto-adaptive layout (Mobile/Tablet/Desktop/TV)
 * - Real-time Supabase synchronization
 * - Infinite scroll pagination (10 items per fetch)
 * - Satin blur placeholders for lazy loading
 * - Double-tap to like with lavender heart animation
 * - Trust Shield 3D badge integration
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowRight, FaHeart, FaShieldAlt, FaVideo } from 'react-icons/fa';
import { useFocusUser } from '../../context/FocusUserContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useStories } from '../../hooks/useStories';
import styles from './Home.module.css';

// ═══════════════════════════════════════════════════════════════════════════════
// TRINITY COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
import MainLayout from '../../components/layout/MainLayout';
import FlashStoriesBar from '../../components/home/FlashStoriesBar';
import BoltzPreviewRow from '../../components/boltz/BoltzPreviewRow';
import Feed from '../../components/feed/Feed';
import FlashViewer from '../../components/modals/FlashViewer';
import HomeSkeleton from './HomeSkeleton';
import HomeErrorBoundary from './HomeErrorBoundary';
import { supabase } from '../../lib/supabase';

const homeSignals = [
    { label: 'Trusted by design', value: 'Trust Shield-first discovery', icon: <FaShieldAlt /> },
    { label: 'Healthy feed', value: 'Meaningful posts over noise', icon: <FaHeart /> },
    { label: 'Boltz ready', value: 'Short-form creativity nearby', icon: <FaVideo /> }
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOME COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const Home = () => {
    const navigate = useNavigate();
    const { user, loading } = useFocusUser();
    const layout = useResponsiveLayout();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    const [activeStoryGroup, setActiveStoryGroup] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'following' | 'boltz'
    const [newPostsAvailable, setNewPostsAvailable] = useState(false);

    // Fetch all story groups for navigation
    const { stories: allStoryGroups } = useStories();

    // ═══════════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════
    const handleAddStory = useCallback(() => {
        navigate('/create?tab=flash');
    }, [navigate]);

    // Handle navigation between story groups (swipe left/right between users)
    const handleNavigateGroup = useCallback((direction) => {
        if (!activeStoryGroup || !allStoryGroups?.length) return;
        
        const currentIndex = allStoryGroups.findIndex(
            g => g.user?.id === activeStoryGroup.user?.id
        );
        
        if (direction === 'next' && currentIndex < allStoryGroups.length - 1) {
            setActiveStoryGroup(allStoryGroups[currentIndex + 1]);
        } else if (direction === 'prev' && currentIndex > 0) {
            setActiveStoryGroup(allStoryGroups[currentIndex - 1]);
        }
    }, [activeStoryGroup, allStoryGroups]);

    const handleNewPosts = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setNewPostsAvailable(false);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // REAL-TIME NEW POSTS SUBSCRIPTION
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!user?.id) return;

        const channel = supabase
            .channel('home-new-posts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'posts',
                },
                (payload) => {
                    // Show new posts notification if not at top
                    if (window.scrollY > 100) {
                        setNewPostsAvailable(true);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    // ═══════════════════════════════════════════════════════════════════════════
    // LOADING STATE
    // ═══════════════════════════════════════════════════════════════════════════
    if (loading) {
        return (
            <MainLayout>
                <div className={styles.sovereignContainer}>
                    <div className={styles.glassBackdrop}>
                        <HomeSkeleton />
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!user) return null;

    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <MainLayout>
            <HomeErrorBoundary>
                <div 
                    className={styles.sovereignContainer}
                    data-layout={layout.isMobile ? 'mobile' : layout.isTablet ? 'tablet' : 'desktop'}
                >
                    {/* ═════════════════════════════════════════════════════════════════ */}
                    {/* GLASSMORPHISM BACKDROP */}
                    {/* ═════════════════════════════════════════════════════════════════ */}
                    <div className={styles.glassBackdrop} />
                    
                    {/* ═════════════════════════════════════════════════════════════════ */}
                    {/* NEW POSTS NOTIFICATION */}
                    {/* ═════════════════════════════════════════════════════════════════ */}
                    <AnimatePresence>
                        {newPostsAvailable && (
                            <motion.button
                                initial={{ opacity: 0, y: -50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                className={styles.newPostsBanner}
                                onClick={handleNewPosts}
                            >
                                <span className={styles.pulseDot} />
                                New posts available - Tap to view
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* ═════════════════════════════════════════════════════════════════ */}
                    {/* TRINITY FEED CONTAINER */}
                    {/* ═════════════════════════════════════════════════════════════════ */}
                    <div 
                        className={styles.trinityStack}
                        style={{ 
                            maxWidth: layout.isWide ? 1200 : layout.isDesktop ? 900 : 680,
                            padding: layout.isMobile ? '0 12px' : '0 24px',
                        }}
                    >
                        <motion.section
                            className={styles.heroPanel}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45 }}
                        >
                            <div className={styles.heroContent}>
                                <div className={styles.heroCopy}>
                                    <span className={styles.heroEyebrow}>Healthy Home</span>
                                    <h1 className={styles.heroTitle}>A feed tuned for real people, real creativity, and calmer momentum.</h1>
                                    <p className={styles.heroSubtitle}>
                                        Focus prioritizes authentic creators, thoughtful interaction, and trust-aware discovery instead of outrage loops.
                                    </p>
                                </div>

                                <div className={styles.heroActions}>
                                    <button className={styles.heroButton} onClick={() => navigate('/explore')}>
                                        Explore trusted discovery
                                        <FaArrowRight />
                                    </button>
                                    <button className={styles.heroGhostButton} onClick={() => navigate('/create')}>
                                        Create something real
                                    </button>
                                </div>
                            </div>

                            <div className={styles.heroMetrics}>
                                {homeSignals.map((signal) => (
                                    <article key={signal.label} className={styles.heroMetric}>
                                        <span className={styles.heroMetricIcon}>{signal.icon}</span>
                                        <div>
                                            <p className={styles.heroMetricLabel}>{signal.label}</p>
                                            <strong className={styles.heroMetricValue}>{signal.value}</strong>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </motion.section>
                        {/* ═════════════════════════════════════════════════════════════ */}
                        {/* LAYER 1: FLASH (STORIES) */}
                        {/* Sovereign Pulse | Horizontal Scroll */}
                        {/* ═════════════════════════════════════════════════════════════ */}
                        <motion.section 
                            className={styles.flashSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <FlashStoriesBar
                                onStoryClick={setActiveStoryGroup}
                                onAddStory={handleAddStory}
                            />
                        </motion.section>

                        {/* ═════════════════════════════════════════════════════════════ */}
                        {/* LAYER 2: FEED TABS */}
                        {/* Glass Capsule Navigation */}
                        {/* ═════════════════════════════════════════════════════════════ */}
                        <motion.nav 
                            className={styles.feedTabs}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <div className={styles.tabContainer}>
                                {['all', 'following'].map((tab) => (
                                    <button
                                        key={tab}
                                        className={`${styles.tabButton} ${activeTab === tab ? styles.tabActive : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        <span className={styles.tabGlow} />
                                        <span className={styles.tabText}>
                                            {tab === 'all' ? '✨ For You' : '👥 Following'}
                                        </span>
                                        {activeTab === tab && (
                                            <motion.div 
                                                className={styles.tabIndicator}
                                                layoutId="activeTab"
                                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.nav>

                        {/* ═════════════════════════════════════════════════════════════ */}
                        {/* LAYER 3: BOLTZ PREVIEW */}
                        {/* Short-form Video Teaser */}
                        {/* ═════════════════════════════════════════════════════════════ */}
                        <motion.section
                            className={styles.boltzSection}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <BoltzPreviewRow />
                        </motion.section>

                        {/* ═════════════════════════════════════════════════════════════ */}
                        {/* LAYER 4: POSTS FEED */}
                        {/* Infinite Scroll | Glassmorphism Cards */}
                        {/* ═════════════════════════════════════════════════════════════ */}
                        <motion.main
                            className={styles.feedSection}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <Feed 
                                feedType={activeTab === 'following' ? 'following' : 'home'} 
                                layout={layout}
                            />
                        </motion.main>
                    </div>

                    {/* ═════════════════════════════════════════════════════════════════ */}
                    {/* MODALS & OVERLAYS */}
                    {/* ═════════════════════════════════════════════════════════════════ */}
                    <AnimatePresence>
                        {activeStoryGroup && (
                            <FlashViewer
                                isOpen={!!activeStoryGroup}
                                onClose={() => setActiveStoryGroup(null)}
                                storyGroup={activeStoryGroup}
                                allGroups={allStoryGroups}
                                onNavigateGroup={handleNavigateGroup}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </HomeErrorBoundary>
        </MainLayout>
    );
};

export default Home;
