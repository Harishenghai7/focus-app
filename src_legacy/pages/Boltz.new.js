import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useSwipeable } from 'react-swipeable';

// Utils
import { trackPageView } from '../utils/analytics/trackPageView';
import { trackEvent } from '../utils/analytics/trackEvent';

import './Boltz.css';

function Boltz() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);

  // Refs
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const lastTapRef = useRef(0);

  // Track page view
  useEffect(() => {
    trackPageView('Boltz');
  }, []);

  // Fetch boltz videos
  const fetchBoltzVideos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            verified
          ),
          post_likes (
            user_id,
            count
          ),
          comments (count)
        `)
        .eq('post_type', 'boltz')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setVideos(data || []);
      
      // Check if current video is liked and if user is following
      if (data && data.length > 0) {
        checkLikeStatus(data[0].id);
        checkFollowStatus(data[0].user_id);
      }
    } catch (err) {
      console.error('Error fetching boltz:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoltzVideos();
  }, []);

  // Check if current video is liked
  const checkLikeStatus = async (postId) => {
    if (!user?.id) return;

    const { data } = await supabase
      .from('post_likes')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    setLiked(!!data);
  };

  // Check if following creator
  const checkFollowStatus = async (userId) => {
    if (!user?.id || userId === user.id) {
      setFollowing(false);
      return;
    }

    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();

    setFollowing(!!data);
  };

  // Auto-play when video is in view
  useEffect(() => {
    if (videoRef.current && isPlaying) {
      videoRef.current.play().catch(err => {
        console.log('Auto-play prevented:', err);
      });
    }
  }, [currentIndex, isPlaying]);

  // Handle swipe up (next video)
  const handleSwipeUp = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsPlaying(true);
      trackEvent('boltz_swipe_next');
      
      // Check like and follow status for new video
      const nextVideo = videos[currentIndex + 1];
      if (nextVideo) {
        checkLikeStatus(nextVideo.id);
        checkFollowStatus(nextVideo.user_id);
      }
    }
  };

  // Handle swipe down (previous video)
  const handleSwipeDown = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsPlaying(true);
      trackEvent('boltz_swipe_previous');
      
      // Check like and follow status for previous video
      const prevVideo = videos[currentIndex - 1];
      if (prevVideo) {
        checkLikeStatus(prevVideo.id);
        checkFollowStatus(prevVideo.user_id);
      }
    }
  };

  // Swipeable handlers
  const handlers = useSwipeable({
    onSwipedUp: handleSwipeUp,
    onSwipedDown: handleSwipeDown,
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // Handle tap (play/pause)
  const handleTap = (e) => {
    const now = Date.now();
    const timeSince = now - lastTapRef.current;

    // Double tap (like)
    if (timeSince < 300) {
      handleDoubleTap(e);
    } else {
      // Single tap (play/pause)
      setIsPlaying(prev => !prev);
      if (videoRef.current) {
        if (isPlaying) {
          videoRef.current.pause();
        } else {
          videoRef.current.play();
        }
      }
    }

    lastTapRef.current = now;
  };

  // Handle double tap to like
  const handleDoubleTap = async (e) => {
    if (!user?.id || !videos[currentIndex]) return;

    const rect = videoRef.current.getBoundingClientRect();
    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;

    // Show heart animation at tap position
    showHeartAnimation(x - rect.left, y - rect.top);

    // Like the video
    if (!liked) {
      await handleLike();
    }

    trackEvent('boltz_double_tap_like', { video_id: videos[currentIndex].id });
  };

  // Show heart animation
  const showHeartAnimation = (x, y) => {
    const heart = document.createElement('div');
    heart.className = 'heart-animation';
    heart.style.left = `${x}px`;
    heart.style.top = `${y}px`;
    heart.innerHTML = '❤️';
    
    containerRef.current.appendChild(heart);

    setTimeout(() => {
      heart.remove();
    }, 1000);
  };

  // Handle like
  const handleLike = async () => {
    if (!user?.id || !videos[currentIndex]) return;

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', videos[currentIndex].id)
          .eq('user_id', user.id);
        setLiked(false);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: videos[currentIndex].id,
            user_id: user.id
          });
        setLiked(true);
      }

      trackEvent('boltz_like_toggled', { 
        video_id: videos[currentIndex].id,
        liked: !liked
      });
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  // Handle follow
  const handleFollow = async () => {
    if (!user?.id || !videos[currentIndex]) return;

    try {
      if (following) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', videos[currentIndex].user_id);
        setFollowing(false);
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: videos[currentIndex].user_id
          });
        setFollowing(true);
      }

      trackEvent('boltz_follow_toggled', { 
        user_id: videos[currentIndex].user_id,
        following: !following
      });
    } catch (err) {
      console.error('Error toggling follow:', err);
    }
  };

  // Handle comment
  const handleComment = () => {
    navigate(`/post/${videos[currentIndex].id}?focus=comment`);
    trackEvent('boltz_comment_clicked', { video_id: videos[currentIndex].id });
  };

  // Handle share
  const handleShare = async () => {
    const video = videos[currentIndex];
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${video.profiles.username}'s Boltz`,
          text: video.caption,
          url: `${window.location.origin}/post/${video.id}`
        });
        trackEvent('boltz_shared', { video_id: video.id });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!user?.id || !videos[currentIndex]) return;

    try {
      const { error } = await supabase
        .from('saved_posts')
        .insert({
          user_id: user.id,
          post_id: videos[currentIndex].id
        });

      if (!error) {
        trackEvent('boltz_saved', { video_id: videos[currentIndex].id });
        alert('Saved to your collection!');
      }
    } catch (err) {
      console.error('Error saving:', err);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    trackEvent('boltz_mute_toggled', { muted: !isMuted });
  };

  // View profile
  const viewProfile = () => {
    navigate(`/profile/${videos[currentIndex].profiles.username}`);
  };

  if (loading) {
    return (
      <div className="boltz-loading">
        <div className="loading-spinner">Loading Boltz...</div>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="boltz-empty">
        <div className="empty-icon">⚡</div>
        <h3>No Boltz Available</h3>
        <p>Check back later for new content</p>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  return (
    <div className="page-boltz" ref={containerRef} {...handlers}>
      <div className="boltz-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1>⚡ Boltz</h1>
        <button className="search-button" onClick={() => navigate('/search')}>
          🔍
        </button>
      </div>

      <div className="boltz-video-container" onClick={handleTap}>
        <video
          ref={videoRef}
          className="boltz-video"
          src={currentVideo.media_url}
          loop
          playsInline
          muted={isMuted}
          autoPlay
        />

        {/* Play/Pause Indicator */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              className="play-pause-indicator"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
            >
              ▶
            </motion.div>
          )}
        </AnimatePresence>

        {/* Creator Info (Left Bottom) */}
        <div className="creator-info">
          <div className="creator-details" onClick={viewProfile}>
            <img
              src={currentVideo.profiles.avatar_url || '/default-avatar.png'}
              alt={currentVideo.profiles.username}
              className="creator-avatar"
            />
            <div>
              <div className="creator-username">
                @{currentVideo.profiles.username}
                {currentVideo.profiles.verified && <span className="verified">✓</span>}
              </div>
              {currentVideo.caption && (
                <div className="video-caption">{currentVideo.caption}</div>
              )}
              {currentVideo.music && (
                <div className="music-info">
                  🎵 {currentVideo.music.name} - {currentVideo.music.artist}
                </div>
              )}
            </div>
          </div>

          {!following && currentVideo.user_id !== user?.id && (
            <button className="follow-button-inline" onClick={handleFollow}>
              + Follow
            </button>
          )}
        </div>

        {/* Action Buttons (Right Side) */}
        <div className="action-buttons">
          <button
            className={`action-button ${liked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <span className="action-icon">❤️</span>
            <span className="action-count">
              {currentVideo.post_likes?.[0]?.count || 0}
            </span>
          </button>

          <button className="action-button" onClick={handleComment}>
            <span className="action-icon">💬</span>
            <span className="action-count">
              {currentVideo.comments?.[0]?.count || 0}
            </span>
          </button>

          <button className="action-button" onClick={handleShare}>
            <span className="action-icon">↗️</span>
            <span className="action-label">Share</span>
          </button>

          <button className="action-button" onClick={handleSave}>
            <span className="action-icon">🔖</span>
            <span className="action-label">Save</span>
          </button>

          <button className="action-button" onClick={toggleMute}>
            <span className="action-icon">{isMuted ? '🔇' : '🔊'}</span>
          </button>
        </div>

        {/* Video Progress */}
        <div className="video-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: videoRef.current
                  ? `${(videoRef.current.currentTime / videoRef.current.duration) * 100}%`
                  : '0%'
              }}
            />
          </div>
        </div>

        {/* Swipe Hints */}
        {currentIndex === 0 && (
          <div className="swipe-hint swipe-up">↑ Swipe for next</div>
        )}
        {currentIndex > 0 && (
          <div className="swipe-hint swipe-down">↓ Swipe for previous</div>
        )}
      </div>
    </div>
  );
}

export default Boltz;
