import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import FlashComments from '../comments/FlashComments';
import ShareModal from '../posts/ShareModal';
import { X, MoreHorizontal, Volume2, VolumeX } from 'lucide-react'; 
import styles from './FlashViewer.module.css';

const FlashViewer = ({ isOpen, onClose, storyGroup }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // --- 1. HOOKS (MUST BE AT THE TOP) ---
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [showShare, setShowShare] = useState(false);

    const videoRef = useRef(null);
    const timerRef = useRef(null);

    // Safe Data Extraction (Default to empty to prevent crashes)
    const stories = storyGroup?.stories || [];
    const currentStory = stories[currentStoryIndex];
    const imageDurationMs = 5000;
    const [activeDurationMs, setActiveDurationMs] = useState(imageDurationMs);
    const prefetchedRef = useRef(new Set());
    const sortedStories = useMemo(
        () => [...stories].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)),
        [stories]
    );
    const current = sortedStories[currentStoryIndex];

    // --- 2. EFFECTS ---
    
    // Reset when opening a new group
    useEffect(() => {
        if (isOpen) {
            setCurrentStoryIndex(0);
            setProgress(0);
            setIsPaused(false);
            setActiveDurationMs(imageDurationMs);
        }
    }, [isOpen, storyGroup]);

    const prefetchStoryAsset = useCallback((story) => {
        if (!story?.media_url || prefetchedRef.current.has(story.media_url)) return;
        if (story.media_type === 'video') {
            const v = document.createElement('video');
            v.preload = 'metadata';
            v.src = story.media_url;
        } else {
            const img = new Image();
            img.src = story.media_url;
        }
        prefetchedRef.current.add(story.media_url);
    }, []);

    useEffect(() => {
        const next = sortedStories[currentStoryIndex + 1];
        const prev = sortedStories[currentStoryIndex - 1];
        prefetchStoryAsset(next);
        prefetchStoryAsset(prev);
    }, [currentStoryIndex, sortedStories, prefetchStoryAsset]);

    const handleNext = useCallback(() => {
        if (currentStoryIndex < sortedStories.length - 1) {
            setCurrentStoryIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onClose();
        }
    }, [currentStoryIndex, sortedStories.length, onClose]);

    const handlePrev = useCallback(() => {
        if (currentStoryIndex > 0) {
            setCurrentStoryIndex(prev => prev - 1);
            setProgress(0);
        } else {
            setProgress(0);
        }
    }, [currentStoryIndex]);

    useEffect(() => {
        if (!isOpen || isPaused || showComments || showShare || !current) return;
        const step = 100 / (activeDurationMs / 50);

        timerRef.current = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    handleNext();
                    return 0;
                }
                return prev + step;
            });
        }, 50);

        return () => clearInterval(timerRef.current);
    }, [isOpen, isPaused, showComments, showShare, currentStoryIndex, current, activeDurationMs, handleNext]);

    // --- 4. SAFETY CHECK (ONLY RETURN NULL HERE) ---
    if (!storyGroup || !storyGroup.stories || !current) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`}>
            <div className={styles.viewer}>
                
                {/* --- PROGRESS BARS --- */}
                <div className={styles.progressBars}>
                    {sortedStories.map((_, idx) => (
                        <div key={idx} className={styles.progressBar}>
                            <div 
                                className={styles.progressFill}
                                style={{
                                    width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* --- HEADER --- */}
                <div className={styles.header}>
                    <div className={styles.userInfo} onClick={() => navigate(`/profile/${storyGroup.user.username}`)}>
                        <img src={storyGroup.user.avatar_url} className={styles.avatar} alt="User" />
                        <span className={styles.username}>{storyGroup.user.username}</span>
                        <span className={styles.time}>
                            {current.created_at && formatDistanceToNow(new Date(current.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    
                    <div className={styles.headerActions}>
                        <button onClick={() => setIsMuted(!isMuted)}>
                            {isMuted ? <VolumeX color="white" /> : <Volume2 color="white" />}
                        </button>
                        <button onClick={onClose}><X color="white" /></button>
                    </div>
                </div>

                {/* --- MEDIA CONTENT --- */}
                <div
                    className={styles.mediaContainer}
                    onMouseDown={() => setIsPaused(true)}
                    onMouseUp={() => setIsPaused(false)}
                    onTouchStart={() => setIsPaused(true)}
                    onTouchEnd={() => setIsPaused(false)}
                >
                    {current.media_type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={current.media_url}
                            className={styles.media}
                            autoPlay
                            muted={isMuted}
                            playsInline
                            onEnded={handleNext}
                            onLoadedMetadata={(e) => {
                                const durationMs = Number.isFinite(e.currentTarget.duration)
                                    ? Math.max(1500, e.currentTarget.duration * 1000)
                                    : imageDurationMs;
                                setActiveDurationMs(durationMs);
                            }}
                        />
                    ) : (
                        <img
                            src={current.media_url}
                            className={styles.media}
                            alt="Story"
                            loading="lazy"
                            onLoad={() => setActiveDurationMs(imageDurationMs)}
                        />
                    )}
                </div>

                {/* --- TAP ZONES --- */}
                <div className={styles.tapAreas}>
                    <button className={styles.tapLeft} onClick={handlePrev} aria-label="Previous story segment" />
                    <button
                        className={styles.tapCenter}
                        onClick={() => setIsPaused((prev) => !prev)}
                        aria-label={isPaused ? 'Resume story' : 'Pause story'}
                    />
                    <button className={styles.tapRight} onClick={handleNext} aria-label="Next story segment" />
                </div>

                {/* --- FOOTER ACTIONS --- */}
                <div className={styles.bottomActions}>
                     <div className={styles.actionBtn} onClick={() => setShowComments(true)}>
                        Send Message...
                     </div>
                     <button className={styles.actionBtn} onClick={() => setShowShare(true)}><MoreHorizontal color="white" /></button>
                </div>

                {/* --- MODALS --- */}
                {showComments && (
                    <FlashComments 
                        flashId={current.id}
                        onClose={() => setShowComments(false)} 
                    />
                )}
                {showShare && (
                    <ShareModal 
                        item={current}
                        type="flash" 
                        onClose={() => setShowShare(false)} 
                    />
                )}
            </div>
        </div>
    );
};

export default FlashViewer;