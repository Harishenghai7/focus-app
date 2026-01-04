import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import Modal from '../ui/Modal';
import Avatar from '../shared/Avatar';
import Icon from '../ui/Icon';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import styles from './HighlightsViewerModal.module.css';

const HighlightsViewerModal = ({ isOpen, onClose, highlight, allHighlights = [], onHighlightChange }) => {
    const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const videoRef = useRef(null);
    const progressIntervalRef = useRef(null);

    const currentHighlight = allHighlights[currentHighlightIndex] || highlight;
    const stories = currentHighlight?.stories || [];
    const currentStory = stories[currentStoryIndex];
    const storyDuration = currentStory?.duration || 5000; // Default 5 seconds

    useEffect(() => {
        if (highlight && allHighlights.length > 0) {
            const index = allHighlights.findIndex(h => h.id === highlight.id);
            if (index !== -1) {
                setCurrentHighlightIndex(index);
            }
        }
    }, [highlight, allHighlights]);

    useEffect(() => {
        if (isOpen && !isPaused) {
            startProgress();
        } else {
            stopProgress();
        }

        return () => stopProgress();
    }, [isOpen, currentStoryIndex, isPaused]);

    const startProgress = () => {
        stopProgress();
        setProgress(0);

        const interval = 50; // Update every 50ms
        const increment = (interval / storyDuration) * 100;

        progressIntervalRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + increment;
            });
        }, interval);
    };

    const stopProgress = () => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    };

    const handleNext = () => {
        if (currentStoryIndex < stories.length - 1) {
            // Next story in current highlight
            setCurrentStoryIndex(currentStoryIndex + 1);
            setProgress(0);
        } else if (currentHighlightIndex < allHighlights.length - 1) {
            // Next highlight
            setCurrentHighlightIndex(currentHighlightIndex + 1);
            setCurrentStoryIndex(0);
            setProgress(0);
            if (onHighlightChange) {
                onHighlightChange(allHighlights[currentHighlightIndex + 1]);
            }
        } else {
            // End of all highlights
            onClose();
        }
    };

    const handlePrevious = () => {
        if (currentStoryIndex > 0) {
            // Previous story in current highlight
            setCurrentStoryIndex(currentStoryIndex - 1);
            setProgress(0);
        } else if (currentHighlightIndex > 0) {
            // Previous highlight
            const prevHighlight = allHighlights[currentHighlightIndex - 1];
            setCurrentHighlightIndex(currentHighlightIndex - 1);
            setCurrentStoryIndex(prevHighlight.stories.length - 1);
            setProgress(0);
            if (onHighlightChange) {
                onHighlightChange(prevHighlight);
            }
        }
    };

    const handleTap = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        if (x < width / 3) {
            handlePrevious();
        } else if (x > (width * 2) / 3) {
            handleNext();
        } else {
            setIsPaused(!isPaused);
        }
    };

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const swipeHandlers = useSwipeable({
        onSwipedLeft: handleNext,
        onSwipedRight: handlePrevious,
        onSwipedDown: onClose,
        preventScrollOnSwipe: true,
        trackMouse: false
    });

    if (!currentHighlight || !currentStory) {
        return null;
    }

    const isVideo = currentStory.media_type === 'video';

    return (
        <Modal isOpen={isOpen} onClose={onClose} className={styles.modal}>
            <div className={styles.content} {...swipeHandlers}>
                {/* Progress Bars */}
                <div className={styles.progressBars}>
                    {stories.map((_, index) => (
                        <div key={index} className={styles.progressBarContainer}>
                            <div
                                className={styles.progressBar}
                                style={{
                                    width: index < currentStoryIndex
                                        ? '100%'
                                        : index === currentStoryIndex
                                            ? `${progress}%`
                                            : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.userInfo}>
                        <Avatar
                            src={currentHighlight.user?.avatar_url}
                            alt={currentHighlight.user?.username}
                            size="sm"
                        />
                        <div className={styles.userDetails}>
                            <div className={styles.username}>
                                {currentHighlight.user?.username}
                            </div>
                            <div className={styles.timestamp}>
                                {formatTimeAgo(currentStory.created_at)}
                            </div>
                        </div>
                    </div>

                    <div className={styles.headerActions}>
                        {isVideo && (
                            <button
                                className={styles.headerBtn}
                                onClick={handleMuteToggle}
                                aria-label={isMuted ? 'Unmute' : 'Mute'}
                            >
                                <Icon name={isMuted ? 'VolumeX' : 'Volume2'} size={20} />
                            </button>
                        )}
                        <button
                            className={styles.headerBtn}
                            onClick={onClose}
                            aria-label="Close"
                        >
                            <Icon name="X" size={20} />
                        </button>
                    </div>
                </div>

                {/* Story Content */}
                <div className={styles.storyContainer} onClick={handleTap}>
                    {isVideo ? (
                        <video
                            ref={videoRef}
                            src={currentStory.media_url}
                            className={styles.media}
                            autoPlay
                            loop={false}
                            playsInline
                            muted={isMuted}
                            onEnded={handleNext}
                        />
                    ) : (
                        <img
                            src={currentStory.media_url}
                            alt="Story"
                            className={styles.media}
                        />
                    )}

                    {/* Pause Indicator */}
                    {isPaused && (
                        <div className={styles.pauseIndicator}>
                            <Icon name="Pause" size={48} />
                        </div>
                    )}

                    {/* Tap Zones (visual feedback) */}
                    <div className={styles.tapZones}>
                        <div className={styles.tapZone} />
                        <div className={styles.tapZone} />
                        <div className={styles.tapZone} />
                    </div>
                </div>

                {/* Navigation Hints */}
                <div className={styles.navHints}>
                    <div className={styles.navHint}>
                        <Icon name="ChevronLeft" size={16} />
                        <span>Tap left</span>
                    </div>
                    <div className={styles.navHint}>
                        <Icon name="ChevronDown" size={16} />
                        <span>Swipe down to close</span>
                    </div>
                    <div className={styles.navHint}>
                        <span>Tap right</span>
                        <Icon name="ChevronRight" size={16} />
                    </div>
                </div>

                {/* Story Info */}
                {currentStory.caption && (
                    <div className={styles.caption}>
                        {currentStory.caption}
                    </div>
                )}

                {/* Highlight Title */}
                <div className={styles.highlightTitle}>
                    {currentHighlight.title}
                </div>
            </div>
        </Modal>
    );
};

export default HighlightsViewerModal;
