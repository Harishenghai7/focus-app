import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import InteractionBar from "../components/InteractionBar";
import ReelPlayer from "../components/ReelPlayer";
import CommentSection from "../components/CommentSection";
import ShareModal from "../components/ShareModal";
import FollowButton from "../components/FollowButton";
import { setupAutoPlay, trackVideoView } from "../utils/videoUtils";
import { useRealtimeInteractions } from "../hooks/useRealtimeInteractions";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import { getVideoDuration, formatDuration } from "../utils/mediaUtils";
import "./Boltz.css";
import { components, hooks, utils } from '@/importMap';
import MusicPlayer from '../components/MusicPlayer/MusicPlayer';

export default function Boltz({ user, userProfile }) {
  // Track page view for analytics
  useEffect(() => {
    utils.trackPageView('Boltz');
    utils.trackEvent('page_view', 'boltz', 'user_visit');
  }, []);

  // Measure load time for performance
  useEffect(() => {
    const loadTime = utils.measureLoadTime();
    if (loadTime) utils.logPerformance('boltz_load_time', loadTime);
  }, []);

  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [feedMode, setFeedMode] = useState('forYou'); // 'forYou' | 'following'
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [videoLoading, setVideoLoading] = useState({});
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [videoDurations, setVideoDurations] = useState({});
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [soundInfo, setSoundInfo] = useState({});
  const [selectedVideoForShare, setSelectedVideoForShare] = useState(null);
  const [selectedVideoForComments, setSelectedVideoForComments] = useState(null);
  const [likedVideos, setLikedVideos] = useState(new Set());
  const videoRefs = useRef([]);
  const observersRef = useRef([]);
  const viewTrackersRef = useRef([]);
  const navigate = useNavigate();
  const lastSwipeTime = useRef(0);
  const preloadCache = useRef(new Set());
  const containerRef = useRef(null);
  const lastTapTime = useRef(0);
  const tapTimeoutRef = useRef(null);

  // Fetch videos with enhanced error handling and caching
  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("boltz")
        .select(`
          *,
          profiles!boltz_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(50); // Limit initial load for performance

      if (error) throw error;

      const videosWithUrls = (data || []).map(video => ({
        ...video,
        video_url: video.video_url || '',
        likes_count: video.likes_count || 0,
        comments_count: video.comments_count || 0,
        shares_count: video.shares_count || 0,
        views_count: video.views_count || 0
      }));

      setVideos(videosWithUrls);
    } catch (error) {
      console.error("Error fetching videos:", error);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use custom hooks (after fetchVideos is defined)
  const { interactions, updateInteraction } = useRealtimeInteractions(videos);
  const { 
    hasNextPage, 
    fetchNextPage, 
    isFetchingNextPage 
  } = useInfiniteScroll({
    fetchFn: fetchVideos,
    threshold: 0.8
  });

  // True Pro Real-time Subscriptions for Boltz
  useEffect(() => {
    if (!user?.id) return;
    const tables = ['boltz', 'likes', 'comments'];
    const channels = tables.map(tbl =>
      supabase
        .channel(`boltz_${tbl}_chan`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tbl }, () => fetchVideos())
        .subscribe()
    );
    return () => channels.forEach(c => c.unsubscribe && c.unsubscribe());
  }, [user?.id, fetchVideos]);

  // Fetch user interactions
  const fetchUserInteractions = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      setFollowedUsers(new Set(follows?.map(f => f.following_id) || []));

      // Fetch user's likes
      const { data: likes } = await supabase
        .from("likes")
        .select("content_id")
        .eq("user_id", user.id)
        .eq("content_type", "boltz");
      setLikedVideos(new Set(likes?.map(l => l.content_id) || []));
    } catch (error) {
      console.error("Error fetching interactions:", error);
      setFollowedUsers(new Set());
      setLikedVideos(new Set());
    }
  }, [user?.id]);

  // Initial data fetch
  useEffect(() => {
    fetchVideos();
    if (user?.id) fetchUserInteractions();
  }, [fetchVideos, fetchUserInteractions, user?.id]);

  // Real-time subscriptions with debouncing
  useEffect(() => {
    if (!user?.id) return;

    const channels = [];
    let debounceTimer;

    const handleUpdate = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => fetchVideos(), 1000);
    };

    // Boltz table subscription
    const boltzChannel = supabase
      .channel('boltz_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'boltz' },
        handleUpdate
      )
      .subscribe();
    channels.push(boltzChannel);

    // Likes table subscription
    const likesChannel = supabase
      .channel('boltz_likes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        handleUpdate
      )
      .subscribe();
    channels.push(likesChannel);

    // Comments table subscription
    const commentsChannel = supabase
      .channel('boltz_comments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        handleUpdate
      )
      .subscribe();
    channels.push(commentsChannel);

    return () => {
      clearTimeout(debounceTimer);
      channels.forEach(channel => channel.unsubscribe());
    };
  }, [user?.id, fetchVideos]);

  // Keyboard navigation with better UX
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault();
        handleScroll('up');
      } else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) {
        e.preventDefault();
        handleScroll('down');
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, videos.length]);

  // Build displayed list based on tab
  const displayedVideos = useMemo(() => {
    if (feedMode === 'following') {
      return videos.filter(v => followedUsers.has(v.user_id) || v.user_id === user?.id);
    }
    return videos;
  }, [videos, feedMode, followedUsers, user?.id]);

  // Get current video
  const currentVideo = useMemo(() => {
    return displayedVideos[currentIndex];
  }, [displayedVideos, currentIndex]);

  // Reset index if switching tabs causes out-of-range
  useEffect(() => {
    if (currentIndex >= displayedVideos.length) {
      setCurrentIndex(0);
    }
  }, [displayedVideos.length]);

  // Setup auto-play with Intersection Observer
  useEffect(() => {
    observersRef.current.forEach(observer => observer?.disconnect());
    viewTrackersRef.current.forEach(cleanup => cleanup?.());
    observersRef.current = [];
    viewTrackersRef.current = [];

    videoRefs.current.forEach((video, index) => {
      if (video) {
        // Setup auto-play observer
        const observer = setupAutoPlay(video, (isVisible) => {
          if (isVisible && index !== currentIndex) {
            setCurrentIndex(index);
          }
        });
        observersRef.current[index] = observer;

        // Setup view tracking (3 seconds)
        const videoId = displayedVideos[index]?.id;
        if (videoId) {
          const cleanupTracker = trackVideoView(
            video,
            videoId,
            async (vid) => {
              await handleViewTracked(vid);
            },
            3
          );
          viewTrackersRef.current[index] = cleanupTracker;
        }
      }
    });

    return () => {
      observersRef.current.forEach(observer => observer?.disconnect());
      viewTrackersRef.current.forEach(cleanup => cleanup?.());
    };
  }, [displayedVideos, currentIndex]);

  // Enhanced video playback control
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(err => {
            console.log("Auto-play blocked:", err);
            // If autoplay is blocked, try unmuted
            if (video.muted) {
              video.muted = false;
              setIsMuted(false);
              video.play().catch(console.error);
            }
          });
        } else {
          video.pause();
          video.currentTime = 0; // Reset video to start
        }
      }
    });
  }, [currentIndex]);

  // Intelligent preloading
  useEffect(() => {
    const preloadVideos = () => {
      const indicesToPreload = [
        currentIndex + 1,
        currentIndex + 2,
        currentIndex - 1
      ].filter(i => i >= 0 && i < displayedVideos.length);

      indicesToPreload.forEach(index => {
        const video = displayedVideos[index];
        if (video?.video_url && !preloadCache.current.has(video.video_url)) {
          const preloadVideo = document.createElement('video');
          preloadVideo.preload = 'auto';
          preloadVideo.src = video.video_url;
          preloadCache.current.add(video.video_url);
        }
      });
    };

    const timer = setTimeout(preloadVideos, 500);
    return () => clearTimeout(timer);
  }, [currentIndex, displayedVideos]);

  // View tracking with optimistic updates
  const handleViewTracked = async (videoId) => {
    try {
      // Optimistic update
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? { ...video, views_count: (video.views_count || 0) + 1 }
            : video
        )
      );

      // Server update with RPC fallback
      const { error } = await supabase.rpc('increment_boltz_views', { 
        boltz_id: videoId 
      });

      if (error) {
        // Fallback to direct update
        await supabase
          .from('boltz')
          .update({ views_count: supabase.raw('COALESCE(views_count, 0) + 1') })
          .eq('id', videoId);
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  // Smooth scroll handler with debouncing
  const handleScroll = useCallback((direction) => {
    const now = Date.now();
    if (now - lastSwipeTime.current < 500) return; // Prevent rapid scrolling
    
    lastSwipeTime.current = now;
    setSwipeDirection(direction);
    
    if (direction === "up" && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (direction === "down" && currentIndex < displayedVideos.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
    
    setTimeout(() => setSwipeDirection(null), 300);
  }, [currentIndex, displayedVideos.length]);

  // Mouse wheel scroll
  useEffect(() => {
    let wheelTimeout;
    const handleWheel = (e) => {
      e.preventDefault();
      clearTimeout(wheelTimeout);
      
      wheelTimeout = setTimeout(() => {
        const delta = e.deltaY;
        if (Math.abs(delta) > 30) {
          if (delta > 0 && currentIndex < displayedVideos.length - 1) {
            handleScroll("down");
          } else if (delta < 0 && currentIndex > 0) {
            handleScroll("up");
          }
        }
      }, 50);
    };

    const container = document.querySelector('.boltz-container');
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        clearTimeout(wheelTimeout);
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [currentIndex, displayedVideos.length, handleScroll]);

  // Follow/Unfollow with optimistic updates
  const handleFollow = async (userId) => {
    if (!user?.id) return;
    
    try {
      const isFollowing = followedUsers.has(userId);
      
      // Optimistic update
      setFollowedUsers(prev => {
        const newSet = new Set(prev);
        isFollowing ? newSet.delete(userId) : newSet.add(userId);
        return newSet;
      });

      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);
      } else {
        await supabase
          .from("follows")
          .insert([{
            follower_id: user.id,
            following_id: userId
          }]);
        
        // Send notification
        await supabase
          .from("notifications")
          .insert([{
            user_id: userId,
            from_user_id: user.id,
            type: "follow",
            content: "started following you"
          }]);
      }
    } catch (error) {
      console.error("Error following user:", error);
      // Revert optimistic update on error
      fetchUserInteractions();
    }
  };

  // Share functionality
  const handleShare = async (video) => {
    try {
      const shareUrl = `${window.location.origin}/boltz/${video.id}`;
      const shareData = {
        title: `Check out this video by ${video.profiles?.username || 'someone'}`,
        text: video.description || "Amazing video on Focus!",
        url: shareUrl
      };

      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Link copied to clipboard! 📋');
      }

      // Track share
      await supabase.rpc('increment_boltz_shares', { boltz_id: video.id });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error("Error sharing:", error);
      }
    }
  };

  // Toast notification helper
  const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'boltz-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.paused ? video.play().catch(console.error) : video.pause();
    }
  };

  // Toggle mute
  const toggleMute = () => {
    const video = videoRefs.current[currentIndex];
    if (video) {
      video.muted = !video.muted;
      setIsMuted(video.muted);
      setShowVolumeControl(true);
      setTimeout(() => setShowVolumeControl(false), 1500);
    }
  };

  // Double-tap to like
  const handleDoubleTap = async (e, videoId) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapTime.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      e.preventDefault();
      clearTimeout(tapTimeoutRef.current);
      await handleLike(videoId);
      showLikeAnimation(e);
    } else {
      // Single tap - wait to see if double tap comes
      tapTimeoutRef.current = setTimeout(() => {
        // Single tap action (play/pause)
        togglePlayPause();
      }, DOUBLE_TAP_DELAY);
    }
    
    lastTapTime.current = now;
  };

  // Handle like action
  const handleLike = async (videoId) => {
    if (!user?.id) return;

    try {
      const isLiked = likedVideos.has(videoId);

      // Optimistic update
      setLikedVideos(prev => {
        const newSet = new Set(prev);
        isLiked ? newSet.delete(videoId) : newSet.add(videoId);
        return newSet;
      });

      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? { ...video, likes_count: (video.likes_count || 0) + (isLiked ? -1 : 1) }
            : video
        )
      );

      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("content_id", videoId)
          .eq("content_type", "boltz");
      } else {
        await supabase
          .from("likes")
          .insert([{
            user_id: user.id,
            content_id: videoId,
            content_type: "boltz"
          }]);

        // Send notification to video owner
        const video = videos.find(v => v.id === videoId);
        if (video && video.user_id !== user.id) {
          await supabase
            .from("notifications")
            .insert([{
              user_id: video.user_id,
              from_user_id: user.id,
              type: "like",
              content_type: "boltz",
              content_id: videoId,
              content: "liked your video"
            }]);
        }
      }

      utils.trackEvent('boltz_like', isLiked ? 'unlike' : 'like', videoId);
    } catch (error) {
      console.error("Error liking video:", error);
      fetchUserInteractions();
    }
  };

  // Show like animation
  const showLikeAnimation = (e) => {
    const heart = document.createElement('div');
    heart.className = 'boltz-like-animation';
    heart.innerHTML = '❤️';
    heart.style.left = `${e.clientX || e.touches?.[0]?.clientX || window.innerWidth / 2}px`;
    heart.style.top = `${e.clientY || e.touches?.[0]?.clientY || window.innerHeight / 2}px`;
    document.body.appendChild(heart);
    
    setTimeout(() => document.body.removeChild(heart), 1000);
  };

  // Open comments
  const handleOpenComments = (video) => {
    setSelectedVideoForComments(video);
    setShowComments(true);
    utils.trackEvent('boltz_comments', 'open', video.id);
  };

  // Close comments
  const handleCloseComments = () => {
    setShowComments(false);
    setSelectedVideoForComments(null);
  };

  // Open share modal
  const handleOpenShare = (video) => {
    setSelectedVideoForShare(video);
    setShowShareModal(true);
    utils.trackEvent('boltz_share', 'open', video.id);
  };

  // Close share modal
  const handleCloseShare = () => {
    setShowShareModal(false);
    setSelectedVideoForShare(null);
  };

  // Extract sound/music info from video
  useEffect(() => {
    const extractSoundInfo = async () => {
      if (currentVideo && currentVideo.music_info) {
        setSoundInfo(prev => ({
          ...prev,
          [currentVideo.id]: currentVideo.music_info
        }));
      } else if (currentVideo && currentVideo.sound_name) {
        setSoundInfo(prev => ({
          ...prev,
          [currentVideo.id]: {
            name: currentVideo.sound_name,
            artist: currentVideo.sound_artist || 'Original Sound'
          }
        }));
      }
    };

    extractSoundInfo();
  }, [currentVideo]);

  // Format helpers
  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

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

  // Loading state
  if (loading) {
    return (
      <div className="page page-boltz">
        <div className="boltz-loading">
          <div className="loading-spinner"></div>
          <h3>Loading Boltz...</h3>
        </div>
      </div>
    );
  }

  // Empty state
  if (!displayedVideos || displayedVideos.length === 0) {
    return (
      <div className="page page-boltz">
        {/* Top bar with tabs and back button */}
        <div className="boltz-topbar">
          <button
            className="boltz-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>
          <div className="boltz-tabs" role="tablist" aria-label="Feed tabs">
            <button
              role="tab"
              aria-selected={feedMode === 'forYou'}
              className={`boltz-tab ${feedMode === 'forYou' ? 'active' : ''}`}
              onClick={() => setFeedMode('forYou')}
            >
              For You
            </button>
            <button
              role="tab"
              aria-selected={feedMode === 'following'}
              className={`boltz-tab ${feedMode === 'following' ? 'active' : ''}`}
              onClick={() => setFeedMode('following')}
            >
              Following
            </button>
          </div>
        </div>
        <div className="boltz-empty">
          <div className="empty-icon">🎬</div>
          <h3>No videos yet</h3>
          <p>Be the first to create a Boltz video!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate("/create?type=boltz")}
          >
            Create Video
          </button>
        </div>
      </div>
    );
  }

  // currentVideo is now defined earlier using useMemo

  if (!currentVideo) {
    return (
      <div className="page page-boltz">
        <div className="boltz-loading">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <components.ErrorBoundary>
      <motion.main className="page page-boltz" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Top bar with tabs and back button */}
        <div className="boltz-topbar">
          <button
            className="boltz-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ←
          </button>
          <div className="boltz-tabs" role="tablist" aria-label="Feed tabs">
            <button
              role="tab"
              aria-selected={feedMode === 'forYou'}
              className={`boltz-tab ${feedMode === 'forYou' ? 'active' : ''}`}
              onClick={() => setFeedMode('forYou')}
            >
              For You
            </button>
            <button
              role="tab"
              aria-selected={feedMode === 'following'}
              className={`boltz-tab ${feedMode === 'following' ? 'active' : ''}`}
              onClick={() => setFeedMode('following')}
            >
              Following
            </button>
          </div>
        </div>

        {/* Navigation Indicators */}
        <AnimatePresence>
          {displayedVideos.length > 1 && (
            <div className="swipe-indicators" role="navigation" aria-label="Video navigation">
              {currentIndex > 0 && (
                <motion.button
                  className="swipe-indicator swipe-up"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  whileHover={{ opacity: 1, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleScroll("up")}
                  aria-label="Previous video"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M18 15l-6-6-6 6"/>
                  </svg>
                  <span>Swipe up</span>
                </motion.button>
              )}
              {currentIndex < displayedVideos.length - 1 && (
                <motion.button
                  className="swipe-indicator swipe-down"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ opacity: 1, y: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleScroll("down")}
                  aria-label="Next video"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                  <span>Swipe down</span>
                </motion.button>
              )}
            </div>
          )}
        </AnimatePresence>

        {/* Video Container */}
        <div className="boltz-container">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVideo.id}
              className="video-wrapper"
              initial={{ 
                opacity: 0, 
                y: swipeDirection === 'down' ? 100 : swipeDirection === 'up' ? -100 : 0,
                scale: 0.95
              }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: 1
              }}
              exit={{ 
                opacity: 0, 
                y: swipeDirection === 'down' ? -100 : swipeDirection === 'up' ? 100 : 0,
                scale: 0.95
              }}
              transition={{ 
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              {/* Use ReelPlayer component for better video handling */}
              <ReelPlayer
                ref={el => videoRefs.current[currentIndex] = el}
                src={currentVideo.video_url}
                poster={currentVideo.thumbnail_url}
                isMuted={isMuted}
                isPlaying={true}
                onDoubleTap={(e) => handleDoubleTap(e, currentVideo.id)}
                onLoadStart={() => {
                  setVideoLoading(prev => ({ ...prev, [currentVideo.id]: true }));
                }}
                onCanPlay={() => {
                  setVideoLoading(prev => ({ ...prev, [currentVideo.id]: false }));
                }}
                onError={(e) => {
                  console.error('Video load error:', e);
                  setVideoLoading(prev => ({ ...prev, [currentVideo.id]: false }));
                }}
                onSwipe={(direction) => handleScroll(direction)}
                className="boltz-video"
                aria-label={`Video by ${currentVideo.profiles?.username || 'User'}`}
              />

              {/* Video Loading Indicator */}
              {videoLoading[currentVideo.id] && (
                <div className="video-loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>Loading video...</p>
                </div>
              )}

              {/* Volume Control Indicator */}
              <AnimatePresence>
                {showVolumeControl && (
                  <motion.div
                    className="volume-indicator"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Video Overlay */}
              <div className="video-overlay">
                <div className="video-user-info">
                  <div className="user-details">
                    <img 
                      src={currentVideo.profiles?.avatar_url || "/default-avatar.png"}
                      alt={currentVideo.profiles?.username || 'User'}
                      className="user-avatar"
                      onClick={() => {
                        const username = currentVideo.profiles?.username;
                        if (username) navigate(`/profile/${username}`);
                      }}
                    />
                    <div className="user-text">
                      <div className="username-container">
                        <span className="username">
                          {currentVideo.profiles?.username || currentVideo.profiles?.full_name || 'User'}
                        </span>
                      </div>
                      <span className="video-time">{formatTimeAgo(currentVideo.created_at)}</span>
                    </div>
                  </div>
                  {currentVideo.user_id !== user?.id && (
                    <FollowButton
                      userId={currentVideo.user_id}
                      isFollowing={followedUsers.has(currentVideo.user_id)}
                      onFollow={() => handleFollow(currentVideo.user_id)}
                      size="medium"
                      showIcon={false}
                    />
                  )}
                </div>
                
                {currentVideo.description && (
                  <div className="video-description">
                    <p>{currentVideo.description}</p>
                  </div>
                )}

                {/* Sound/Music Info */}
                {(soundInfo[currentVideo.id] || currentVideo.sound_name) && (
                  <motion.div 
                    className="sound-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="sound-icon">🎵</div>
                    <div className="sound-details">
                      <span className="sound-name">
                        {soundInfo[currentVideo.id]?.name || currentVideo.sound_name || 'Original Sound'}
                      </span>
                      {(soundInfo[currentVideo.id]?.artist || currentVideo.sound_artist) && (
                        <span className="sound-artist">
                          {soundInfo[currentVideo.id]?.artist || currentVideo.sound_artist}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
                {/* MusicPlayer for boltz if music fields present */}
                {currentVideo.music_url && (
                  <div className="boltz-music-player">
                    <MusicPlayer
                      musicTitle={currentVideo.music_title}
                      musicArtist={currentVideo.music_artist}
                      musicUrl={currentVideo.music_url}
                      musicLicense={currentVideo.music_license}
                      compact={true}
                    />
                  </div>
                )}
                
                {currentVideo.views_count > 0 && (
                  <div className="video-stats">
                    <span className="view-count">
                      👁️ {formatCount(currentVideo.views_count)} views
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="video-actions">
                <div className="boltz-interactions">
                  <InteractionBar
                    contentId={currentVideo.id}
                    contentType="boltz"
                    user={user}
                    contentData={{
                      id: currentVideo.id,
                      contentType: 'boltz',
                      description: currentVideo.description,
                      video_url: currentVideo.video_url,
                      thumbnail_url: currentVideo.thumbnail_url,
                      username: currentVideo.profiles?.username
                    }}
                    initialLikesCount={currentVideo.likes_count}
                    initialCommentsCount={currentVideo.comments_count}
                    initialSharesCount={currentVideo.shares_count}
                    isLiked={likedVideos.has(currentVideo.id)}
                    onLike={() => handleLike(currentVideo.id)}
                    onComment={() => handleOpenComments(currentVideo)}
                    onShare={() => handleOpenShare(currentVideo)}
                    className="boltz-interaction-bar"
                    size="large"
                    showCounts={true}
                    showSave={true}
                    vertical={true}
                  />
                </div>
                
                <div className="boltz-profile-actions">
                  <motion.button 
                    className="action-btn profile-btn"
                    onClick={() => {
                      const username = currentVideo.profiles?.username;
                      if (username) navigate(`/profile/${username}`);
                    }}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    title="View Profile"
                  >
                    <img 
                      src={currentVideo.profiles?.avatar_url || "/default-avatar.png"}
                      alt={currentVideo.profiles?.username || 'User'}
                      className="profile-avatar-btn"
                    />
                  </motion.button>
                  
                  <motion.button 
                    className="action-btn volume-btn"
                    onClick={toggleMute}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    <div className="volume-icon">
                      {isMuted ? (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                          <line x1="23" y1="9" x2="17" y2="15"/>
                          <line x1="17" y1="9" x2="23" y2="15"/>
                        </svg>
                      ) : (
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 5L6 9H2v6h4l5 4V5z"/>
                          <path d="M15.54 8.46a5 5 0 010 7.07"/>
                          <path d="M19.07 4.93a10 10 0 010 14.14"/>
                        </svg>
                      )}
                    </div>
                  </motion.button>
                  
                  <motion.button 
                    className="action-btn create-btn"
                    onClick={() => navigate("/create?type=boltz")}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    title="Create Boltz"
                  >
                    <div className="create-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress Indicator */}
        <div className="video-progress">
          <div className="progress-info">
            <span className="current-video">{currentIndex + 1}</span>
            <span className="total-videos">/ {displayedVideos.length}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentIndex + 1) / displayedVideos.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Keyboard Hint */}
        <AnimatePresence>
          {displayedVideos.length > 1 && (
            <motion.div 
              className="keyboard-hint"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1 }}
            >
              <span>Use ↑↓ arrows, mouse wheel, or swipe • Space to play/pause • M to mute • Double-tap to like</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comment Section Slide-up */}
        <AnimatePresence>
          {showComments && selectedVideoForComments && (
            <motion.div
              className="comments-slide-up-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseComments}
            >
              <motion.div
                className="comments-slide-up-container"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="comments-slide-up-header">
                  <h3>Comments</h3>
                  <button 
                    className="close-comments-btn"
                    onClick={handleCloseComments}
                    aria-label="Close comments"
                  >
                    ✕
                  </button>
                </div>
                <CommentSection
                  contentId={selectedVideoForComments.id}
                  contentType="boltz"
                  user={user}
                  onClose={handleCloseComments}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && selectedVideoForShare && (
            <ShareModal
              isOpen={showShareModal}
              onClose={handleCloseShare}
              contentId={selectedVideoForShare.id}
              contentType="boltz"
              contentData={{
                title: `Video by ${selectedVideoForShare.profiles?.username || 'User'}`,
                description: selectedVideoForShare.description || 'Check out this amazing video!',
                url: `${window.location.origin}/boltz/${selectedVideoForShare.id}`,
                thumbnail: selectedVideoForShare.thumbnail_url,
                video_url: selectedVideoForShare.video_url
              }}
              user={user}
            />
          )}
        </AnimatePresence>
      </motion.main>
    </components.ErrorBoundary>
  );
}
