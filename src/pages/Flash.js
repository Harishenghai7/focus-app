import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ViewersModal from "../components/ViewersModal";
import "./Flash.css";

export default function Flash({ user, userProfile }) {
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

    progressInterval.current = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + 1;
        });
      }
    }, 50); // 5 seconds total (100 * 50ms)
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    if (x < width / 2) {
      previousStory();
    } else {
      nextStory();
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
    <div className="page page-flash">
      <div 
        className="flash-container"
        onClick={handleTap}
        onMouseDown={handleHold}
        onMouseUp={handleRelease}
        onTouchStart={handleHold}
        onTouchEnd={handleRelease}
      >
        {/* Progress Bars */}
        <div className="story-progress-bars">
          {stories.map((_, index) => (
            <div key={index} className="progress-bar-container">
              <div 
                className="progress-bar"
                style={{
                  width: index < currentIndex ? '100%' : 
                         index === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Header */}
        <div className="story-header">
          <div className="story-user-info">
            <img 
              src={currentStory.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${currentStory.profiles?.username}`}
              alt={currentStory.profiles?.username}
              className="story-avatar"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${currentStory.profiles?.username}`);
              }}
            />
            <div className="story-user-details">
              <span className="story-username">
                {currentStory.profiles?.username}
                {currentStory.profiles?.is_verified && (
                  <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </span>
              <span className="story-time">
                {formatTimeAgo(currentStory.created_at)}
              </span>
            </div>
          </div>

          <div className="story-actions">
            {/* 🔥 UPDATED: Show view count and eye icon for own stories */}
            {currentStory.user_id === myUserId && (
              <button 
                className="story-action-btn views-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViews(true);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                {viewsCount > 0 && <span className="views-count">{viewsCount}</span>}
              </button>
            )}
            
            <button 
              className="story-action-btn close-btn"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/');
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Story Content */}
        <div className="story-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStory.id}
              className="story-media"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              {currentStory.media_type === 'video' ? (
                <video 
                  src={currentStory.media_url}
                  className="story-video"
                  autoPlay
                  loop
                  playsInline
                  muted
                />
              ) : currentStory.media_url ? (
                <img 
                  src={currentStory.media_url}
                  alt="Flash"
                  className="story-image"
                />
              ) : (
                <div 
                  className="story-text-only"
                  style={{
                    backgroundColor: '#667eea',
                    color: '#ffffff'
                  }}
                >
                  <p>{currentStory.caption}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Story Caption Overlay */}
          {currentStory.caption && currentStory.media_url && (
            <div className="story-text-overlay">
              <p>{currentStory.caption}</p>
            </div>
          )}
        </div>

        {/* Navigation Hints (subtle) */}
        <div className="story-nav-hints">
          <div className="nav-hint left"></div>
          <div className="nav-hint right"></div>
        </div>
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
    </div>
  );
}
