import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import styles from './Boltz.module.css';
import BoltzTabs from '../../components/boltz/BoltzTabs';
import BoltzPlayer from '../../components/boltz/BoltzPlayer';
import BoltzEmptyState from '../../components/boltz/BoltzEmptyState';
import BoltzCommentsSheet from '../../components/modals/BoltzCommentsSheet';
import ShareModal from '../../components/modals/ShareModal';
import BoltzOptionsModal from '../../components/modals/BoltzOptionsModal';
import MusicPageModal from '../../components/modals/MusicPageModal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useBoltzFeed } from '../../hooks/useBoltzFeed';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { useLike } from '../../hooks/useLike';
import { useSave } from '../../hooks/useSave';
import { useFollow } from '../../hooks/useFollow';
import { useAuth } from '../../hooks/useAuth';
import { preloadVideos } from '../../utils/preloadVideos';

const Boltz = () => {
    const { id } = useParams(); // Get boltz ID from URL
    const [activeTab, setActiveTab] = useState('foryou');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(true);

    // Modals
    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showMusic, setShowMusic] = useState(false);
    const [selectedMusic, setSelectedMusic] = useState(null);

    const { boltz, loading, hasMore, loadMore, setBoltz } = useBoltzFeed(activeTab);
    const { setVideoRef } = useVideoPlayer(currentIndex, boltz, playing, muted);
    const { toggleLike, showHeartAnimation } = useLike();
    const { toggleSave } = useSave();
    const { toggleFollow } = useFollow();
    const { user } = useAuth();

    const goNext = useCallback(() => {
        if (currentIndex < boltz.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else if (hasMore) {
            loadMore();
        }
    }, [currentIndex, boltz.length, hasMore, loadMore]);

    const goPrevious = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }, [currentIndex]);

    const containerRef = useSwipeNavigation(goNext, goPrevious, !showComments && !showShare && !showOptions && !showMusic);

    // Preload videos
    useEffect(() => {
        if (boltz.length > 0) {
            preloadVideos(boltz, currentIndex);
        }
    }, [currentIndex, boltz]);

    // Load more when approaching end
    useEffect(() => {
        if (currentIndex > boltz.length - 5 && hasMore && !loading) {
            loadMore();
        }
    }, [currentIndex, boltz.length, hasMore, loading, loadMore]);

    // Reset index when tab changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeTab]);

    // If ID is provided in URL, find and display that boltz
    useEffect(() => {
        if (id && boltz.length > 0) {
            const index = boltz.findIndex(b => b.id === id);
            if (index !== -1) {
                setCurrentIndex(index);
                console.log(`✅ [BOLTZ] Found boltz with ID ${id} at index ${index}`);
            } else {
                console.log(`⚠️ [BOLTZ] Boltz with ID ${id} not found in feed`);
            }
        }
    }, [id, boltz]);

    const handleUpdateBoltz = useCallback((boltzId, updates) => {
        setBoltz(prev => prev.map(b => {
            if (b.id === boltzId) {
                return {
                    ...b,
                    ...updates,
                    likes_count: updates.likes_count_delta !== undefined
                        ? b.likes_count + updates.likes_count_delta
                        : b.likes_count,
                    saves_count: updates.saves_count_delta !== undefined
                        ? b.saves_count + updates.saves_count_delta
                        : b.saves_count
                };
            }
            return b;
        }));
    }, [setBoltz]);

    const handleLike = () => {
        const currentBoltz = boltz[currentIndex];
        if (!currentBoltz) return;
        toggleLike(currentBoltz.id, currentBoltz.is_liked, 'boltz', handleUpdateBoltz);
    };

    const handleSave = () => {
        const currentBoltz = boltz[currentIndex];
        if (!currentBoltz) return;
        toggleSave(currentBoltz.id, currentBoltz.is_saved, 'boltz', handleUpdateBoltz);
    };

    const handleShare = () => {
        console.log('handleShare called - setting showShare to true');
        setShowShare(true);
    };

    const handleFollow = (userId) => {
        toggleFollow(userId, false, (userId, updates) => {
            setBoltz(prev => prev.map(b => {
                if (b.user.id === userId) {
                    return {
                        ...b,
                        user: { ...b.user, ...updates }
                    };
                }
                return b;
            }));
        });
    };

    const handleOpenMusic = () => {
        const currentBoltz = boltz[currentIndex];
        if (currentBoltz.music) {
            setSelectedMusic(currentBoltz.music);
            setShowMusic(true);
        }
    };

    if (loading && boltz.length === 0) {
        return (
            <MainLayout>
                <div className={styles.loading}>
                    <LoadingSpinner size="lg" />
                </div>
            </MainLayout>
        );
    }

    if (!loading && boltz.length === 0) {
        return (
            <MainLayout>
                <BoltzEmptyState />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <BoltzTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className={styles.container} ref={containerRef}>
                <div className={styles.carousel}>
                    {boltz.map((boltzItem, index) => (
                        <BoltzPlayer
                            key={boltzItem.id}
                            boltz={boltzItem}
                            isActive={index === currentIndex}
                            playing={playing && index === currentIndex}
                            muted={muted}
                            onTogglePlay={() => setPlaying(!playing)}
                            onToggleMute={() => setMuted(!muted)}
                            onLike={handleLike}
                            onComment={() => setShowComments(true)}
                            onShare={handleShare}
                            onSave={handleSave}
                            onFollow={handleFollow}
                            onOpenOptions={() => setShowOptions(true)}
                            onOpenMusic={handleOpenMusic}
                            showHeartAnimation={showHeartAnimation && index === currentIndex}
                            videoRef={setVideoRef(index)}
                            currentUserId={user?.id}
                        />
                    ))}
                </div>

                {showComments && (
                    <BoltzCommentsSheet
                        boltzId={boltz[currentIndex]?.id}
                        onClose={() => setShowComments(false)}
                        onCommentCountChange={(count) => handleUpdateBoltz(boltz[currentIndex].id, { comments_count: count })}
                    />
                )}

                {console.log('showShare state:', showShare, 'currentBoltz:', boltz[currentIndex]?.id)}
                {showShare && boltz[currentIndex] && (
                    <>
                        {console.log('Rendering ShareModal NOW with item:', boltz[currentIndex])}
                        <ShareModal
                            item={boltz[currentIndex]}
                            type="boltz"
                            onClose={() => {
                                console.log('ShareModal closing');
                                setShowShare(false);
                            }}
                        />
                    </>
                )}

                {showOptions && (
                    <BoltzOptionsModal
                        boltzId={boltz[currentIndex]?.id}
                        boltzData={boltz[currentIndex]}
                        isOwn={false}
                        onClose={() => setShowOptions(false)}
                    />
                )}

                {showMusic && selectedMusic && (
                    <MusicPageModal
                        music={selectedMusic}
                        onClose={() => setShowMusic(false)}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default Boltz;
