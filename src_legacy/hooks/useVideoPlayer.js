import { useState, useEffect, useCallback } from 'react';

export const useVideoPlayer = (videoRef, isActive) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.7);

  // Auto-play when active
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.error('Auto-play failed:', err);
          setIsPlaying(false);
        });
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, videoRef]);

  // Sync playing state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [videoRef]);

  // Update volume
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
  }, [volume, videoRef]);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(err => console.error('Play failed:', err));
    } else {
      video.pause();
    }
  }, [videoRef]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
    }
  }, [isMuted, videoRef]);

  // Seek to position (0-1)
  const seek = useCallback((percent) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;

    video.currentTime = video.duration * percent;
  }, [videoRef]);

  return {
    isPlaying,
    isMuted,
    volume,
    togglePlay,
    toggleMute,
    setVolume,
    seek
  };
};
