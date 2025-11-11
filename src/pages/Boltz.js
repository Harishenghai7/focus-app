import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import InteractionBar from "../components/InteractionBar";
import { setupAutoPlay, trackVideoView } from "../utils/videoUtils";
import "./Boltz.css";

export default function Boltz({ user, userProfile }) {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const videoRefs = useRef([]);
  const observersRef = useRef([]);
  const viewTrackersRef = useRef([]);
  const [videoLoading, setVideoLoading] = useState({});
  const [swipeDirection, setSwipeDirection] = useState(null);
  const navigate = useNavigate();

  // Fetch videos and interactions
  useEffect(() => {
    fetchVideos();
    if (user?.id) fetchUserInteractions();
  }, [user?.id]);

  // Real-time listeners for Boltz, likes, comments, and shares
  useEffect(() => {
    if (!user?.id) return;

    // Boltz table subscription
    const boltzChannel = supabase
      .channel('boltz_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'boltz' },
        () => fetchVideos()
      )
      .subscribe();

    // Likes table subscription
    const likesChannel = supabase
      .channel('boltz_likes_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => fetchVideos()
      )
      .subscribe();

    // Comments table subscription
    const commentsChannel = supabase
      .channel('boltz_comments_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        () => fetchVideos()
      )
      .subscribe();

    return () => {
      boltzChannel.unsubscribe();
      likesChannel.unsubscribe();
      commentsChannel.unsubscribe();
    };
  }, [user?.id]);

  useEffect(() => {
    // Keyboard navigation
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowUp' && currentIndex > 0) handleScroll('up');
      else if (e.key === 'ArrowDown' && currentIndex < videos.length - 1) handleScroll('down');
      else if (e.key === ' ') {
        e.preventDefault();
        const video = videoRefs.current[currentIndex];
        if (video) video.paused ? video.play() : video.pause();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, videos]);

  // Setup auto-play with Intersection Observer for each video
  useEffect(() => {
    // Clean up previous observers and trackers
    observersRef.current.forEach(observer => observer?.disconnect());
    viewTrackersRef.current.forEach(cleanup => cleanup?.());
    observersRef.current = [];
    viewTrackersRef.current = [];

    // Setup new observers for all videos
    videoRefs.current.forEach((video, index) => {
      if (video) {
        // Setup auto-play observer
        const observer = setupAutoPlay(video, (isVisible) => {
          // When video becomes visible, it's the current video
          if (isVisible && index !== currentIndex) {
            setCurrentIndex(index);
          }
        });
        observersRef.current[index] = observer;

        // Setup view tracking (tracks after 3 seconds of playback)
        const cleanupTracker = trackVideoView(
          video,
          videos[index]?.id,
          async (videoId, watchTime) => {

            await handleViewTracked(videoId);
          },
          3 // Track after 3 seconds
        );
        viewTrackersRef.current[index] = cleanupTracker;
      }
    });

    // Cleanup on unmount
    return () => {
      observersRef.current.forEach(observer => observer?.disconnect());
      viewTrackersRef.current.forEach(cleanup => cleanup?.());
    };
  }, [videos, currentIndex]);

  // Ensure current video plays when index changes
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const { data, error} = await supabase
        .from("boltz")
        .select(`
          *,
          profiles!boltz_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const videosWithUrls = (data || []).map(video => ({
        ...video,
        video_url: video.video_url || '',
        likes_count: video.likes_count || 0,
        comments_count: video.comments_count || 0,
        shares_count: video.shares_count || 0
      }));
      setVideos(videosWithUrls);
    } catch (error) {

      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInteractions = async () => {
    try {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      setFollowedUsers(new Set(follows?.map(f => f.following_id) || []));
    } catch (error) {

      setFollowedUsers(new Set());
    }
  };

  const handleViewTracked = async (videoId) => {
    try {
      // Increment view count in database
      const { error } = await supabase
        .rpc('increment_boltz_views', { boltz_id: videoId });

      if (error) {

        // Fallback: direct update if RPC doesn't exist
        const { error: updateError } = await supabase
          .from('boltz')
          .update({ views_count: supabase.raw('views_count + 1') })
          .eq('id', videoId);
        
        if (updateError) {

        }
      }

      // Update local state
      setVideos(prevVideos =>
        prevVideos.map(video =>
          video.id === videoId
            ? { ...video, views_count: (video.views_count || 0) + 1 }
            : video
        )
      );
    } catch (error) {

    }
  };

  const handleScroll = (direction) => {
    setSwipeDirection(direction);
    
    if (direction === "up" && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (direction === "down" && currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
    
    // Clear swipe direction after animation
    setTimeout(() => setSwipeDirection(null), 300);
  };

  // Preload adjacent videos
  useEffect(() => {
    const preloadAdjacentVideos = () => {
      // Preload next video
      if (currentIndex < videos.length - 1) {
        const nextVideo = videos[currentIndex + 1];
        if (nextVideo?.video_url) {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.src = nextVideo.video_url;
        }
      }
      
      // Preload previous video
      if (currentIndex > 0) {
        const prevVideo = videos[currentIndex - 1];
        if (prevVideo?.video_url) {
          const video = document.createElement('video');
          video.preload = 'auto';
          video.src = prevVideo.video_url;
        }
      }
    };

    preloadAdjacentVideos();
  }, [currentIndex, videos]);

  const handleFollow = async (userId) => {
    try {
      const isFollowing = followedUsers.has(userId);
      if (isFollowing) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);
        setFollowedUsers(prev => {
          const newSet = new Set(prev); 
          newSet.delete(userId); 
          return newSet;
        });
      } else {
        await supabase
          .from("follows")
          .insert([{
            follower_id: user.id,
            following_id: userId
          }]);
        setFollowedUsers(prev => new Set([...prev, userId]));
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

    }
  };

  const handleShare = async (video) => {
    try {
      const shareUrl = `${window.location.origin}/boltz/${video.id}`;
      if (navigator.share) {
        await navigator.share({
          title: `Check out this video by ${video.users?.nickname || 'someone'}`,
          text: video.caption || "Amazing video on Focus!",
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        const toast = document.createElement('div');
        toast.textContent = 'Link copied to clipboard!';
        toast.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#333;color:white;padding:12px 24px;border-radius:8px;z-index:9999;font-size:14px';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 2000);
      }
    } catch (error) {

    }
  };

  const fetchComments = async (videoId) => {
    try {
      const { data } = await supabase
        .from("comments")
        .select(`
          *,
          users!comments_user_id_fkey(id, nickname, avatar_url)
        `)
        .eq("boltz_id", videoId)
        .order("created_at", { ascending: false });
      setComments(data || []);
    } catch (error) {

      setComments([]);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const video = videos[currentIndex];
      const { data, error } = await supabase
        .from("comments")
        .insert([{
          content_id: video.id,
          content_type: 'boltz',
          user_id: user.id,
          text: newComment.trim()
        }])
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .single();
      
      if (error) throw error;
      
      setComments(prev => [data, ...prev]);
      setNewComment("");
      
      if (video.user_id !== user.id) {
        await supabase
          .from("notifications")
          .insert([{
            user_id: video.user_id,
            from_user_id: user.id,
            type: "comment",
            boltz_id: video.id,
            content: `commented: ${newComment.trim().substring(0, 50)}`
          }]);
      }
    } catch (error) {

    }
  };

  const toggleComments = () => {
    if (!showComments) fetchComments(videos[currentIndex]?.id);
    setShowComments(!showComments);
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

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

  if (!videos || videos.length === 0) {
    return (
      <div className="page page-boltz">
        <div className="boltz-empty">
          <div className="empty-icon">🎬</div>
          <h3>No videos yet</h3>
          <p>Be the first to create a Boltz video!</p>
          <button 
            className="btn-primary"
            onClick={() => navigate("/create")}
          >
            Create Video
          </button>
        </div>
      </div>
    );
  }

  const currentVideo = videos[currentIndex];

  if (!currentVideo) {
    return (
      <div className="page page-boltz">
        <div className="boltz-empty">
          <div className="empty-icon">🎬</div>
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-boltz">
      <div className="swipe-indicators">
        {currentIndex > 0 && (
          <motion.div 
            className="swipe-indicator swipe-up"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M7 14l5-5 5 5"/>
            </svg>
            <span>Swipe up</span>
          </motion.div>
        )}
        {currentIndex < videos.length - 1 && (
          <motion.div 
            className="swipe-indicator swipe-down"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5"/>
            </svg>
            <span>Swipe down</span>
          </motion.div>
        )}
      </div>

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
              ease: [0.4, 0, 0.2, 1] // Smooth easing
            }}
          >
            <video
              ref={el => videoRefs.current[currentIndex] = el}
              src={currentVideo.video_url}
              className="boltz-video"
              loop
              playsInline
              autoPlay
              controls={false}
              poster={currentVideo.thumbnail_url}
              onLoadStart={() => {
                setVideoLoading(prev => ({ ...prev, [currentVideo.id]: true }));
              }}
              onCanPlay={() => {
                setVideoLoading(prev => ({ ...prev, [currentVideo.id]: false }));
              }}
              onDoubleClick={() => {}}
              onClick={(e) => {
                if (e.target.muted) {
                  e.target.muted = false;
                } else {
                  if (e.target.paused) {
                    e.target.play();
                  } else {
                    e.target.pause();
                  }
                }
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                const startY = touch.clientY;
                const startTime = Date.now();
                let moved = false;

                const handleTouchMove = (moveEvent) => {
                  const moveTouch = moveEvent.touches[0];
                  const deltaY = startY - moveTouch.clientY;
                  const deltaTime = Date.now() - startTime;
                  
                  // Require minimum swipe distance and velocity
                  if (Math.abs(deltaY) > 50 && !moved) {
                    moved = true;
                    const velocity = Math.abs(deltaY) / deltaTime;
                    
                    // Only trigger if swipe is fast enough (velocity > 0.3 px/ms)
                    if (velocity > 0.3) {
                      if (deltaY > 0 && currentIndex < videos.length - 1) {
                        handleScroll("down");
                      } else if (deltaY < 0 && currentIndex > 0) {
                        handleScroll("up");
                      }
                    }
                    document.removeEventListener('touchmove', handleTouchMove);
                  }
                };

                const handleTouchEnd = () => {
                  document.removeEventListener('touchmove', handleTouchMove);
                  document.removeEventListener('touchend', handleTouchEnd);
                };

                document.addEventListener('touchmove', handleTouchMove);
                document.addEventListener('touchend', handleTouchEnd);
              }}
            />

            {/* Overlay Video Loading Indicator */}
            {videoLoading[currentVideo.id] && (
              <div className="video-loading-overlay">
                <div className="loading-spinner"></div>
                <p>Loading video...</p>
              </div>
            )}

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
                    style={{ cursor: 'pointer' }}
                  />
                  <div className="user-text">
                    <div className="username-container">
                      <span className="username">{currentVideo.profiles?.username || currentVideo.profiles?.full_name || 'User'}</span>
                    </div>
                    <span className="video-time">{formatTimeAgo(currentVideo.created_at)}</span>
                  </div>
                </div>
                {currentVideo.user_id !== user?.id && (
                  <button 
                    className={`follow-btn ${followedUsers.has(currentVideo.user_id) ? 'following' : ''}`}
                    onClick={() => handleFollow(currentVideo.user_id)}
                  >
                    {followedUsers.has(currentVideo.user_id) ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
              {currentVideo.description && (
                <div className="video-description">
                  <p>{currentVideo.description}</p>
                </div>
              )}
              {currentVideo.views_count > 0 && (
                <div className="video-stats">
                  <span className="view-count">
                    👁️ {formatCount(currentVideo.views_count || 0)} views
                  </span>
                </div>
              )}
            </div>

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
                  className="boltz-interaction-bar"
                  size="large"
                  showCounts={true}
                  showSave={true}
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
                  className="action-btn create-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/create?type=boltz");
                  }}
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
      <div className="video-progress">
        <div className="progress-info">
          <span className="current-video">{currentIndex + 1}</span>
          <span className="total-videos">/ {videos.length}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentIndex + 1) / videos.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="keyboard-hint">
        <span>Use ↑↓ arrow keys or swipe to navigate</span>
      </div>
    </div>
  );
}