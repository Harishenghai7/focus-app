import React, { useRef, useState, useCallback, useEffect } from 'react';
import styles from './BoltzPlayer.module.css';
import BoltzOverlay from './BoltzOverlay';
import BoltzUserInfo from './BoltzUserInfo';
import BoltzMusicInfo from './BoltzMusicInfo';
import BoltzActionsSidebar from './BoltzActionsSidebar';
import HeartAnimation from './HeartAnimation';
import VideoProgressBar from './VideoProgressBar';
import VolumeControl from './VolumeControl';
import BoltzErrorFallback from './BoltzErrorFallback';
import { useViewTracking } from '../../hooks/useViewTracking';

const BoltzPlayer = ({
    boltz,
    isActive,
    playing,
    muted,
    preload = 'none',
    released = false,
    onTogglePlay,
    onToggleMute,
    onLike,
    onComment,
    onShare,
    onSave,
    onFollow,
    onOpenOptions,
    onOpenMusic,
    showHeartAnimation,
    videoRef,
    currentUserId
}) => {
    const [lastTap, setLastTap] = useState(0);
    const [progress, setProgress] = useState(0);
    const [videoReady, setVideoReady] = useState(false);
    const [videoErrored, setVideoErrored] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const internalVideoRef = useRef(null);
    const actualVideoRef = videoRef || internalVideoRef;
    const posterSrc = boltz.thumbnail_url || boltz.poster_url || boltz.preview_image || boltz.cover_url || null;

    // Track views for analytics
    useViewTracking(boltz.id, isActive);

    useEffect(() => {
        if (!released) return;
        const v = actualVideoRef.current;
        if (!v) return;
        try {
            v.pause();
            v.removeAttribute('src');
            v.load();
        } catch (_) {}
    }, [released, actualVideoRef]);

    useEffect(() => {
        return () => {
            const v = actualVideoRef.current;
            if (!v) return;
            try {
                v.pause();
                v.removeAttribute('src');
                v.load();
            } catch (_) {}
        };
    }, [actualVideoRef]);

    const handleVideoTap = () => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;

        if (tapLength < 300 && tapLength > 0) {
            // Double tap - like with haptic feedback
            if (navigator.vibrate) navigator.vibrate(50);
            onLike();
        } else {
            // Single tap - pause/play
            onTogglePlay();
        }

        setLastTap(currentTime);
    };

    // Handle video load error with retry logic
    const handleVideoError = useCallback(() => {
        console.warn(`[BoltzPlayer] Video load error for boltz ${boltz.id}`);
        setVideoErrored(true);
        setIsBuffering(false);
    }, [boltz.id]);

    // Retry loading the video
    const handleRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
        setVideoErrored(false);
        setVideoReady(false);
        setIsBuffering(true);

        // Force video reload
        if (actualVideoRef.current) {
            actualVideoRef.current.load();
            if (playing) {
                actualVideoRef.current.play().catch(() => {});
            }
        }

        // Reset buffering state after a delay
        setTimeout(() => setIsBuffering(false), 1000);
    }, [playing, actualVideoRef]);

    // Handle satin transition when becoming active
    React.useEffect(() => {
        if (isActive) {
            setIsTransitioning(true);
            const timer = setTimeout(() => setIsTransitioning(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    const handleTimeUpdate = (e) => {
        const video = e.target;
        const progress = (video.currentTime / video.duration) * 100;
        setProgress(progress);
    };

    return (
        <div className={`${styles.container} ${isTransitioning ? styles.transitioning : ''}`}>
            {/* Satin Fade Transition Overlay */}
            {isTransitioning && <div className={styles.satinOverlay} />}

            {released ? (
                <div className={styles.videoPlaceholder} />
            ) : videoErrored ? (
                // God-Level Error Fallback with Focusly AI
                <BoltzErrorFallback
                    onRetry={handleRetry}
                    retryCount={retryCount}
                />
            ) : (
                <>
                    <video
                        ref={actualVideoRef}
                        src={boltz.video_url}
                        poster={posterSrc}
                        className={`${styles.video} ${isBuffering ? styles.buffering : ''}`}
                        loop
                        playsInline
                        muted={muted}
                        autoPlay={playing}
                        preload={preload}
                        onClick={handleVideoTap}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedData={() => {
                            setVideoReady(true);
                            setIsBuffering(false);
                        }}
                        onError={handleVideoError}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onWaiting={() => setIsBuffering(true)}
                        onPlaying={() => setIsBuffering(false)}
                    />

                    {/* Buffering Indicator */}
                    {isBuffering && (
                        <div className={styles.bufferingIndicator}>
                            <div className={styles.bufferingSpinner} />
                        </div>
                    )}
                </>
            )}

            {/* Poster Image (shown while loading) */}
            {!released && !videoErrored && (!videoReady || !isPlaying) && posterSrc && (
                <img
                    src={posterSrc}
                    alt=""
                    className={`${styles.poster} ${videoReady ? styles.posterFaded : ''}`}
                    loading="eager"
                />
            )}

            <BoltzOverlay />

            <BoltzUserInfo
                user={boltz.profiles || boltz.user}
                caption={boltz.caption}
                onFollow={() => onFollow(boltz.profiles?.id || boltz.user?.id)}
                isOwnContent={currentUserId === boltz.user_id}
            />

            {boltz.music && (
                <BoltzMusicInfo
                    music={boltz.music}
                    playing={playing}
                    onClick={onOpenMusic}
                />
            )}

            <BoltzActionsSidebar
                boltz={boltz}
                onLike={onLike}
                onComment={onComment}
                onShare={onShare}
                onSave={onSave}
                onOpenOptions={onOpenOptions}
                onOpenMusic={onOpenMusic}
                playing={playing}
            />

            {showHeartAnimation && <HeartAnimation />}

            {onToggleMute && <VolumeControl muted={muted} onToggle={onToggleMute} />}

            <VideoProgressBar progress={progress} />
        </div>
    );
};

export default BoltzPlayer;
