// FlashViewer - Instagram Stories Pro-Grade
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import FlashComments from '../comments/FlashComments';
import FlashInsights from './FlashInsights';
import ShareModal from '../posts/ShareModal';
import styles from './FlashViewer.module.css';

const FlashViewer = ({ isOpen, onClose, storyGroup, allStoryGroups = [], currentGroupIndex = 0 }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [currentGroupIdx, setCurrentGroupIdx] = useState(currentGroupIndex);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showInsights, setShowInsights] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const videoRef = useRef(null);
    const timerRef = useRef(null);
    const touchStartRef = useRef(null);

    const currentGroup = allStoryGroups[currentGroupIdx] || storyGroup;
    const currentStory = currentGroup?.stories?.[currentStoryIndex];
    const isOwner = user?.id === currentGroup?.user?.id;
    const STORY_DURATION = 5000; // 5 seconds

    // Reset on open
    useEffect(() => {
        if (!isOpen) return;
        setCurrentStoryIndex(0);
        setCurrentGroupIdx(currentGroupIndex);
        setProgress(0);
        setShowComments(false);
        setShowOptions(false);
    }, [isOpen, currentGroupIndex]);

    // Auto-progress timer
    useEffect(() => {
        if (!isOpen || isPaused || showComments || !currentStory) return;

        const increment = 100 / (STORY_DURATION / 50);

        timerRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + increment;
            });
        }, 50);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isOpen, isPaused, showComments, currentStoryIndex, currentGroupIdx]);

    // Video handling
    useEffect(() => {
        if (videoRef.current) {
            if (isPaused || showComments) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(() => { });
            }
        }
    }, [isPaused, showComments]);

    const handleNext = () => {
        if (currentStoryIndex < currentGroup.stories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else if (currentGroupIdx < allStoryGroups.length - 1) {
            // Next story group
            setCurrentGroupIdx(prev => prev + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrevious = () => {
        if (progress > 10 || currentStoryIndex === 0) {
            // Restart current story
            setProgress(0);
        } else {
            // Previous story
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const handlePreviousGroup = () => {
        if (currentGroupIdx > 0) {
            setCurrentGroupIdx(prev => prev - 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        }
    };

    const handleNextGroup = () => {
        if (currentGroupIdx < allStoryGroups.length - 1) {
            setCurrentGroupIdx(prev => prev + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
        } else {
            onClose();
        }
    };

    // Touch handlers for mobile
    const handleTouchStart = (e) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
    };

    const handleTouchEnd = (e) => {
        if (!touchStartRef.current) return;

        const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY,
            time: Date.now()
        };

        const deltaX = touchEnd.x - touchStartRef.current.x;
        const deltaY = touchEnd.y - touchStartRef.current.y;
        const deltaTime = touchEnd.time - touchStartRef.current.time;

        // Swipe detection
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
            if (deltaX > 0) {
                // Swipe right - previous group
                handlePreviousGroup();
            } else {
                // Swipe left - next group
                handleNextGroup();
            }
        } else if (deltaTime < 200) {
            // Quick tap
            const tapX = touchEnd.x / window.innerWidth;
            if (tapX < 0.3) {
                handlePrevious();
            } else if (tapX > 0.7) {
                handleNext();
            }
        }

        touchStartRef.current = null;
    };

    const handleLongPress = () => {
        setIsPaused(true);
    };

    const handleLongPressEnd = () => {
        setIsPaused(false);
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this flash?')) return;

        // TODO: Implement delete API
        toast.success('Flash deleted');
        handleNext();
    };

    const handleViewers = () => {
        setShowInsights(true);
        setShowOptions(false);
    };

    if (!currentGroup || !currentStory) return null;

    const timeAgo = formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true });

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`}>
            <div
                className={styles.viewer}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleLongPress}
                onMouseUp={handleLongPressEnd}
                onMouseLeave={handleLongPressEnd}
            >
                {/* Progress Bars */}
                <div className={styles.progressBars}>
                    {currentGroup.stories.map((_, idx) => (
                        <div key={idx} className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{
                                    width: idx < currentStoryIndex ? '100%'
                                        : idx === currentStoryIndex ? `${progress}%`
                                            : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.userInfo} onClick={() => {
                        navigate(`/profile/${currentGroup.user.username}`);
                        onClose();
                    }}>
                        <img
                            src={currentGroup.user.avatar_url || '/default-avatar.png'}
                            alt={currentGroup.user.username}
                            className={styles.avatar}
                        />
                        <div className={styles.userDetails}>
                            <span className={styles.username}>
                                {currentGroup.user.username}
                                {currentGroup.user.verified && <span className={styles.verified}>✓</span>}
                            </span>
                            <span className={styles.time}>{timeAgo}</span>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        {isPaused && <span className={styles.pausedIndicator}>⏸</span>}

                        {currentStory.media_type === 'video' && (
                            <button
                                className={styles.iconBtn}
                                onClick={() => {
                                    setIsMuted(!isMuted);
                                    if (videoRef.current) videoRef.current.muted = !isMuted;
                                }}
                            >
                                {isMuted ? '🔇' : '🔊'}
                            </button>
                        )}

                        {isOwner && (
                            <button
                                className={styles.iconBtn}
                                onClick={() => setShowOptions(!showOptions)}
                            >
                                ⋯
                            </button>
                        )}

                        <button className={styles.iconBtn} onClick={onClose}>
                            ✕
                        </button>
                    </div>

                    {/* Options Menu */}
                    {showOptions && isOwner && (
                        <div className={styles.optionsMenu}>
                            <button onClick={handleDelete}>
                                🗑️ Delete Flash
                            </button>
                            <button onClick={handleViewers}>
                                👁️ View Insights
                            </button>
                        </div>
                    )}
                </div>

                {/* Media */}
                <div className={styles.mediaContainer}>
                    {currentStory.media_type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={currentStory.media_url}
                            className={styles.media}
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                        />
                    ) : (
                        <img
                            src={currentStory.media_url}
                            alt="Flash"
                            className={styles.media}
                        />
                    )}
                </div>

                {/* Tap Areas for Navigation */}
                <div className={styles.tapAreas}>
                    <div
                        className={styles.tapLeft}
                        onClick={handlePrevious}
                    />
                    <div
                        className={styles.tapRight}
                        onClick={handleNext}
                    />
                </div>

                {/* Bottom Actions */}
                <div className={styles.bottomActions}>
                    <button
                        className={styles.actionBtn}
                        onClick={() => setShowComments(!showComments)}
                    >
                        💬 Reply
                    </button>

                    <button
                        className={styles.actionBtn}
                        onClick={() => setShowShareModal(true)}
                    >
                        ➤ Share
                    </button>
                </div>

                {/* Comments Overlay */}
                {showComments && (
                    <FlashComments
                        flashId={currentStory.id}
                        flashOwnerId={currentGroup.user.id}
                        onClose={() => setShowComments(false)}
                    />
                )}

                {/* Share Modal */}
                {showShareModal && (
                    <ShareModal
                        post={currentStory}
                        type="flash"
                        onClose={() => setShowShareModal(false)}
                    />
                )}

                {/* Navigation Buttons */}
                {allStoryGroups.length > 1 && (
                    <>
                        {currentGroupIdx > 0 && (
                            <button
                                className={styles.navBtn + ' ' + styles.navPrev}
                                onClick={handlePreviousGroup}
                                title="Previous story"
                            >
                                ‹
                            </button>
                        )}
                        {currentGroupIdx < allStoryGroups.length - 1 && (
                            <button
                                className={styles.navBtn + ' ' + styles.navNext}
                                onClick={handleNextGroup}
                                title="Next story"
                            >
                                ›
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Insights Modal */}
            {showInsights && (
                <FlashInsights
                    flashId={currentStory.id}
                    onClose={() => setShowInsights(false)}
                />
            )}
        </div>
    );
};

export default FlashViewer;
