/**
 * VideoPlayer Component
 * Advanced video player with autoplay, controls, and PiP support
 */

import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({ src, poster, autoplay = true }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { ref, inView } = useInView({ threshold: 0.5 });

    // Autoplay when in view
    useEffect(() => {
        if (!videoRef.current || !autoplay) return;

        if (inView) {
            videoRef.current.play().catch(() => {
                // Autoplay failed, likely due to browser policy
                setIsPlaying(false);
            });
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, [inView, autoplay]);

    const togglePlay = () => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (!videoRef.current) return;

        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const handleTimeUpdate = () => {
        if (!videoRef.current) return;

        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(progress);
    };

    const handleSeek = (e) => {
        if (!videoRef.current) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        videoRef.current.currentTime = pos * videoRef.current.duration;
    };

    const handleLoadedData = () => {
        setIsLoading(false);
    };

    const handleWaiting = () => {
        setIsLoading(true);
    };

    const handleCanPlay = () => {
        setIsLoading(false);
    };

    return (
        <div className={styles.videoContainer} ref={ref}>
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                className={styles.video}
                onClick={togglePlay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedData={handleLoadedData}
                onWaiting={handleWaiting}
                onCanPlay={handleCanPlay}
                loop
                playsInline
                muted={isMuted}
            />

            {/* Play/Pause overlay */}
            {!isPlaying && !isLoading && (
                <div className={styles.playOverlay} onClick={togglePlay}>
                    <div className={styles.playButton}>▶</div>
                </div>
            )}

            {/* Loading spinner */}
            {isLoading && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner} />
                </div>
            )}

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.progressBar} onClick={handleSeek}>
                    <div
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className={styles.controlButtons}>
                    <button
                        className={styles.muteBtn}
                        onClick={toggleMute}
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? '🔇' : '🔊'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
