import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import MainLayout from '../../components/layout/MainLayout';
import ProfileHeader from '../../components/Profile/ProfileHeader';
import HighlightCarousel from '../../components/Profile/HighlightCarousel';
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
import { triggerHaptic } from '../../utils/haptics';
import styles from './Profile.module.css';

const Profile = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, profile: authProfile, loading: authLoading } = useAuth();

    // Determine the profile to load
    const profileUsername = username || currentUser?.id;

    // Fetch profile data - always call hooks
    const { profile, loading: profileLoading, error, currentUserRelation, updateFollowStatus } = useProfile(profileUsername);

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

    // Empty state messages
    const getEmptyMessage = () => {
        switch (activeTab) {
            case 'posts':
                return isOwnProfile ? 'Share your first post' : 'No posts yet';
            case 'boltz':
                return isOwnProfile ? 'Create your first Boltz' : 'No Boltz yet';
            case 'saved':
                return 'No saved posts yet';
            case 'tagged':
                return isOwnProfile ? "You haven't been tagged yet" : 'No tagged posts';
            default:
                return 'Nothing here yet';
        }
    };

    const getEmptyIcon = () => {
        switch (activeTab) {
            case 'posts':
                return 'Grid3x3';
            case 'boltz':
                return 'Video';
            case 'saved':
                return 'Bookmark';
            case 'tagged':
                return 'UserCheck';
            default:
                return 'Inbox';
        }
    };

    // Wait for auth to load
    if (authLoading) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <LoadingSkeleton type="profile" />
                </div>
            </MainLayout>
        );
    }

    // If no username and no current user, show error
    if (!profileUsername) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <div className={styles.error}>
                        <h2>Profile not found</h2>
                        <p>Please log in to view your profile</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Loading state
    if (profileLoading) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <LoadingSkeleton type="profile" />
                </div>
            </MainLayout>
        );
    }

    // Error state - only show if we have NO profile data
    if (!profile && error) {
        return (
            <MainLayout>
                <div className={styles.profileContainer}>
                    <div className={styles.error}>
                        <h2>Profile not found</h2>
                        <p>{error || 'This profile does not exist'}</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    // Check if user has active stories (for avatar ring)
    const hasStories = highlights && highlights.length > 0;

    return (
        <MainLayout>
            <div className={styles.profileContainer}>
                <ProfileHeader
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                    isFollowing={currentUserRelation.isFollowing}
                    hasStories={hasStories}
                    onFollowStatusChange={updateFollowStatus}
                    onFollowersClick={() => setShowFollowersModal(true)}
                    onFollowingClick={() => setShowFollowingModal(true)}
                />

                {!highlightsLoading && (
                    <HighlightCarousel
                        highlights={highlights}
                        isOwnProfile={isOwnProfile}
                        onHighlightClick={handleHighlightClick}
                        onAddClick={handleAddHighlight}
                    />
                )}

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

                {/* Modals */}
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
                            // Update the items in the grid
                            // items is from useProfileGrid, we might need to update it there
                            // For now, we update the selected post locally
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
