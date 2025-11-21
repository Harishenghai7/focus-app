import React, { useRef, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import BoltzControls from './BoltzControls';
import BoltzInfo from './BoltzInfo';
import MusicMarquee from './MusicMarquee';
import { useVideoPlayer } from '../../hooks/useVideoPlayer';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

const BoltzPlayer = ({ 
  boltz, 
  isActive, 
  currentUser, 
  onUpdate,
  preloadNext,
  preloadPrev 
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [error, setError] = useState(null);
  const [viewTracked, setViewTracked] = useState(false);

  // Video player hook
  const {
    isPlaying,
    isMuted,
    volume,
    togglePlay,
    toggleMute,
    setVolume: setPlayerVolume,
    seek
  } = useVideoPlayer(videoRef, isActive);

  // Swipe gesture hook
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeUp: () => {
      // Handle next video (parent handles)
    },
    onSwipeDown: () => {
      // Handle previous video (parent handles)
    }
  });

  // Track view after 3 seconds
  useEffect(() => {
    if (!isActive || viewTracked) return;

    const timer = setTimeout(async () => {
      try {
        await supabase.rpc('increment_boltz_views', { boltz_id: boltz.id });
        onUpdate(boltz.id, { views: boltz.views + 1 });
        setViewTracked(true);
      } catch (err) {
        console.error('Error tracking view:', err);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive, viewTracked, boltz.id, boltz.views, onUpdate]);

  // Update progress
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const updateBuffered = () => {
      if (video.buffered.length > 0 && video.duration) {
        setBuffered((video.buffered.end(video.buffered.length - 1) / video.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleError = (e) => {
      setError('Failed to load video');
      console.error('Video error:', e);
    };

    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('progress', updateBuffered);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('progress', updateBuffered);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, []);

  // Auto-play/pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.play().catch(err => console.error('Auto-play failed:', err));
    } else {
      video.pause();
    }
  }, [isActive]);

  // Preload adjacent videos
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (preloadNext || preloadPrev) {
      video.preload = 'auto';
    } else if (!isActive) {
      video.preload = 'metadata';
    }
  }, [preloadNext, preloadPrev, isActive]);

  // Handle like action
  const handleLike = useCallback(async () => {
    if (!currentUser) {
      alert('Please login to like');
      return;
    }

    const newLikedState = !boltz.isLiked;
    const newLikeCount = boltz.likes + (newLikedState ? 1 : -1);

    // Optimistic update
    onUpdate(boltz.id, {
      isLiked: newLikedState,
      likes: newLikeCount
    });

    // Show animation
    if (newLikedState) {
      setShowLikeAnimation(true);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }

    try {
      if (newLikedState) {
        await supabase.from('boltz_likes').insert({
          boltz_id: boltz.id,
          user_id: currentUser.id
        });
      } else {
        await supabase
          .from('boltz_likes')
          .delete()
          .eq('boltz_id', boltz.id)
          .eq('user_id', currentUser.id);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      // Revert on error
      onUpdate(boltz.id, {
        isLiked: boltz.isLiked,
        likes: boltz.likes
      });
    }
  }, [currentUser, boltz, onUpdate]);

  // Handle save action
  const handleSave = useCallback(async () => {
    if (!currentUser) {
      alert('Please login to save');
      return;
    }

    const newSavedState = !boltz.isSaved;
    const newSaveCount = boltz.saves + (newSavedState ? 1 : -1);

    // Optimistic update
    onUpdate(boltz.id, {
      isSaved: newSavedState,
      saves: newSaveCount
    });

    try {
      if (newSavedState) {
        await supabase.from('boltz_saves').insert({
          boltz_id: boltz.id,
          user_id: currentUser.id
        });
      } else {
        await supabase
          .from('boltz_saves')
          .delete()
          .eq('boltz_id', boltz.id)
          .eq('user_id', currentUser.id);
      }
    } catch (err) {
      console.error('Error toggling save:', err);
      onUpdate(boltz.id, {
        isSaved: boltz.isSaved,
        saves: boltz.saves
      });
    }
  }, [currentUser, boltz, onUpdate]);

  // Handle follow action
  const handleFollow = useCallback(async () => {
    if (!currentUser) {
      alert('Please login to follow');
      return;
    }

    if (currentUser.id === boltz.user.id) return;

    const newFollowingState = !boltz.isFollowing;

    // Optimistic update
    onUpdate(boltz.id, { isFollowing: newFollowingState });

    try {
      if (newFollowingState) {
        await supabase.from('follows').insert({
          follower_id: currentUser.id,
          following_id: boltz.user.id
        });
      } else {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', boltz.user.id);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      onUpdate(boltz.id, { isFollowing: boltz.isFollowing });
    }
  }, [currentUser, boltz, onUpdate]);

  // Double tap to like
  const handleDoubleTap = useCallback(() => {
    if (!boltz.isLiked) {
      handleLike();
    }
  }, [boltz.isLiked, handleLike]);

  // Handle video click/tap
  let tapTimeout = null;
  const handleVideoClick = () => {
    if (tapTimeout) {
      clearTimeout(tapTimeout);
      tapTimeout = null;
      handleDoubleTap();
    } else {
      tapTimeout = setTimeout(() => {
        tapTimeout = null;
        togglePlay();
      }, 300);
    }
  };

  // Handle progress bar seek
  const handleSeek = (e) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    seek(percent);
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'l':
          e.preventDefault();
          handleLike();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, togglePlay, toggleMute, handleLike]);

  if (error) {
    return (
      <div className="boltz-player error-state">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="boltz-player"
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="boltz-video"
        src={boltz.video_url}
        poster={boltz.thumbnail}
        loop
        playsInline
        muted={isMuted}
        preload={isActive ? 'auto' : 'metadata'}
        onClick={handleVideoClick}
        aria-label={`Video by ${boltz.user.username}: ${boltz.caption}`}
      />

      {/* Gradients for readability */}
      <div className="boltz-gradient-top" />
      <div className="boltz-gradient-bottom" />

      {/* Like Animation */}
      {showLikeAnimation && (
        <div className="like-animation">
          <svg viewBox="0 0 24 24" className="like-heart">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      )}

      {/* User Info */}
      <BoltzInfo
        boltz={boltz}
        currentUser={currentUser}
        isFollowing={boltz.isFollowing}
        onFollow={handleFollow}
      />

      {/* Music Marquee */}
      {boltz.music?.name && (
        <MusicMarquee
          music={boltz.music}
          isPlaying={isPlaying}
        />
      )}

      {/* Controls */}
      <BoltzControls
        boltz={boltz}
        currentUser={currentUser}
        isLiked={boltz.isLiked}
        isSaved={boltz.isSaved}
        onLike={handleLike}
        onSave={handleSave}
      />

      {/* Progress Bar */}
      <div className="boltz-progress-container" onClick={handleSeek}>
        <div className="boltz-progress-buffered" style={{ width: `${buffered}%` }} />
        <div className="boltz-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Play/Pause Indicator */}
      {!isPlaying && (
        <div className="play-pause-indicator">
          <svg viewBox="0 0 24 24" className="play-icon">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      )}

      {/* Mute Indicator */}
      <button 
        className="mute-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleMute();
        }}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    </div>
  );
};

export default BoltzPlayer;
