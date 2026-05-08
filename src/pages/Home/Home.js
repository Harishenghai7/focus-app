/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🏛️ HOME - CINEMATIC UNIVERSE FEED
 * H2 Universal Theme | Sovereign Edition v3
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * THE ARCHITECTURE:
 * 1. CONTEXTUAL GREETING - Time-adaptive, emotionally alive hero
 * 2. FLASH (Stories) - Horizontal sovereign pulse
 * 3. TRUSTED CREATORS - Discovery carousel
 * 4. FEED TABS - Glass capsule navigation  
 * 5. BOLTZ PREVIEW - Short-form video teaser (sticky sidebar on desktop)
 * 6. POSTS FEED - Infinite scroll with diversity injection
 * 7. WELLNESS NUDGE - Healthy engagement boundary
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowUp } from 'react-icons/fa';
import { useFocusUser } from '../../context/FocusUserContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useStories } from '../../hooks/useStories';
import styles from './Home.module.css';

// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
import MainLayout from '../../components/layout/MainLayout';
import ContextualGreeting from '../../components/home/ContextualGreeting';
import FlashStoriesBar from '../../components/home/FlashStoriesBar';
import TrustedCreatorsSpotlight from '../../components/home/TrustedCreatorsSpotlight';
import BoltzPreviewRow from '../../components/boltz/BoltzPreviewRow';
import Feed from '../../components/feed/Feed';
import FlashViewer from '../../components/modals/FlashViewer';
import HomeSkeleton from './HomeSkeleton';
import HomeErrorBoundary from './HomeErrorBoundary';
import { supabase } from '../../lib/supabase';

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
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'following'
    const [newPostsAvailable, setNewPostsAvailable] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollTimerRef = useRef(null);
    const sessionStartRef = useRef(Date.now());

    // Fetch all story groups for navigation
    const { stories: allStoryGroups } = useStories();

    // ═══════════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════
    const handleAddStory = useCallback(() => {
        navigate('/create?tab=flash');
    }, [navigate]);

    // Handle navigation between story groups
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

    const handleScrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    // ═══════════════════════════════════════════════════════════════════════════
    // SCROLL TRACKING — Show/hide scroll-to-top + wellness timing
    // ═══════════════════════════════════════════════════════════════════════════
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 600);
            
            // Show new posts pill when scrolled down
            if (window.scrollY > 100 && newPostsAvailable) {
                // keep visible
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [newPostsAvailable]);

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
    // RENDER — CINEMATIC UNIVERSE
    // ═══════════════════════════════════════════════════════════════════════════
    return (
        <MainLayout>
            <HomeErrorBoundary>
                <div 
                    className={styles.sovereignContainer}
                    data-layout={layout.isMobile ? 'mobile' : layout.isTablet ? 'tablet' : 'desktop'}
                >
                    {/* Ambient backdrop */}
                    <div className={styles.glassBackdrop} />
                    
                    {/* ═════════════════════════════════════════════════════════ */}
                    {/* NEW POSTS NOTIFICATION — Floating pill */}
                    {/* ═════════════════════════════════════════════════════════ */}
                    <AnimatePresence>
                        {newPostsAvailable && (
                            <motion.button
                                initial={{ opacity: 0, y: -50, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                className={styles.newPostsBanner}
                                onClick={handleNewPosts}
                            >
                                <span className={styles.pulseDot} />
                                New posts available — Tap to refresh
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* ═════════════════════════════════════════════════════════ */}
                    {/* SCROLL TO TOP — Floating action button */}
                    {/* ═════════════════════════════════════════════════════════ */}
                    <AnimatePresence>
                        {showScrollTop && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.7, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.7, y: 20 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className={styles.scrollTopBtn}
                                onClick={handleScrollToTop}
                                aria-label="Scroll to top"
                            >
                                <FaArrowUp />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* ═════════════════════════════════════════════════════════ */}
                    {/* FEED UNIVERSE STACK */}
                    {/* ═════════════════════════════════════════════════════════ */}
                    <div 
                        className={styles.trinityStack}
                        style={{ 
                            maxWidth: layout.isWide ? 1200 : layout.isDesktop ? 900 : 680,
                            padding: layout.isMobile ? '0 12px' : '0 24px',
                        }}
                    >
                        {/* ═══ LAYER 1: CONTEXTUAL GREETING ═══ */}
                        <motion.section
                            className={styles.greetingSection}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <ContextualGreeting />
                        </motion.section>

                        {/* ═══ LAYER 2: FLASH STORIES ═══ */}
                        <motion.section 
                            className={styles.flashSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <FlashStoriesBar
                                onStoryClick={setActiveStoryGroup}
                                onAddStory={handleAddStory}
                            />
                        </motion.section>

                        {/* ═══ LAYER 3: TRUSTED CREATORS ═══ */}
                        <motion.section
                            className={styles.creatorsSection}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <TrustedCreatorsSpotlight />
                        </motion.section>

                        {/* ═══ LAYER 4: FEED TABS ═══ */}
                        <motion.nav 
                            className={styles.feedTabs}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
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

                        {/* ═══ LAYER 5: BOLTZ PREVIEW ═══ */}
                        <motion.section
                            className={styles.boltzSection}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.2 }}
                        >
                            <BoltzPreviewRow />
                        </motion.section>

                        {/* ═══ LAYER 6: POSTS FEED ═══ */}
                        <motion.main
                            className={styles.feedSection}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.25 }}
                        >
                            <Feed 
                                feedType={activeTab === 'following' ? 'following' : 'home'} 
                                layout={layout}
                            />
                        </motion.main>
                    </div>

                    {/* ═════════════════════════════════════════════════════════ */}
                    {/* MODALS & OVERLAYS */}
                    {/* ═════════════════════════════════════════════════════════ */}
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
