import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { components, hooks, utils } from '@/importMap';
import ReelPlayer from '../components/ReelPlayer';
import CommentSection from '../components/CommentSection';
import ShareModal from '../components/ShareModal';
import './BoltzDetail.css';

const { InteractionBar, InstagramCommentsModal, ErrorBoundary } = components;
const { useRealtimeInteractions, useLoadingState } = hooks;
const { handleError, showErrorNotification } = utils;

// Helper function to format video duration
const formatVideoDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

function BoltzDetailContent({ user }) {
  const { boltzId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const keyboardShortcutsRef = useRef(null);

  // Enhanced state management with hooks
  const { isLoading, error: loadingError, execute: executeLoading } = useLoadingState();
  const { isConnected, reconnecting } = hooks.useRealtimeConnection();
  const realtimeInteractions = useRealtimeInteractions(boltzId, 'boltz', user);
  const [boltz, setBoltz] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [videoLoading, setVideoLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Enhanced fetch with error handling and loading states
  const fetchBoltzDetails = useCallback(async () => {
    return executeLoading(async () => {
      const { data, error } = await supabase
        .from('boltz')
        .select(`
          *,
          profiles!boltz_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('id', boltzId)
        .single();

      if (error) throw error;
      setBoltz(data);
      return data;
    });
  }, [boltzId, executeLoading]);

  const fetchUserInteractions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: follows } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);
      setFollowedUsers(new Set(follows?.map(f => f.following_id) || []));
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  }, [user?.id]);

  // Fetch related videos
  const fetchRelatedVideos = useCallback(async (currentBoltz) => {
    if (!currentBoltz) return;
    
    try {
      // Fetch videos from the same user or with similar content
      const { data, error } = await supabase
        .from('boltz')
        .select(`
          *,
          profiles!boltz_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .neq('id', currentBoltz.id)
        .or(`user_id.eq.${currentBoltz.user_id},description.ilike.%${currentBoltz.description?.split(' ')[0] || ''}%`)
        .order('views_count', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRelatedVideos(data || []);
    } catch (error) {
      console.error('Error fetching related videos:', error);
      // Fallback: fetch recent popular videos
      try {
        const { data } = await supabase
          .from('boltz')
          .select(`
            *,
            profiles!boltz_user_id_fkey(id, username, full_name, avatar_url)
          `)
          .neq('id', currentBoltz.id)
          .order('created_at', { ascending: false })
          .limit(6);
        setRelatedVideos(data || []);
      } catch (fallbackError) {
        console.error('Error fetching fallback videos:', fallbackError);
      }
    }
  }, []);

  useEffect(() => {
    if (boltzId && user) {
      fetchBoltzDetails().then(data => {
        if (data) {
          fetchRelatedVideos(data);
        }
      });
      fetchUserInteractions();
    }
  }, [boltzId, user, fetchBoltzDetails, fetchUserInteractions, fetchRelatedVideos]);

  // Real-time subscriptions for live updates - now using useRealtimeInteractions hook
  // The hook handles likes, comments, and saves subscriptions automatically
  // We only need to keep the follows subscription for user follow status updates
  useEffect(() => {
    if (!user?.id) return;

    const followsChannel = supabase
      .channel(`boltz_detail_follows_${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'follows', filter: `follower_id=eq.${user.id}` },
        () => {
          fetchUserInteractions(); // Refresh follow status
        }
      )
      .subscribe();

    return () => {
      followsChannel.unsubscribe();
    };
  }, [user?.id, fetchUserInteractions]);

  // Enhanced follow with optimistic updates and notifications
  const followAction = hooks.useOptimisticAction(
    followedUsers,
    async (userId) => {
      const isFollowing = followedUsers.has(userId);

      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        await supabase
          .from('follows')
          .insert([{
            follower_id: user.id,
            following_id: userId
          }]);

        // Send notification using enhanced service
        await utils.notifyFollow(userId, user.id);
      }

      // Return updated state
      const newSet = new Set(followedUsers);
      isFollowing ? newSet.delete(userId) : newSet.add(userId);
      return newSet;
    }
  );

  const handleFollow = useCallback(async (userId) => {
    if (!user?.id) return;

    try {
      await followAction.executeOptimistic(userId);
      utils.announceToScreenReader(
        followedUsers.has(userId) ? 'Unfollowed user' : 'Followed user',
        'polite'
      );
    } catch (error) {
      const errorInfo = handleError(error, { action: 'follow', userId });
      showErrorNotification(errorInfo);
      // Revert optimistic update on error
      fetchUserInteractions();
    }
  }, [user?.id, followAction, followedUsers, fetchUserInteractions]);

  // Debounced follow handler to prevent rapid clicks
  const debouncedHandleFollow = useCallback(
    (() => {
      let timeoutId;
      return (userId) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => handleFollow(userId), 300);
      };
    })(),
    [handleFollow]
  );

  // Enhanced retry functionality for failed operations
  const handleRetry = useCallback(async (operation, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s...
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));
        }
      }
    }
    throw lastError;
  }, []);

  // Video control functions
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      if (!isFullscreen) {
        if (videoRef.current.requestFullscreen) {
          await videoRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes to update state
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Keyboard shortcuts setup
  useEffect(() => {
    if (!keyboardShortcutsRef.current) {
      keyboardShortcutsRef.current = new hooks.KeyboardShortcuts();
      keyboardShortcutsRef.current.register('space', {}, togglePlayPause, 'Play/Pause video');
      keyboardShortcutsRef.current.register('m', {}, toggleMute, 'Mute/Unmute video');
      keyboardShortcutsRef.current.register('f', {}, toggleFullscreen, 'Toggle fullscreen');
    }

    return () => {
      if (keyboardShortcutsRef.current) {
        keyboardShortcutsRef.current.destroy();
        keyboardShortcutsRef.current = null;
      }
    };
  }, [togglePlayPause, toggleMute, toggleFullscreen]);

  // Enhanced keyboard navigation for all interactive elements
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Skip if user is typing in an input/textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case 'Escape':
          if (isFullscreen) {
            toggleFullscreen();
            utils.announceToScreenReader('Exited fullscreen mode', 'polite');
          }
          break;
        case 'ArrowLeft':
          // Could be used for seeking backward in future enhancement
          break;
        case 'ArrowRight':
          // Could be used for seeking forward in future enhancement
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen]);

  // Focus management and announcements
  useEffect(() => {
    // Announce page load to screen readers
    if (boltz) {
      utils.announceToScreenReader(
        `Loaded video: ${boltz.description || 'No description'} by ${boltz.profiles?.username || 'user'}`,
        'polite'
      );
    }
  }, [boltz]);

  // Enhanced ARIA live regions for dynamic content
  const liveRegionRef = useRef(null);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Enhanced loading and error states with skeleton loading
  if (isLoading) {
    return (
      <div className="boltz-detail-page">
        <div className="boltz-detail-container">
          {/* Skeleton Back Button */}
          <div className="skeleton skeleton-button back-button-skeleton"></div>

          {/* Skeleton Video Section */}
          <div className="boltz-video-section">
            <div className="boltz-video-wrapper">
              <div className="skeleton skeleton-video"></div>
              <div className="video-loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading video...</p>
                {!isConnected && (
                  <p className="connection-warning">⚠️ Connection lost - working offline</p>
                )}
                {reconnecting && (
                  <p className="reconnecting-message">🔄 Reconnecting...</p>
                )}
              </div>
            </div>
          </div>

          {/* Skeleton Content Section */}
          <div className="boltz-content-section">
            {/* Skeleton User Info */}
            <div className="boltz-user-info">
              <div className="user-details">
                <div className="skeleton skeleton-avatar"></div>
                <div className="user-text">
                  <div className="skeleton skeleton-text skeleton-username"></div>
                  <div className="skeleton skeleton-text skeleton-time"></div>
                </div>
              </div>
              <div className="skeleton skeleton-button follow-btn-skeleton"></div>
            </div>

            {/* Skeleton Description */}
            <div className="boltz-description">
              <div className="skeleton skeleton-text skeleton-description"></div>
              <div className="skeleton skeleton-text skeleton-description"></div>
            </div>

            {/* Skeleton Stats */}
            <div className="boltz-stats">
              <div className="skeleton skeleton-text skeleton-stat"></div>
              <div className="skeleton skeleton-text skeleton-stat"></div>
            </div>

            {/* Skeleton Interactions */}
            <div className="boltz-interactions">
              <div className="skeleton skeleton-interaction-bar"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingError || !boltz) {
    const errorInfo = loadingError ? handleError(loadingError, { action: 'load_boltz', boltzId }) : null;

    return (
      <div className="boltz-detail-page">
        <div className="boltz-detail-error">
          <div className="error-icon">⚠️</div>
          <h2>{errorInfo?.userMessage || 'Video not found'}</h2>
          <p className="error-details">
            {errorInfo?.details || 'The video you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <div className="error-actions">
            <button
              onClick={() => navigate('/boltz')}
              className="btn-primary"
              aria-label="Go back to Boltz feed"
            >
              Back to Boltz
            </button>
            {loadingError && (
              <button
                onClick={fetchBoltzDetails}
                className="btn-secondary"
                aria-label="Retry loading video"
                disabled={isLoading}
              >
                {isLoading ? 'Retrying...' : 'Try Again'}
              </button>
            )}
          </div>
          {!isConnected && (
            <p className="connection-warning">⚠️ You're currently offline. Check your connection and try again.</p>
          )}
        </div>
      </div>
    );
  }



  return (
    <div className="boltz-detail-page">
      {/* Hidden live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <div className="boltz-detail-container">
        {/* Back Button */}
        <motion.button
          className="back-button"
          onClick={() => navigate('/boltz')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          aria-label={utils.generateAriaLabel('back')}
          tabIndex={0}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </motion.button>

        {/* Video Section */}
        <motion.div
          className="boltz-video-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="boltz-video-wrapper">
            <video
              ref={videoRef}
              src={boltz.video_url}
              className="boltz-detail-video"
              controls
              autoPlay
              loop
              playsInline
              poster={boltz.thumbnail_url}
              onLoadStart={() => setVideoLoading(true)}
              onCanPlay={() => setVideoLoading(false)}
              onError={(e) => {
                console.error('Video load error:', e);
                setVideoLoading(false);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onVolumeChange={(e) => setIsMuted(e.target.muted)}
              aria-label={`Video by ${boltz.profiles?.username || 'user'}: ${boltz.description || 'No description'}`}
            />

            {videoLoading && (
              <div className="video-loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading video...</p>
              </div>
            )}

            {/* Custom Video Controls */}
            <div
              className="custom-video-controls"
              onMouseEnter={() => setShowControls(true)}
              onMouseLeave={() => setShowControls(false)}
              role="toolbar"
              aria-label="Video controls"
            >
              <button
                onClick={togglePlayPause}
                className="video-control-btn"
                aria-label={utils.generateAriaLabel('play', { isPlaying })}
                tabIndex={0}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={toggleMute}
                className="video-control-btn"
                aria-label={utils.generateAriaLabel('mute', { isMuted })}
                tabIndex={0}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
              <button
                onClick={toggleFullscreen}
                className="video-control-btn"
                aria-label={utils.generateAriaLabel('fullscreen')}
                tabIndex={0}
              >
                {isFullscreen ? '🗗️' : '🗖️'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Content Section */}
        <motion.div
          className="boltz-content-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* User Info */}
          <div className="boltz-user-info" role="region" aria-labelledby="user-info-heading">
            <h2 id="user-info-heading" className="sr-only">User Information</h2>
            <div className="user-details">
              <img
                src={boltz.profiles?.avatar_url || '/default-avatar.png'}
                alt={boltz.profiles?.username || 'User'}
                className="user-avatar"
                onClick={() => {
                  const username = boltz.profiles?.username;
                  if (username) navigate(`/profile/${username}`);
                }}
                aria-label={`View profile of ${boltz.profiles?.username || 'user'}`}
                tabIndex={0}
                role="button"
              />
              <div className="user-text">
                <div className="username-container">
                  <span
                    className="username"
                    onClick={() => {
                      const username = boltz.profiles?.username;
                      if (username) navigate(`/profile/${username}`);
                    }}
                    aria-label={`View profile of ${boltz.profiles?.username || 'user'}`}
                    tabIndex={0}
                    role="button"
                  >
                    {boltz.profiles?.username || boltz.profiles?.full_name || 'User'}
                  </span>
                </div>
                <span className="video-time" aria-label={`Posted ${formatTimeAgo(boltz.created_at)}`}>
                  {formatTimeAgo(boltz.created_at)}
                </span>
              </div>
            </div>
            {boltz.user_id !== user?.id && (
              <button
                className={`follow-btn ${followedUsers.has(boltz.user_id) ? 'following' : ''}`}
                onClick={() => debouncedHandleFollow(boltz.user_id)}
                aria-label={followedUsers.has(boltz.user_id) ? `Unfollow ${boltz.profiles?.username}` : `Follow ${boltz.profiles?.username}`}
                tabIndex={0}
              >
                {followedUsers.has(boltz.user_id) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Description */}
          {boltz.description && (
            <div className="boltz-description">
              <p aria-label={`Video description: ${boltz.description}`}>{boltz.description}</p>
            </div>
          )}

          {/* Stats */}
          <div className="boltz-stats" role="group" aria-label="Video statistics">
            {boltz.views_count > 0 && (
              <span className="stat-item" aria-label={`${formatCount(boltz.views_count)} views`}>
                👁️ {formatCount(boltz.views_count)} views
              </span>
            )}
            {boltz.likes_count > 0 && (
              <span className="stat-item" aria-label={`${formatCount(boltz.likes_count)} likes`}>
                ❤️ {formatCount(boltz.likes_count)} likes
              </span>
            )}
            {boltz.comments_count > 0 && (
              <span className="stat-item" aria-label={`${formatCount(boltz.comments_count)} comments`}>
                💬 {formatCount(boltz.comments_count)} comments
              </span>
            )}
          </div>

          {/* Interactions */}
          <div className="boltz-interactions">
            <InteractionBar
              contentId={boltz.id}
              contentType="boltz"
              user={user}
              contentData={{
                id: boltz.id,
                contentType: 'boltz',
                description: boltz.description,
                video_url: boltz.video_url,
                thumbnail_url: boltz.thumbnail_url,
                username: boltz.profiles?.username,
                user_id: boltz.user_id
              }}
              className="boltz-detail-interaction-bar"
              size="large"
              showCounts={true}
              showSave={true}
              onShare={() => setShowShareModal(true)}
            />
          </div>

          {/* Explicit Share Button */}
          <motion.button
            className="share-button-explicit"
            onClick={() => setShowShareModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Share this video"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </motion.button>
        </motion.div>

        {/* Related Videos Sidebar */}
        <motion.div
          className="boltz-sidebar-section"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="sidebar-title">Related Videos</h3>
          <div className="related-videos-list">
            {relatedVideos.length > 0 ? (
              relatedVideos.map((video) => (
                <motion.div
                  key={video.id}
                  className="related-video-card"
                  onClick={() => navigate(`/boltz/${video.id}`)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Watch video by ${video.profiles?.username}: ${video.description || 'No description'}`}
                >
                  <div className="related-video-thumbnail">
                    <img
                      src={video.thumbnail_url || '/default-thumbnail.png'}
                      alt={video.description || 'Video thumbnail'}
                      loading="lazy"
                    />
                    {video.duration && (
                      <span className="video-duration" aria-label={`Duration: ${formatVideoDuration(video.duration)}`}>
                        {formatVideoDuration(video.duration)}
                      </span>
                    )}
                    <div className="play-overlay">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="white" aria-hidden="true">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  <div className="related-video-info">
                    <p className="related-video-description">
                      {video.description?.substring(0, 60) || 'No description'}
                      {video.description?.length > 60 && '...'}
                    </p>
                    <div className="related-video-meta">
                      <img
                        src={video.profiles?.avatar_url || '/default-avatar.png'}
                        alt={video.profiles?.username || 'User'}
                        className="related-video-avatar"
                      />
                      <span className="related-video-username">
                        {video.profiles?.username || 'Unknown'}
                      </span>
                    </div>
                    <div className="related-video-stats">
                      <span aria-label={`${formatCount(video.views_count || 0)} views`}>
                        👁️ {formatCount(video.views_count || 0)}
                      </span>
                      <span aria-label={`${formatCount(video.likes_count || 0)} likes`}>
                        ❤️ {formatCount(video.likes_count || 0)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="no-related-videos">
                <p>No related videos found</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Comments Modal */}
      <InstagramCommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        contentId={boltz.id}
        contentType="boltz"
        user={user}
        contentOwnerId={boltz.user_id}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        user={user}
        contentData={{
          id: boltz.id,
          contentType: 'boltz',
          description: boltz.description,
          video_url: boltz.video_url,
          thumbnail_url: boltz.thumbnail_url,
          username: boltz.profiles?.username,
          user_id: boltz.user_id
        }}
      />
    </div>
  );
}

export default function BoltzDetail({ user }) {
  return (
    <ErrorBoundary>
      <BoltzDetailContent user={user} />
    </ErrorBoundary>
  );
}