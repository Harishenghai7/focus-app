import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import FlashComments from '../comments/FlashComments';
import ShareModal from '../posts/ShareModal';
import FlashOptionsModal from './FlashOptionsModal';
import ReportModal from '../report/ReportModal';
import InteractionBar from '../shared/InteractionBar';
import SovereignCommentSheet from '../comments/SovereignCommentSheet';
import { 
    X, 
    MoreHorizontal, 
    Volume2, 
    VolumeX, 
    ChevronLeft,
    ChevronRight,
    Shield,
    MessageCircle
} from 'lucide-react'; 
import styles from './FlashViewer.module.css';

// ═══════════════════════════════════════════════════════════════════════════
// FLASH VIEWER — Sovereign Ephemerality | H2 Universal Theme
// Full-screen immersive viewer with 10s progress bar, swipe gestures
// ═══════════════════════════════════════════════════════════════════════════

const STORY_DURATION = 10000; // 10 seconds per story
const PROGRESS_UPDATE_INTERVAL = 50; // Update every 50ms for smooth animation
const SWIPE_THRESHOLD = 100; // Minimum swipe distance to trigger

const FlashViewer = ({ isOpen, onClose, storyGroup, allGroups = [], onNavigateGroup }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const controls = useAnimation();

    // ─────────────────────────────────────────────────────────────────────
    // STATE MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [swipeDirection, setSwipeDirection] = useState(null);
    const [showUI, setShowUI] = useState(true);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showSovereignComments, setShowSovereignComments] = useState(false);

    // Refs
    const videoRef = useRef(null);
    const timerRef = useRef(null);
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const longPressTimer = useRef(null);
    const prefetchedRef = useRef(new Set());

    // ─────────────────────────────────────────────────────────────────────
    // DATA PROCESSING
    // ─────────────────────────────────────────────────────────────────────
    const stories = storyGroup?.stories || [];
    const currentGroupIndex = allGroups.findIndex(g => g.user?.id === storyGroup?.user?.id);
    const hasNextGroup = currentGroupIndex < allGroups.length - 1;
    const hasPrevGroup = currentGroupIndex > 0;

    const sortedStories = useMemo(() => {
        return [...stories].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    }, [stories]);

    const current = sortedStories[currentStoryIndex];

    // ─────────────────────────────────────────────────────────────────────
    // AGGRESSIVE PRE-FETCHING
    // ─────────────────────────────────────────────────────────────────────
    const prefetchStoryAsset = useCallback((story) => {
        if (!story?.media_url || prefetchedRef.current.has(story.media_url)) return;
        
        if (story.media_type === 'video') {
            const v = document.createElement('video');
            v.preload = 'metadata';
            v.src = story.media_url;
            const cleanup = () => {
                try {
                    v.pause();
                    v.removeAttribute('src');
                    v.load();
                } catch (_) {}
            };
            v.onloadedmetadata = cleanup;
            v.onerror = cleanup;
            v.load();
        } else {
            const img = new Image();
            img.src = story.media_url;
        }
        prefetchedRef.current.add(story.media_url);
    }, []);

    // Pre-fetch next stories
    useEffect(() => {
        // Pre-fetch next 2 stories in current group
        for (let i = 1; i <= 2; i++) {
            const nextStory = sortedStories[currentStoryIndex + i];
            if (nextStory) prefetchStoryAsset(nextStory);
        }

        // Pre-fetch first story of next group
        if (hasNextGroup) {
            const nextGroup = allGroups[currentGroupIndex + 1];
            if (nextGroup?.stories?.[0]) {
                prefetchStoryAsset(nextGroup.stories[0]);
            }
        }
    }, [currentStoryIndex, sortedStories, allGroups, currentGroupIndex, hasNextGroup, prefetchStoryAsset]);

    // ─────────────────────────────────────────────────────────────────────
    // RESET ON OPEN
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            setCurrentStoryIndex(0);
            setProgress(0);
            setIsPaused(false);
            setShowUI(true);
            setSwipeDirection(null);
            setShowOptions(false);
            setShowReport(false);
        }
    }, [isOpen, storyGroup]);

    useEffect(() => {
        if (!isOpen) return;

        return () => {
            try {
                if (timerRef.current) clearInterval(timerRef.current);
                if (longPressTimer.current) {
                    clearTimeout(longPressTimer.current);
                    longPressTimer.current = null;
                }

                if (videoRef.current) {
                    videoRef.current.pause();
                    videoRef.current.removeAttribute('src');
                    videoRef.current.load();
                }

                prefetchedRef.current = new Set();
            } catch (_) {}
        };
    }, [isOpen]);

    // ─────────────────────────────────────────────────────────────────────
    // PROGRESS TIMER (10 seconds per story)
    // ─────────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || isPaused || showComments || showShare || isReplying || !current) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const step = 100 / (STORY_DURATION / PROGRESS_UPDATE_INTERVAL);

        timerRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, PROGRESS_UPDATE_INTERVAL);

        return () => clearInterval(timerRef.current);
    }, [isOpen, isPaused, showComments, showShare, isReplying, currentStoryIndex, current]);

    // ─────────────────────────────────────────────────────────────────────
    // NAVIGATION HANDLERS
    // ─────────────────────────────────────────────────────────────────────
    const handleNext = useCallback(() => {
        if (currentStoryIndex < sortedStories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else if (hasNextGroup) {
            // Move to next user's stories
            onNavigateGroup?.('next');
        } else {
            onClose();
        }
    }, [currentStoryIndex, sortedStories.length, hasNextGroup, onNavigateGroup, onClose]);

    const handlePrev = useCallback(() => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        } else if (hasPrevGroup) {
            // Move to previous user's stories
            onNavigateGroup?.('prev');
        }
    }, [currentStoryIndex, hasPrevGroup, onNavigateGroup]);

    // ─────────────────────────────────────────────────────────────────────
    // GESTURE HANDLERS — Swipe & Long Press
    // ─────────────────────────────────────────────────────────────────────
    const handleTouchStart = useCallback((e) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
        
        // Long press to pause and hide UI
        longPressTimer.current = setTimeout(() => {
            setIsPaused(true);
            setShowUI(false);
        }, 500);
    }, []);

    const handleTouchMove = useCallback((e) => {
        // Clear long press timer on move
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleTouchEnd = useCallback((e) => {
        // Clear long press timer
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // Resume if was paused by long press
        if (isPaused && !showUI) {
            setIsPaused(false);
            setShowUI(true);
            return;
        }

        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;

        // Vertical swipe — Swipe down to close, swipe up to reply
        if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > SWIPE_THRESHOLD) {
            if (deltaY > 0) {
                // Swipe down — close viewer
                onClose();
            } else {
                // Swipe up — open reply
                setIsReplying(true);
                setIsPaused(true);
            }
            return;
        }

        // Horizontal swipe — navigate between groups
        if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
            if (deltaX > 0 && hasPrevGroup) {
                // Swipe right — previous group
                setSwipeDirection('right');
                onNavigateGroup?.('prev');
            } else if (deltaX < 0 && hasNextGroup) {
                // Swipe left — next group
                setSwipeDirection('left');
                onNavigateGroup?.('next');
            }
        }
    }, [isPaused, showUI, hasPrevGroup, hasNextGroup, onNavigateGroup, onClose]);

    // ─────────────────────────────────────────────────────────────────────
    // REPLY HANDLER
    // ─────────────────────────────────────────────────────────────────────
    const handleSendReply = useCallback(async () => {
        if (!replyText.trim() || !user) return;

        try {
            // Send reply via Sovereign Whisper system
            const { createFlashReply } = await import('../../services/flashService');
            await createFlashReply({
                flashId: current.id,
                recipientId: storyGroup.user.id,
                content: replyText.trim(),
                senderId: user.id
            });

            setReplyText('');
            setIsReplying(false);
            setIsPaused(false);
        } catch (error) {
            console.error('Failed to send reply:', error);
        }
    }, [replyText, current, storyGroup, user]);

    // ─────────────────────────────────────────────────────────────────────
    // SAFETY CHECK
    // ─────────────────────────────────────────────────────────────────────
    if (!storyGroup || !storyGroup.stories || !current) return null;

    const isVerified = storyGroup.user?.is_verified;
    const trustTier = storyGroup.user?.trust_tier;

    // ─────────────────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────────────────
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className={styles.sovereignOverlay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    {/* FULL-SCREEN IMMERSIVE BACKGROUND */}
                    {/* ═══════════════════════════════════════════════════════════════════ */}
                    <div className={styles.immersiveBackground}>
                        <div className={styles.auroraGlow} />
                    </div>

                    <motion.div 
                        className={styles.sovereignViewer}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.x > SWIPE_THRESHOLD && hasPrevGroup) {
                                onNavigateGroup?.('prev');
                            } else if (offset.x < -SWIPE_THRESHOLD && hasNextGroup) {
                                onNavigateGroup?.('next');
                            }
                        }}
                    >
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* SEGMENTED PROGRESS BAR — 10s per story */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div className={styles.progressContainer}>
                            {sortedStories.map((_, idx) => (
                                <div key={idx} className={styles.progressSegment}>
                                    <motion.div 
                                        className={styles.progressFill}
                                        initial={{ width: '0%' }}
                                        animate={{ 
                                            width: idx < currentStoryIndex 
                                                ? '100%' 
                                                : idx === currentStoryIndex 
                                                    ? `${progress}%` 
                                                    : '0%'
                                        }}
                                        transition={{ duration: 0.05, ease: 'linear' }}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* GLASSMORPHISM HEADER — blur(15px) glass strip */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <AnimatePresence>
                            {showUI && (
                                <motion.div 
                                    className={styles.sovereignHeader}
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                >
                                    <div className={styles.glassHeader}>
                                        {/* User Info */}
                                        <div 
                                            className={styles.userInfo}
                                            onClick={() => navigate(`/profile/${storyGroup.user.username}`)}
                                        >
                                            <div className={styles.avatarContainer}>
                                                <img 
                                                    src={storyGroup.user.avatar_url} 
                                                    className={styles.sovereignAvatar}
                                                    alt={storyGroup.user.username}
                                                />
                                                {/* Trust Shield Badge on avatar */}
                                                {isVerified && (
                                                    <div className={`${styles.headerShield} ${trustTier === 'gold' ? styles.shieldGold : styles.shieldPurple}`}>
                                                        <Shield size={10} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className={styles.userMeta}>
                                                <span className={styles.sovereignUsername}>
                                                    {storyGroup.user.username}
                                                    {isVerified && (
                                                        <span className={styles.verifiedBadge}>✓</span>
                                                    )}
                                                </span>
                                                <span className={styles.sovereignTime}>
                                                    {current.created_at && formatDistanceToNow(new Date(current.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Header Actions */}
                                        <div className={styles.headerActions}>
                                            <button 
                                                className={styles.iconButton}
                                                onClick={() => setIsMuted(!isMuted)}
                                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                                            >
                                                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                            </button>
                                            <button 
                                                className={styles.iconButton}
                                                onClick={onClose}
                                                aria-label="Close"
                                            >
                                                <X size={22} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* MEDIA CONTENT — Full screen with touch handling */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div
                            className={styles.mediaContainer}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            onMouseDown={() => setIsPaused(true)}
                            onMouseUp={() => setIsPaused(false)}
                            onMouseLeave={() => setIsPaused(false)}
                        >
                            {isBuffering && (
                                <div className={styles.bufferIndicator}>
                                    <div className={styles.bufferSpinner} />
                                </div>
                            )}

                            {current.media_type === 'video' ? (
                                <video
                                    ref={videoRef}
                                    src={current.media_url}
                                    className={styles.sovereignMedia}
                                    autoPlay
                                    muted={isMuted}
                                    playsInline
                                    loop={false}
                                    onEnded={handleNext}
                                    onWaiting={() => setIsBuffering(true)}
                                    onPlaying={() => setIsBuffering(false)}
                                    onError={(e) => {
                                        console.error('Video error:', e);
                                        handleNext();
                                    }}
                                />
                            ) : (
                                <motion.img
                                    src={current.media_url}
                                    className={styles.sovereignMedia}
                                    alt="Flash story"
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    onError={() => {
                                        console.error('Image failed to load');
                                        handleNext();
                                    }}
                                />
                            )}

                            {/* Pause Indicator */}
                            {isPaused && showUI && (
                                <motion.div 
                                    className={styles.pauseIndicator}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <div className={styles.pauseIcon}>⏸</div>
                                </motion.div>
                            )}
                        </div>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* TAP ZONES — Invisible touch areas */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <div className={styles.tapZones}>
                            <button 
                                className={styles.tapLeft} 
                                onClick={handlePrev}
                                aria-label="Previous story"
                            />
                            <button 
                                className={styles.tapCenter}
                                onClick={() => setIsPaused(prev => !prev)}
                                aria-label={isPaused ? 'Resume' : 'Pause'}
                            />
                            <button 
                                className={styles.tapRight} 
                                onClick={handleNext}
                                aria-label="Next story"
                            />
                        </div>

                        {/* Group Navigation Arrows */}
                        {showUI && (
                            <>
                                {hasPrevGroup && (
                                    <button 
                                        className={`${styles.navArrow} ${styles.navArrowLeft}`}
                                        onClick={() => onNavigateGroup?.('prev')}
                                        aria-label="Previous user"
                                    >
                                        <ChevronLeft size={28} />
                                    </button>
                                )}
                                {hasNextGroup && (
                                    <button 
                                        className={`${styles.navArrow} ${styles.navArrowRight}`}
                                        onClick={() => onNavigateGroup?.('next')}
                                        aria-label="Next user"
                                    >
                                        <ChevronRight size={28} />
                                    </button>
                                )}
                            </>
                        )}

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* BOTTOM ACTIONS — Glassmorphism strip */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <AnimatePresence>
                            {showUI && (
                                <motion.div 
                                    className={styles.sovereignFooter}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                >
                                    <div className={styles.glassFooter}>
                                        {/* Reply Input */}
                                        <button 
                                            className={styles.replyButton}
                                            onClick={() => {
                                                setIsReplying(true);
                                                setIsPaused(true);
                                            }}
                                        >
                                            <MessageCircle size={18} />
                                            <span>Reply to {storyGroup.user.username}...</span>
                                        </button>

                                        {/* Action Buttons */}
                                        <InteractionBar
                                            item={current}
                                            type="flash"
                                            onCommentsClick={() => {
                                                setShowSovereignComments(true);
                                                setIsPaused(true);
                                            }}
                                        />
                                        <button 
                                            className={styles.actionIcon}
                                            onClick={() => {
                                                setShowOptions(true);
                                                setIsPaused(true);
                                            }}
                                            aria-label="More options"
                                        >
                                            <MoreHorizontal size={22} />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* SWIPE UP REPLY MODAL */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        <AnimatePresence>
                            {isReplying && (
                                <motion.div 
                                    className={styles.replyModal}
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0 }}
                                    exit={{ y: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                >
                                    <div className={styles.replyContent}>
                                        <div className={styles.replyHandle} />
                                        <h3 className={styles.replyTitle}>
                                            Reply to {storyGroup.user.username}
                                        </h3>
                                        <div className={styles.replyInputContainer}>
                                            <input
                                                type="text"
                                                className={styles.replyInput}
                                                placeholder="Send a message..."
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                autoFocus
                                            />
                                            <button 
                                                className={styles.sendButton}
                                                onClick={handleSendReply}
                                                disabled={!replyText.trim()}
                                            >
                                                <Send size={20} />
                                            </button>
                                        </div>
                                        <button 
                                            className={styles.cancelReply}
                                            onClick={() => {
                                                setIsReplying(false);
                                                setIsPaused(false);
                                                setReplyText('');
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {/* MODALS */}
                        {/* ═══════════════════════════════════════════════════════════════ */}
                        {showComments && (
                            <FlashComments 
                                flashId={current.id}
                                onClose={() => {
                                    setShowComments(false);
                                    setIsPaused(false);
                                }} 
                            />
                        )}
                        
                        {showShare && (
                            <ShareModal 
                                item={current}
                                type="flash" 
                                onClose={() => {
                                    setShowShare(false);
                                    setIsPaused(false);
                                }} 
                            />
                        )}

                        {showOptions && (
                            <FlashOptionsModal
                                flash={current}
                                isOwn={current?.user_id === user?.id}
                                onReport={() => {
                                    setShowOptions(false);
                                    setShowReport(true);
                                }}
                                onClose={() => {
                                    setShowOptions(false);
                                    setIsPaused(false);
                                }}
                            />
                        )}

                        {showReport && (
                            <ReportModal
                                isOpen={showReport}
                                onClose={() => {
                                    setShowReport(false);
                                    setIsPaused(false);
                                }}
                                contentData={{
                                    contentId: current?.id,
                                    userId: current?.user_id || current?.profiles?.id || current?.user?.id,
                                    type: 'flash'
                                }}
                            />
                        )}

                        <SovereignCommentSheet
                            isOpen={showSovereignComments}
                            onClose={() => {
                                setShowSovereignComments(false);
                                setIsPaused(false);
                            }}
                            targetId={current?.id}
                            targetType="flash"
                        />
                    </motion.div>

                    {/* Swipe Hint Overlay */}
                    {showUI && (
                        <div className={styles.swipeHints}>
                            <span className={styles.swipeHintLeft}>← Swipe for previous</span>
                            <span className={styles.swipeHintCenter}>↓ Swipe down to close</span>
                            <span className={styles.swipeHintRight}>Swipe for next →</span>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default FlashViewer;