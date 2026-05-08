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
import BoltzReactionBurst from './BoltzReactionBurst';
import { useViewTracking } from '../../hooks/useViewTracking';
import { useBoltzGestures } from '../../hooks/useBoltzGestures';
import streamingEngine from '../../services/boltzStreamingEngine';

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
    currentUserId,
    floatingReactions = [],
    onReaction,
    showReactionPicker,
    onToggleReactionPicker,
    boltzReactions = {},
    userReaction,
}) => {
    const [progress, setProgress] = useState(0);
    const [bufferedProgress, setBufferedProgress] = useState(0);
    const [videoReady, setVideoReady] = useState(false);
    const [videoErrored, setVideoErrored] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [showPauseIcon, setShowPauseIcon] = useState(false);
    const [ambientColor, setAmbientColor] = useState('rgb(15, 10, 30)');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const internalVideoRef = useRef(null);
    const actualVideoRef = videoRef || internalVideoRef;
    const pauseIconTimeout = useRef(null);
    const posterSrc = boltz.thumbnail_url || boltz.poster_url || boltz.preview_image || boltz.cover_url || null;

    // Track views for analytics
    useViewTracking(boltz.id, isActive);

    // ── Gesture Handling ─────────────────────────────────
    const gestureHandlers = useBoltzGestures({
      onDoubleTap: (pos) => {
        onLike?.();
      },
      onSingleTap: () => {
        onTogglePlay?.();
        // Show pause/play icon briefly
        setShowPauseIcon(true);
        if (pauseIconTimeout.current) clearTimeout(pauseIconTimeout.current);
        pauseIconTimeout.current = setTimeout(() => setShowPauseIcon(false), 800);
      },
      onLongPress: () => {
        onToggleReactionPicker?.();
      },
      onSwipeLeft: () => {
        onShare?.();
      },
    }, isActive && !showReactionPicker);

    // ── Memory Release ───────────────────────────────────
    useEffect(() => {
        if (!released) return;
        streamingEngine.releaseVideo(actualVideoRef.current, boltz.id);
    }, [released, actualVideoRef, boltz.id]);

    useEffect(() => {
        return () => {
            streamingEngine.releaseVideo(actualVideoRef.current, boltz.id);
        };
    }, [actualVideoRef, boltz.id]);

    // ── Streaming Engine Integration ─────────────────────
    useEffect(() => {
        if (released || videoErrored || !boltz.video_url) return;
        const v = actualVideoRef.current;
        if (!v) return;
        streamingEngine.init();
        streamingEngine.prepareVideoElement(v, boltz.video_url, {
            preload,
            poster: posterSrc,
        });
    }, [boltz.video_url, preload, posterSrc, released, videoErrored, actualVideoRef]);

    // ── Preload Next Videos ──────────────────────────────
    useEffect(() => {
        if (preload === 'auto' && boltz.video_url) {
            streamingEngine.preloadVideo(boltz.video_url, boltz.id);
        }
    }, [preload, boltz.video_url, boltz.id]);

    // ── Ambient Color Extraction ─────────────────────────
    useEffect(() => {
        if (!isActive || !actualVideoRef.current || !videoReady) return;
        const extractTimer = setTimeout(() => {
            try {
                const color = streamingEngine.extractDominantColor(actualVideoRef.current);
                setAmbientColor(color);
            } catch (_) {}
        }, 500);
        return () => clearTimeout(extractTimer);
    }, [isActive, videoReady, actualVideoRef]);

    // ── Satin Transition ─────────────────────────────────
    useEffect(() => {
        if (isActive) {
            setIsTransitioning(true);
            const timer = setTimeout(() => setIsTransitioning(false), 350);
            return () => clearTimeout(timer);
        }
    }, [isActive]);

    // ── Playback Speed Control ───────────────────────────
    const cyclePlaybackSpeed = useCallback(() => {
        const speeds = [1, 1.5, 2];
        const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
        const next = speeds[nextIdx];
        setPlaybackSpeed(next);
        if (actualVideoRef.current) actualVideoRef.current.playbackRate = next;
    }, [playbackSpeed, actualVideoRef]);

    // ── Error Handling ───────────────────────────────────
    const handleVideoError = useCallback(() => {
        setVideoErrored(true);
        setIsBuffering(false);
    }, []);

    const handleRetry = useCallback(() => {
        setRetryCount(prev => prev + 1);
        setVideoErrored(false);
        setVideoReady(false);
        setIsBuffering(true);
        if (actualVideoRef.current) {
            actualVideoRef.current.load();
            if (playing) actualVideoRef.current.play().catch(() => {});
        }
        setTimeout(() => setIsBuffering(false), 1000);
    }, [playing, actualVideoRef]);

    // ── Progress & Buffer Tracking ───────────────────────
    const handleTimeUpdate = useCallback((e) => {
        const video = e.target;
        if (video.duration) {
            setProgress((video.currentTime / video.duration) * 100);
        }
        // Update buffered progress
        if (video.buffered.length > 0) {
            const buffEnd = video.buffered.end(video.buffered.length - 1);
            setBufferedProgress((buffEnd / video.duration) * 100);
        }
    }, []);

    return (
        <div
            className={`${styles.container} ${isTransitioning ? styles.transitioning : ''}`}
            style={{ '--ambient-color': ambientColor }}
            {...gestureHandlers}
        >
            {/* Ambient Background Glow */}
            <div className={styles.ambientGlow} />

            {/* Satin Fade Transition Overlay */}
            {isTransitioning && <div className={styles.satinOverlay} />}

            {released ? (
                <div className={styles.videoPlaceholder} />
            ) : videoErrored ? (
                <BoltzErrorFallback onRetry={handleRetry} retryCount={retryCount} />
            ) : (
                <>
                    <video
                        ref={actualVideoRef}
                        className={`${styles.video} ${isBuffering ? styles.buffering : ''}`}
                        loop
                        playsInline
                        muted={muted}
                        autoPlay={playing}
                        preload={preload}
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

            {/* Pause/Play Icon */}
            {showPauseIcon && (
                <div className={styles.pauseIconOverlay}>
                    <div className={styles.pauseIcon}>
                        {isPlaying ? '▐▐' : '▶'}
                    </div>
                </div>
            )}

            {/* Playback Speed Badge */}
            {playbackSpeed !== 1 && (
                <button className={styles.speedBadge} onClick={cyclePlaybackSpeed}>
                    {playbackSpeed}x
                </button>
            )}

            <BoltzOverlay />

            <BoltzUserInfo
                user={boltz.profiles || boltz.user}
                caption={boltz.caption}
                onFollow={() => onFollow(boltz.profiles?.id || boltz.user?.id)}
                isOwnContent={currentUserId === boltz.user_id}
                category={boltz._contentCategory}
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
                onReaction={onReaction}
                onToggleReactionPicker={onToggleReactionPicker}
                playing={playing}
                reactions={boltzReactions}
                userReaction={userReaction}
            />

            {showHeartAnimation && <HeartAnimation />}
            <BoltzReactionBurst reactions={floatingReactions} />

            {onToggleMute && <VolumeControl muted={muted} onToggle={onToggleMute} />}

            <VideoProgressBar
                progress={progress}
                buffered={bufferedProgress}
                onSpeedToggle={cyclePlaybackSpeed}
                speed={playbackSpeed}
            />
        </div>
    );
};

export default BoltzPlayer;
