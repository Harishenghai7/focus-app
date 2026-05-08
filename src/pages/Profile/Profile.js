import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MainLayout from '../../components/layout/MainLayout';
import SovereignBanner from '../../components/Profile/SovereignBanner';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import TrustShieldMatrix from '../../components/Profile/TrustShieldMatrix';
import InterestsConstellation from '../../components/Profile/InterestsConstellation';
import HighlightCarousel from '../../components/Profile/HighlightCarousel';
import AchievementsOrbit from '../../components/Profile/AchievementsOrbit';
import ActivityPulse from '../../components/Profile/ActivityPulse';
import ProfileTabs from '../../components/Profile/ProfileTabs';
import ProfileGrid from '../../components/Profile/ProfileGrid';
import FollowersModal from '../../components/Profile/FollowersModal';
import FollowingModal from '../../components/Profile/FollowingModal';
import PostDetailModal from '../../components/modals/PostDetailModal';
import BoltzDetailModal from '../../components/Profile/BoltzDetailModal';
import HighlightsViewerModal from '../../components/Profile/HighlightsViewerModal';
import LoadingSkeleton from '../../components/shared/LoadingSkeleton';
import { useProfile } from '../../hooks/useProfile';
import { useProfileTabs } from '../../hooks/useProfileTabs';
import { useProfileGrid } from '../../hooks/useProfileGrid';
import { useHighlights } from '../../hooks/useHighlights';
import { useAuth } from '../../hooks/useAuth';
import { useUserInterests } from '../../hooks/useUserInterests';
import { useActivityInsights } from '../../hooks/useActivityInsights';
import getTrustShieldState from '../../utils/trustShieldPolicy';
import useGuardianLinks from '../../hooks/useGuardianLinks';
import { triggerHaptic } from '../../utils/haptics';
import styles from './Profile.module.css';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, profile: authProfile, loading: authLoading } = useAuth();
    const trust = useMemo(() => getTrustShieldState(authProfile), [authProfile]);
    const { links: guardianLinks, loading: guardianLinksLoading } = useGuardianLinks(currentUser?.id);

    // Determine the profile to load
    const profileUsername = username || currentUser?.id;

    // Fetch profile data
    const {
        profile,
        loading: profileLoading,
        error,
        currentUserRelation,
        updateFollowStatus,
        refresh: refreshProfile,
    } = useProfile(profileUsername);

    const isOwnProfile = useMemo(() => {
        if (!currentUser) return false;
        if (!username) return true;
        if (username === currentUser.id) return true;
        if (authProfile?.username && username === authProfile.username) return true;
        if (profile?.id && profile.id === currentUser.id) return true;
        return false;
    }, [currentUser, username, authProfile?.username, profile?.id]);

    // Tab management
    const { activeTab, changeTab, availableTabs } = useProfileTabs(isOwnProfile);

    // Grid data
    const { items, loading: gridLoading, hasMore, loadMore } = useProfileGrid(
        profile?.id,
        activeTab,
        isOwnProfile
    );

    // Highlights
    const { highlights, loading: highlightsLoading } = useHighlights(profile?.id, isOwnProfile);

    // Interests
    const { interests } = useUserInterests(profile?.id);

    // Activity Insights (own profile only)
    const { insights } = useActivityInsights(profile?.id, isOwnProfile);

    // Modal states
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [selectedBoltz, setSelectedBoltz] = useState(null);
    const [selectedHighlight, setSelectedHighlight] = useState(null);

    // Handlers
    const handleItemClick = (item) => {
        if (activeTab === 'boltz') {
            setSelectedBoltz(item);
        } else {
            setSelectedPost(item);
        }
    };

    const handleHighlightClick = (highlight) => {
        setSelectedHighlight(highlight);
    };

    const handleAddHighlight = () => {
        navigate('/create?tab=post');
    };

    const handlePostNavigation = (direction) => {
        const currentIndex = items.findIndex(item => item.id === selectedPost?.id);
        if (direction === 'next' && currentIndex < items.length - 1) {
            setSelectedPost(items[currentIndex + 1]);
        } else if (direction === 'prev' && currentIndex > 0) {
            setSelectedPost(items[currentIndex - 1]);
        }
    };

    const handleBoltzNavigation = (direction) => {
        const currentIndex = items.findIndex(item => item.id === selectedBoltz?.id);
        if (direction === 'next' && currentIndex < items.length - 1) {
            setSelectedBoltz(items[currentIndex + 1]);
        } else if (direction === 'prev' && currentIndex > 0) {
            setSelectedBoltz(items[currentIndex - 1]);
        }
    };

    const handleEditBanner = () => {
        // Navigate to edit profile with banner focus
        navigate('/settings?section=profile&focus=banner');
    };

    const handleEditInterests = () => {
        navigate('/settings?section=profile&focus=interests');
    };

    // Empty state messages — Focusly AI personality
    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'posts':
                return isOwnProfile
                    ? 'Macha, your mirror is empty! Go to the Forge and create your first vision.'
                    : 'No posts yet';
            case 'boltz':
                return isOwnProfile
                    ? 'Time to create some magic! Record your first Boltz and share your story.'
                    : 'No Boltz yet';
            case 'flash':
                return isOwnProfile
                    ? 'Your highlights await! Create Flash stories to preserve your best moments.'
                    : 'No Flash highlights yet';
            case 'saved':
                return isOwnProfile
                    ? 'Your collection is waiting. Save posts that inspire you.'
                    : 'No saved posts yet';
            case 'tagged':
                return isOwnProfile
                    ? "You haven't been tagged yet. Share your profile to get noticed!"
                    : 'No tagged posts';
            default:
                return 'Nothing here yet';
        }
    };

    const getEmptyIcon = () => {
        switch (activeTab) {
            case 'posts': return 'Grid3x3';
            case 'boltz': return 'Video';
            case 'saved': return 'Bookmark';
            case 'tagged': return 'UserCheck';
            default: return 'Inbox';
        }
    };

    // ── Loading State ────────────────────────────────────────
    if (authLoading) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <LoadingSkeleton type="profile" />
                </div>
            </MainLayout>
        );
    }

    // ── No Profile Username ──────────────────────────────────
    if (!profileUsername) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <div className={styles.error}>
                        <div className={styles.errorIcon}>🔍</div>
                        <h2>Profile not found</h2>
                        <p>Please log in to view your profile</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // ── Profile Loading ──────────────────────────────────────
    if (profileLoading) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <LoadingSkeleton type="profile" />
                </div>
            </MainLayout>
        );
    }

    // ── Error State ──────────────────────────────────────────
    if (!profile && error) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <div className={styles.error}>
                        <div className={styles.errorIcon}>🚫</div>
                        <h2>Profile not found</h2>
                        <p>{error || 'This profile does not exist'}</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    const hasStories = highlights && highlights.length > 0;

    // ── Render ───────────────────────────────────────────────
    return (
        <MainLayout>
            <div className={styles.profileContainer}>
                {/* Zone 1: Sovereign Banner */}
                <SovereignBanner
                    bannerUrl={profile.banner_url || profile.cover_url}
                    isOwnProfile={isOwnProfile}
                    onEditBanner={handleEditBanner}
                />

                {/* Zone 2: Identity Nucleus */}
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    isFollowing={currentUserRelation.isFollowing}
                    hasStories={hasStories}
                    onFollowStatusChange={updateFollowStatus}
                    onFollowersClick={() => setShowFollowersModal(true)}
                    onFollowingClick={() => setShowFollowingModal(true)}
                    onProfileUpdate={refreshProfile}
                />

                {/* Zone 3: Trust Shield Matrix */}
                <div className={styles.sectionZone}>
                    <TrustShieldMatrix
                        profile={profile}
                        isOwnProfile={isOwnProfile}
                    />
                </div>

                {/* Zone 4: Interests Constellation */}
                <div className={styles.sectionZone}>
                    <InterestsConstellation
                        interests={interests}
                        isOwnProfile={isOwnProfile}
                        onEditInterests={handleEditInterests}
                    />
                </div>

                {/* Flash Highlights Carousel */}
                {!highlightsLoading && (
                    <div className={styles.sectionZone}>
                        <div className={styles.highlightWrap}>
                            <HighlightCarousel
                                highlights={highlights}
                                isOwnProfile={isOwnProfile}
                                onHighlightClick={handleHighlightClick}
                                onAddClick={handleAddHighlight}
                            />
                        </div>
                    </div>
                )}

                {/* Zone 5: Achievements Orbit */}
                <div className={styles.sectionZone}>
                    <AchievementsOrbit
                        badges={profile.badges || []}
                        isOwnProfile={isOwnProfile}
                    />
                </div>

                {/* Zone 6: Activity Pulse (own profile) */}
                {isOwnProfile && (
                    <div className={styles.sectionZone}>
                        <ActivityPulse
                            insights={insights}
                            isOwnProfile={isOwnProfile}
                        />
                    </div>
                )}

                {/* Guardian Hub Card */}
                {isOwnProfile && trust?.status === 'VERIFIED' && !guardianLinksLoading && guardianLinks.length > 0 && (
                    <div
                        className={styles.guardianHubCard}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate('/guardian-hub')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') navigate('/guardian-hub');
                        }}
                    >
                        <div className={styles.guardianHubTitle}>Guardian Hub</div>
                        <div className={styles.guardianHubSub}>Royal Lavender Command Center</div>
                    </div>
                )}

                {/* Zone 7: Content Cosmos — Tabs + Grid */}
                <ProfileTabs
                    activeTab={activeTab}
                    onTabChange={(tab) => {
                        triggerHaptic(8);
                        changeTab(tab);
                    }}
                    availableTabs={availableTabs}
                />

                <div className={styles.content}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <ProfileGrid
                                items={items}
                                loading={gridLoading}
                                hasMore={hasMore}
                                onLoadMore={loadMore}
                                onItemClick={handleItemClick}
                                emptyMessage={getEmptyMessage()}
                                emptyIcon={getEmptyIcon()}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* ── Modals ──────────────────────────────────────── */}
                <FollowersModal
                    isOpen={showFollowersModal}
                    onClose={() => setShowFollowersModal(false)}
                    userId={profile.id}
                    isOwnProfile={isOwnProfile}
                />

                <FollowingModal
                    isOpen={showFollowingModal}
                    onClose={() => setShowFollowingModal(false)}
                    userId={profile.id}
                />

                {selectedPost && (
                    <PostDetailModal
                        post={selectedPost}
                        onClose={() => setSelectedPost(null)}
                        onUpdate={(postId, updates) => {
                            setSelectedPost(prev => ({ ...prev, ...updates }));
                        }}
                    />
                )}

                <BoltzDetailModal
                    isOpen={!!selectedBoltz}
                    onClose={() => setSelectedBoltz(null)}
                    boltz={selectedBoltz}
                    onNavigate={handleBoltzNavigation}
                />

                <HighlightsViewerModal
                    isOpen={!!selectedHighlight}
                    onClose={() => setSelectedHighlight(null)}
                    highlight={selectedHighlight}
                    allHighlights={highlights}
                    onHighlightChange={setSelectedHighlight}
                />
            </div>
        </MainLayout>
    );
};

export default Profile;
