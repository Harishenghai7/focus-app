import React from 'react';
import { useVoicePlayer } from '../../hooks/useVoicePlayer';
import styles from './VoiceMessagePlayer.module.css';

const VoiceMessagePlayer = ({ audioUrl, duration: initialDuration, isOwn = false }) => {
    const {
        isPlaying,
        currentTime,
        duration,
        playbackSpeed,
        loading,
        togglePlayPause,
        seekTo,
        changeSpeed,
        formatTime,
        getProgress
    } = useVoicePlayer(audioUrl);

    const handleProgressClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = percentage * duration;
        seekTo(newTime);
    };

    // Generate waveform bars (simplified visualization)
    const generateWaveform = () => {
        const bars = 40;
        const heights = [];
        for (let i = 0; i < bars; i++) {
            // Create a wave pattern
            const height = Math.sin(i * 0.3) * 0.5 + 0.5;
            heights.push(20 + height * 60);
        }
        return heights;
    };

    const waveformHeights = generateWaveform();
    const progress = getProgress();

    return (
        <div className={`${styles.player} ${isOwn ? styles.own : styles.other}`}>
            {/* Play/Pause Button */}
            <button
                className={styles.playButton}
                onClick={togglePlayPause}
                disabled={loading}
                aria-label={isPlaying ? 'Pause' : 'Play'}
            >
                {loading ? (
                    <div className={styles.spinner}></div>
                ) : isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
                        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                )}
            </button>

            {/* Waveform */}
            <div className={styles.waveformContainer} onClick={handleProgressClick}>
                <div className={styles.waveform}>
                    {waveformHeights.map((height, index) => {
                        const barProgress = (index / waveformHeights.length) * 100;
                        const isActive = barProgress <= progress;

                        return (
                            <div
                                key={index}
                                className={`${styles.bar} ${isActive ? styles.active : ''}`}
                                style={{ height: `${height}%` }}
                            />
                        );
                    })}
                </div>
                <div className={styles.progressOverlay} style={{ width: `${progress}%` }} />
            </div>

            {/* Duration / Time */}
            <div className={styles.time}>
                {isPlaying || currentTime > 0
                    ? formatTime(currentTime)
                    : formatTime(duration || initialDuration || 0)
                }
            </div>

            {/* Playback Speed */}
            <button
                className={styles.speedButton}
                onClick={changeSpeed}
                aria-label={`Playback speed: ${playbackSpeed}x`}
            >
                {playbackSpeed}x
            </button>
        </div>
    );
};

export default VoiceMessagePlayer;
