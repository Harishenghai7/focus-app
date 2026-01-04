import React, { useState, useRef } from 'react';
import styles from './PostMedia.module.css';
import Icon from '../ui/Icon';

const VideoPlayer = ({ src }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const togglePlay = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    return (
        <div className={styles.videoContainer} onClick={togglePlay}>
            <video
                ref={videoRef}
                src={src}
                className={styles.media}
                loop
                muted={isMuted}
                playsInline
            />
            {!isPlaying && (
                <div className={styles.playOverlay}>
                    <Icon name="Play" size={48} color="white" fill="white" />
                </div>
            )}
            <button className={styles.muteBtn} onClick={toggleMute}>
                <Icon name={isMuted ? "VolumeX" : "Volume2"} size={16} color="white" />
            </button>
        </div>
    );
};

export default VideoPlayer;
