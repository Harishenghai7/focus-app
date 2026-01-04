import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ViewersModal from "../components/ViewersModal";
import { components, hooks, utils } from '@/importMap';
import "./Flash.css";

export default function Flash({ user, userProfile }) {
  // Track page view for analytics
  useEffect(() => {
    utils.trackPageView('Flash');
  }, []);

  // Measure load time for performance
  useEffect(() => {
    const loadTime = utils.measureLoadTime();
    if (loadTime) utils.logPerformance('flash_load_time', loadTime);
  }, []);

  const myUserId = user?.id;
  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [viewsCount, setViewsCount] = useState(0);
  const progressInterval = useRef(null);
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchStories();
  }, [userId, myUserId]);

  useEffect(() => {
    if (stories.length > 0) {
      const storyId = searchParams.get('story');
      if (storyId) {
        const index = stories.findIndex(s => s.id === storyId);
        if (index !== -1) {
          setCurrentIndex(index);
        }
      }
    }
  }, [stories, searchParams]);

  useEffect(() => {
    if (stories.length > 0 && stories[currentIndex]) {
      startProgress();
      trackView(stories[currentIndex].id);
      fetchViewsCount(stories[currentIndex].id);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, stories]);

  const fetchStories = async () => {
    try {
      let query = supabase
        .from("flash")
        .select(`
          *,
          profiles:user_id(id, username, full_name, avatar_url, is_verified)
        `)
        .gt('expires_at', new Date().toISOString())
        .order("created_at", { ascending: false });

      if (userId) {
        // Fetch stories for specific user
        const { data: targetUser } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", userId)
          .single();
        
        if (targetUser) {
          query = query.eq("user_id", targetUser.id);
        }
      } else {
        // Fetch stories from followed users and own stories
        const { data: following } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", myUserId);

        const followingIds = following?.map(f => f.following_id) || [];
        followingIds.push(myUserId); // Include own stories
        
        if (followingIds.length > 0) {
          query = query.in("user_id", followingIds);
        }
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Remove duplicates and ensure proper ordering
      const uniqueStories = data?.filter((story, index, self) => 
        index === self.findIndex(s => s.id === story.id)
      ) || [];
      
      setStories(uniqueStories);
    } catch (error) {

      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const startProgress = () => {
    setProgress(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Story duration: 5 seconds (5000ms)
    const STORY_DURATION = 5000;
    const UPDATE_INTERVAL = 50; // Update every 50ms for smooth animation
    const INCREMENT = (100 / (STORY_DURATION / UPDATE_INTERVAL));

    progressInterval.current = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return Math.min(prev + INCREMENT, 100);
        });
      }
    }, UPDATE_INTERVAL);
  };

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      navigate('/');
    }
  };

  const previousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      navigate('/');
    }
  };

  // 🔥 UPDATED: Track view using RPC function
  const trackView = async (flashId) => {
    if (!flashId || !myUserId) return;
    
    // Don't track view on own stories
    if (stories[currentIndex]?.user_id === myUserId) return;

    try {
      // Use RPC function for better error handling and duplicate prevention
      const { data, error } = await supabase.rpc('track_flash_view', {
        flash_uuid: flashId,
        viewer_uuid: myUserId
      });

      if (error) {

      } else if (data?.is_new_view) {

        // Refresh view count after tracking new view
        fetchViewsCount(flashId);
      }
    } catch (error) {

    }
  };

  // 🔥 UPDATED: Fetch views count using RPC function
  const fetchViewsCount = async (flashId) => {
    if (!flashId) return;

    try {
      const { data, error } = await supabase.rpc('get_flash_view_count', {
        flash_uuid: flashId
      });

      if (error) throw error;
      setViewsCount(data || 0);
    } catch (error) {

      setViewsCount(0);
    }
  };

  const handleTap = (e) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Left side: previous, Right side: next
    if (x < width / 3) {
      previousStory();
    } else if (x > (width * 2 / 3)) {
      nextStory();
    } else {
      // Center: toggle pause
      setIsPaused(prev => !prev);
    }
  };

  // Enhanced touch/swipe handling
  const touchStartRef = useRef(null);
  const touchStartTimeRef = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    touchStartTimeRef.current = Date.now();
    setIsPaused(true);
  };

  const handleTouchMove = (e) => {
    if (!touchStartRef.current) return;
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (!touchStartRef.current || !touchStartTimeRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartTimeRef.current;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Reset touch state
    touchStartRef.current = null;
    touchStartTimeRef.current = null;
    setIsPaused(false);

    // Swipe detection: minimum distance and velocity
    if (distance > 50 && velocity > 0.2) {
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (deltaY < 0 && currentIndex < stories.length - 1) {
          // Swipe up: next story
          nextStory();
        } else if (deltaY > 0 && currentIndex > 0) {
          // Swipe down: previous story
          previousStory();
        }
      } else {
        // Horizontal swipe
        if (deltaX < 0 && currentIndex < stories.length - 1) {
          // Swipe left: next story
          nextStory();
        } else if (deltaX > 0 && currentIndex > 0) {
          // Swipe right: previous story
          previousStory();
        }
      }
    } else if (distance < 10) {
      // Tap: toggle pause
      setIsPaused(prev => !prev);
    }
  };

  const handleHold = () => {
    setIsPaused(true);
  };

  const handleRelease = () => {
    setIsPaused(false);
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "now";
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  if (loading) {
    return (
      <div className="page page-flash">
        <div className="flash-loading">
          <div className="loading-spinner"></div>
          <p>Loading stories...</p>
        </div>
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="page page-flash">
        <div className="flash-empty">
          <div className="empty-icon">⚡</div>
          <h3>No stories available</h3>
          <p>Stories you create will appear here for 24 hours</p>
          <button 
            className="btn-primary"
            onClick={() => navigate("/create")}
          >
            Create Story
          </button>
        </div>
      </div>
    );
  }

  const currentStory = stories[currentIndex];

  return (
    <components.ErrorBoundary>
      <motion.main className="page page-flash" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="flash-container"
          onClick={handleTap}
          onMouseDown={handleHold}
          onMouseUp={handleRelease}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          role="application"
          aria-label="Story viewer"
        >
          {/* Progress Bars */}
          <motion.div 
            className="story-progress-bars"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {stories.map((_, index) => (
              <div key={index} className="progress-bar-container" aria-label={`Story ${index + 1} of ${stories.length}`}>
                <motion.div 
                  className="progress-bar"
                  initial={{ width: index < currentIndex ? '100%' : index === currentIndex ? '0%' : '0%' }}
                  animate={{ 
                    width: index < currentIndex ? '100%' : 
                           index === currentIndex ? `${progress}%` : '0%'
                  }}
                  transition={{ 
                    duration: index === currentIndex ? 0.05 : 0.3,
                    ease: 'linear'
                  }}
                />
              </div>
            ))}
          </motion.div>

          {/* Story Header */}
          <motion.div 
            className="story-header"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="story-user-info"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.img 
                src={currentStory.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentStory.profiles?.username || 'User')}`}
                alt={currentStory.profiles?.username || 'User avatar'}
                className="story-avatar"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${currentStory.profiles?.username}`);
                }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
                aria-label={`View ${currentStory.profiles?.username}'s profile`}
              />
              <div className="story-user-details">
                <span className="story-username">
                  {currentStory.profiles?.username}
                  {currentStory.profiles?.is_verified && (
                    <motion.svg 
                      className="verified-badge" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      aria-label="Verified account"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </motion.svg>
                  )}
                </span>
                <span className="story-time" aria-label={`Posted ${formatTimeAgo(currentStory.created_at)} ago`}>
                  {formatTimeAgo(currentStory.created_at)}
                </span>
              </div>
            </motion.div>

            <div className="story-actions">
              {/* Show view count and eye icon for own stories */}
              {currentStory.user_id === myUserId && (
                <motion.button 
                  className="story-action-btn views-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowViews(true);
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={`View story viewers (${viewsCount} views)`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {viewsCount > 0 && (
                    <motion.span 
                      className="views-count"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      {viewsCount}
                    </motion.span>
                  )}
                </motion.button>
              )}
              
              <motion.button 
                className="story-action-btn close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/');
                }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close story viewer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </motion.button>
            </div>
          </motion.div>

          {/* Story Content */}
          <div className="story-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStory.id}
                className="story-media"
                initial={{ opacity: 0, scale: 1.05, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                {currentStory.media_type === 'video' ? (
                  <video 
                    src={currentStory.media_url}
                    className="story-video"
                    autoPlay
                    loop={!isPaused}
                    playsInline
                    muted
                    onLoadedData={() => {
                      // Reset progress when new video loads
                      setProgress(0);
                    }}
                    aria-label={`Story video by ${currentStory.profiles?.username}`}
                  />
                ) : currentStory.media_url ? (
                  <motion.img 
                    src={currentStory.media_url}
                    alt={currentStory.caption || `Story by ${currentStory.profiles?.username}`}
                    className="story-image"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    loading="eager"
                  />
                ) : (
                  <motion.div 
                    className="story-text-only"
                    style={{
                      backgroundColor: '#667eea',
                      color: '#ffffff'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <p>{currentStory.caption}</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Story Caption Overlay */}
            {currentStory.caption && currentStory.media_url && (
              <motion.div 
                className="story-text-overlay"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <p>{currentStory.caption}</p>
              </motion.div>
            )}

            {/* Pause Indicator */}
            {isPaused && (
              <motion.div 
                className="pause-indicator"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </motion.div>
            )}
          </div>

          {/* Navigation Hints (subtle) */}
          <AnimatePresence>
            {stories.length > 1 && (
              <motion.div 
                className="story-nav-hints"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 1 }}
              >
                {currentIndex > 0 && (
                  <motion.div 
                    className="nav-hint left"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 0.6 }}
                    whileHover={{ opacity: 1, x: 5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      previousStory();
                    }}
                    aria-label="Previous story"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M15 18l-6-6 6-6"/>
                    </svg>
                  </motion.div>
                )}
                {currentIndex < stories.length - 1 && (
                  <motion.div 
                    className="nav-hint right"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 0.6 }}
                    whileHover={{ opacity: 1, x: -5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      nextStory();
                    }}
                    aria-label="Next story"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 🔥 UPDATED: Story Views Modal using ViewersModal component */}
        <AnimatePresence>
          {showViews && currentStory && (
            <ViewersModal
              flashId={currentStory.id}
              onClose={() => setShowViews(false)}
            />
          )}
        </AnimatePresence>
      </motion.main>
    </components.ErrorBoundary>
  );
}
