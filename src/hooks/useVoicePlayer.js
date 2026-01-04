import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook for managing voice message playback
 * Supports playback speed, waveform, and real-time progress
 */
export const useVoicePlayer = (audioUrl) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [loading, setLoading] = useState(false);
    const audioRef = useRef(null);
    const animationFrameRef = useRef(null);

    // Initialize audio element
    useEffect(() => {
        if (!audioUrl) return;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setLoading(false);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };

        const handleError = (e) => {
            console.error('Audio loading error:', e);
            setLoading(false);
        };

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        setLoading(true);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.pause();
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [audioUrl]);

    // Update current time during playback
    const updateTime = useCallback(() => {
        if (audioRef.current && isPlaying) {
            setCurrentTime(audioRef.current.currentTime);
            animationFrameRef.current = requestAnimationFrame(updateTime);
        }
    }, [isPlaying]);

    // Play/Pause toggle
    const togglePlayPause = useCallback(() => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        } else {
            audioRef.current.play();
            setIsPlaying(true);
            animationFrameRef.current = requestAnimationFrame(updateTime);
        }
    }, [isPlaying, updateTime]);

    // Seek to specific time
    const seekTo = useCallback((time) => {
        if (!audioRef.current) return;
        audioRef.current.currentTime = time;
        setCurrentTime(time);
    }, []);

    // Change playback speed
    const changeSpeed = useCallback(() => {
        const speeds = [1, 1.5, 2];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];

        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
        setPlaybackSpeed(nextSpeed);
    }, [playbackSpeed]);

    // Format time (mm:ss)
    const formatTime = useCallback((seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }, []);

    // Get progress percentage
    const getProgress = useCallback(() => {
        if (!duration) return 0;
        return (currentTime / duration) * 100;
    }, [currentTime, duration]);

    return {
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
    };
};
