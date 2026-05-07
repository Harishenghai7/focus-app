import React, { useRef, useState, useEffect } from 'react';
import styles from './VideoPlayer.module.css';
import Icon from '../ui/Icon';

const VideoPlayer = ({ src, isActive, onEnded }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isActive) {
            videoRef.current.play().catch(() => {
                // Autoplay prevented
            });
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
            videoRef.current.currentTime = 0;
        }
    }, [isActive]);

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play().catch(e => {
                // Ignore errors caused by pausing immediately after playing
                if (e.name !== 'AbortError') {
                    console.error('Play error:', e);
                }
            });
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
        setProgress(progress);
    };

    return (
        <div className={styles.videoContainer} onClick={togglePlay}>
            <video
                ref={videoRef}
                src={src}
                className={styles.video}
                loop
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onEnded={onEnded}
            />

            {!isPlaying && (
                <div className={styles.playOverlay}>
                    <Icon name="Play" size={48} fill="white" />
                </div>
            )}

            <div className={styles.progressBar}>
                <div className={styles.progress} style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
};

export default VideoPlayer;
