import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import styles from './Boltz.module.css';
import BoltzTabs from '../../components/boltz/BoltzTabs';
import BoltzPlayer from '../../components/boltz/BoltzPlayer';
import BoltzEmptyState from '../../components/boltz/BoltzEmptyState';
import BoltzReactionPicker from '../../components/boltz/BoltzReactionPicker';
import BoltzSessionAwareness from '../../components/boltz/BoltzSessionAwareness';
import BoltzCommentsSheet from '../../components/modals/BoltzCommentsSheet';
import ShareModal from '../../components/modals/ShareModal';
import BoltzOptionsModal from '../../components/modals/BoltzOptionsModal';
import MusicPageModal from '../../components/modals/MusicPageModal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { useBoltzFeed } from '../../hooks/useBoltzFeed';
import { useBoltzIntersection } from '../../hooks/useBoltzIntersection';
import { useBoltzReactions } from '../../hooks/useBoltzReactions';
import { useBoltzSession } from '../../hooks/useBoltzSession';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';
import { useLike } from '../../hooks/useLike';
import { useSave } from '../../hooks/useSave';
import { useFollow } from '../../hooks/useFollow';
import { useFocusIdentity } from '../../context/FocusIdentityContext';
import { useInteractions } from '../../hooks/useInteractions';

const Boltz = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('foryou');
    const [playing, setPlaying] = useState(true);
    const [muted, setMuted] = useState(true);

    // Modals
    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showMusic, setShowMusic] = useState(false);
    const [selectedMusic, setSelectedMusic] = useState(null);

    // Core hooks
    const { boltz, loading, initialLoading, hasMore, loadMore, setBoltz } = useBoltzFeed(activeTab);
    const { toggleLike, showHeartAnimation } = useLike();
    const { toggleSave } = useSave();
    const { toggleFollow } = useFollow();
    const { userId } = useFocusIdentity();

    // Session tracking
    const {
        sessionMinutes,
        videosWatched,
        breakSuggestion,
        showBreak,
        trackVideoWatched,
        dismissBreak,
        takeBreak,
        sessionContext,
    } = useBoltzSession();

    // IntersectionObserver engine
    const {
        registerRef,
        activeIndex,
        shouldPreload,
        shouldRelease,
    } = useBoltzIntersection(boltz.length, (newIndex) => {
        // Load more when approaching end
        if (newIndex > boltz.length - 5 && hasMore && !initialLoading && !loading) {
            loadMore();
        }

        // Track video watched for session awareness
        trackVideoWatched();

        // Deep-link support
        if (id && boltz.length > 0) {
            const targetIdx = boltz.findIndex(b => b.id === id);
            if (targetIdx !== -1 && targetIdx !== newIndex) {
                const el = document.getElementById(`boltz-card-${targetIdx}`);
                el?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });

    // Reactions for active boltz
    const activeBoltz = boltz[activeIndex];
    const {
        reactions: boltzReactions,
        userReaction,
        showPicker: showReactionPicker,
        setShowPicker: setShowReactionPicker,
        sendReaction,
        floatingReactions,
    } = useBoltzReactions(activeBoltz?.id);

    const { registerShare } = useInteractions(activeBoltz?.id, 'boltz');

    const containerRef = useSwipeNavigation(
        () => {},
        () => {},
        !showComments && !showShare && !showOptions && !showMusic && !showReactionPicker
    );

    // ── Keyboard Shortcuts ──────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showComments || showShare || showOptions) return;
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    setPlaying(p => !p);
                    break;
                case 'm':
                case 'M':
                    setMuted(m => !m);
                    break;
                case 'l':
                case 'L':
                    handleLike();
                    break;
                default:
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showComments, showShare, showOptions, activeIndex, boltz]);

    // ── Handlers ────────────────────────────────────────
    const handleUpdateBoltz = useCallback((boltzId, updates) => {
        setBoltz(prev => prev.map(b => {
            if (b.id !== boltzId) return b;
            return {
                ...b,
                ...updates,
                likes_count: updates.likes_count_delta !== undefined
                    ? b.likes_count + updates.likes_count_delta
                    : (updates.likes_count ?? b.likes_count),
                saves_count: updates.saves_count_delta !== undefined
                    ? b.saves_count + updates.saves_count_delta
                    : (updates.saves_count ?? b.saves_count),
            };
        }));
    }, [setBoltz]);

    const handleLike = useCallback(() => {
        const curr = boltz[activeIndex];
        if (!curr) return;
        toggleLike(curr.id, curr.is_liked, 'boltz', handleUpdateBoltz);
    }, [boltz, activeIndex, toggleLike, handleUpdateBoltz]);

    const handleSave = useCallback(() => {
        const curr = boltz[activeIndex];
        if (!curr) return;
        toggleSave(curr.id, curr.is_saved, 'boltz', handleUpdateBoltz);
    }, [boltz, activeIndex, toggleSave, handleUpdateBoltz]);

    const handleShareConfirmed = useCallback(async () => {
        const curr = boltz[activeIndex];
        if (!curr?.id || !userId) return;
        await registerShare({ shareType: 'share' }, (shareId, updates) => {
            handleUpdateBoltz(shareId, updates);
        });
    }, [boltz, activeIndex, userId, registerShare, handleUpdateBoltz]);

    const handleFollow = useCallback((targetUserId) => {
        toggleFollow(targetUserId, false, (uId, updates) => {
            setBoltz(prev => prev.map(b => {
                const profileObj = b.profiles || b.user;
                if (profileObj?.id === uId) {
                    return { ...b, profiles: { ...profileObj, ...updates }, user: { ...profileObj, ...updates } };
                }
                return b;
            }));
        });
    }, [toggleFollow, setBoltz]);

    const handleOpenMusic = useCallback(() => {
        const curr = boltz[activeIndex];
        if (curr?.music) {
            setSelectedMusic(curr.music);
            setShowMusic(true);
        }
    }, [boltz, activeIndex]);

    // Deep-link comment opening
    useEffect(() => {
        if (!location.state?.openComments || !id || boltz.length === 0) return;
        const targetIdx = boltz.findIndex((item) => item.id === id);
        if (targetIdx === activeIndex && boltz[activeIndex]?.id) {
            setShowComments(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, id, boltz, activeIndex, navigate]);

    // ── Loading / Empty states ───────────────────────────
    if (loading && boltz.length === 0) {
        return (
            <MainLayout>
                <div className={styles.loading}>
                    <div className={styles.loadingOrb} />
                    <LoadingSpinner size="lg" />
                </div>
            </MainLayout>
        );
    }

    if (!loading && (!boltz || boltz.length === 0)) {
        return (
            <MainLayout>
                <BoltzEmptyState />
            </MainLayout>
        );
    }

    // ── Render ───────────────────────────────────────────
    const anyModalOpen = showComments || showShare || showOptions || showMusic;

    return (
        <MainLayout>
            <BoltzTabs activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

            <div className={styles.container} ref={containerRef}>
                <div className={styles.carousel}>
                    {boltz.map((boltzItem, index) => (
                        <div
                            key={boltzItem.id}
                            id={`boltz-card-${index}`}
                            ref={el => registerRef(el, index)}
                            className={styles.cardWrapper}
                        >
                            <BoltzPlayer
                                boltz={boltzItem}
                                isActive={index === activeIndex}
                                playing={playing && index === activeIndex && !anyModalOpen}
                                muted={muted}
                                preload={shouldPreload(index) ? 'auto' : 'none'}
                                released={shouldRelease(index)}
                                onTogglePlay={() => setPlaying(p => !p)}
                                onToggleMute={() => setMuted(m => !m)}
                                onLike={handleLike}
                                onComment={() => setShowComments(true)}
                                onShare={() => setShowShare(true)}
                                onSave={handleSave}
                                onFollow={handleFollow}
                                onOpenOptions={() => setShowOptions(true)}
                                onOpenMusic={handleOpenMusic}
                                showHeartAnimation={showHeartAnimation && index === activeIndex}
                                currentUserId={userId}
                                floatingReactions={index === activeIndex ? floatingReactions : []}
                                onReaction={sendReaction}
                                showReactionPicker={showReactionPicker && index === activeIndex}
                                onToggleReactionPicker={() => setShowReactionPicker(p => !p)}
                                boltzReactions={index === activeIndex ? boltzReactions : {}}
                                userReaction={index === activeIndex ? userReaction : null}
                            />
                        </div>
                    ))}
                </div>

                {/* Reaction Picker */}
                {showReactionPicker && (
                    <BoltzReactionPicker
                        onSelect={sendReaction}
                        onClose={() => setShowReactionPicker(false)}
                        activeReaction={userReaction}
                    />
                )}

                {/* Session Awareness */}
                {showBreak && (
                    <BoltzSessionAwareness
                        suggestion={breakSuggestion}
                        onDismiss={dismissBreak}
                        onTakeBreak={takeBreak}
                        sessionMinutes={sessionMinutes}
                        videosWatched={videosWatched}
                    />
                )}

                {/* Modals */}
                {showComments && (
                    <BoltzCommentsSheet
                        boltzId={activeBoltz?.id}
                        onClose={() => setShowComments(false)}
                        onCommentCountChange={(count) =>
                            handleUpdateBoltz(activeBoltz.id, { comments_count: count })
                        }
                    />
                )}

                {showShare && activeBoltz && (
                    <ShareModal
                        item={activeBoltz}
                        type="boltz"
                        onShared={handleShareConfirmed}
                        onClose={() => setShowShare(false)}
                    />
                )}

                {showOptions && (
                    <BoltzOptionsModal
                        boltzId={activeBoltz?.id}
                        boltzData={activeBoltz}
                        isOwn={activeBoltz?.user_id === userId}
                        onClose={() => setShowOptions(false)}
                    />
                )}

                {showMusic && selectedMusic && (
                    <MusicPageModal
                        music={selectedMusic}
                        onClose={() => setShowMusic(false)}
                    />
                )}

                {/* Session Timer (subtle) */}
                {sessionMinutes > 5 && (
                    <div className={styles.sessionTimer}>
                        {Math.floor(sessionMinutes)}m
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Boltz;
