import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Hooks
import { useAuth } from '../hooks/useAuth';
import { useSwipeable } from 'react-swipeable';

// Utils
import { trackPageView } from '../utils/analytics/trackPageView';
import { trackEvent } from '../utils/analytics/trackEvent';

import './Flash.css';

const STORY_DURATION = 5000; // 5 seconds per story

function Flash() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [viewerListOpen, setViewerListOpen] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Refs
  const progressTimerRef = useRef(null);
  const holdTimerRef = useRef(null);

  // Track page view
  useEffect(() => {
    trackPageView('Flash');
  }, []);

  // Fetch users with stories
  const fetchUsersWithStories = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url,
            verified
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group stories by user
      const userStories = {};
      data.forEach(story => {
        const userId = story.user_id;
        if (!userStories[userId]) {
          userStories[userId] = {
            user: story.profiles,
            stories: []
          };
        }
        userStories[userId].stories.push(story);
      });

      const usersArray = Object.values(userStories);
      setUsers(usersArray);

      // Find initial user index
      if (username) {
        const index = usersArray.findIndex(u => u.user.username === username);
        if (index !== -1) {
          setCurrentUserIndex(index);
          setStories(usersArray[index].stories);
        }
      } else if (usersArray.length > 0) {
        setStories(usersArray[0].stories);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchUsersWithStories();
  }, []);

  // Auto-advance story
  useEffect(() => {
    if (!paused && stories.length > 0) {
      progressTimerRef.current = setTimeout(() => {
        handleNextStory();
      }, STORY_DURATION);
    }

    return () => {
      if (progressTimerRef.current) {
        clearTimeout(progressTimerRef.current);
      }
    };
  }, [currentStoryIndex, paused, stories]);

  // Handle next story
  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      trackEvent('story_next');
    } else {
      handleNextUser();
    }
  };

  // Handle previous story
  const handlePreviousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      trackEvent('story_previous');
    } else {
      handlePreviousUser();
    }
  };

  // Handle next user
  const handleNextUser = () => {
    if (currentUserIndex < users.length - 1) {
      const nextIndex = currentUserIndex + 1;
      setCurrentUserIndex(nextIndex);
      setCurrentStoryIndex(0);
      setStories(users[nextIndex].stories);
      trackEvent('story_next_user');
    } else {
      handleClose();
    }
  };

  // Handle previous user
  const handlePreviousUser = () => {
    if (currentUserIndex > 0) {
      const prevIndex = currentUserIndex - 1;
      setCurrentUserIndex(prevIndex);
      setCurrentStoryIndex(users[prevIndex].stories.length - 1);
      setStories(users[prevIndex].stories);
      trackEvent('story_previous_user');
    }
  };

  // Handle tap navigation
  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      handlePreviousStory();
    } else if (x > (2 * width) / 3) {
      handleNextStory();
    }
  };

  // Handle hold to pause
  const handleHoldStart = () => {
    holdTimerRef.current = setTimeout(() => {
      setPaused(true);
    }, 200);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    setPaused(false);
  };

  // Swipe handlers
  const handlers = useSwipeable({
    onSwipedDown: () => navigate(-1),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // Handle close
  const handleClose = () => {
    navigate(-1);
  };

  // Handle quick reaction
  const handleQuickReaction = async (emoji) => {
    if (!user?.id || !stories[currentStoryIndex]) return;

    try {
      await supabase
        .from('story_reactions')
        .insert({
          story_id: stories[currentStoryIndex].id,
          user_id: user.id,
          reaction: emoji
        });

      trackEvent('story_quick_reaction', { emoji });
    } catch (err) {
      console.error('Error sending reaction:', err);
    }
  };

  // Handle reply
  const handleReply = async () => {
    if (!user?.id || !stories[currentStoryIndex] || !replyText.trim()) return;

    try {
      await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: stories[currentStoryIndex].user_id,
          content: replyText,
          type: 'story_reply',
          story_id: stories[currentStoryIndex].id
        });

      setReplyText('');
      trackEvent('story_reply_sent');
      alert('Reply sent!');
    } catch (err) {
      console.error('Error sending reply:', err);
    }
  };

  // View viewers list (own story only)
  const handleViewViewers = async () => {
    if (stories[currentStoryIndex].user_id !== user?.id) return;

    setViewerListOpen(true);
    trackEvent('story_viewers_opened');
  };

  if (loading) {
    return (
      <div className="flash-loading">
        <div className="loading-spinner">Loading Flash...</div>
      </div>
    );
  }

  if (!users.length || !stories.length) {
    return (
      <div className="flash-empty">
        <div className="empty-icon">✨</div>
        <h3>No Stories Available</h3>
        <p>Check back later</p>
        <button onClick={handleClose}>Go Back</button>
      </div>
    );
  }

  const currentStory = stories[currentStoryIndex];
  const currentUser = users[currentUserIndex].user;
  const isOwnStory = currentStory.user_id === user?.id;

  return (
    <div className="page-flash" {...handlers}>
      {/* Progress Bars */}
      <div className="story-progress-bars">
        {stories.map((_, index) => (
          <div key={index} className="progress-bar-container">
            <motion.div
              className="progress-bar-fill"
              initial={{ width: '0%' }}
              animate={{
                width: index < currentStoryIndex
                  ? '100%'
                  : index === currentStoryIndex
                  ? '100%'
                  : '0%'
              }}
              transition={{
                duration: index === currentStoryIndex ? STORY_DURATION / 1000 : 0,
                ease: 'linear'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="story-header">
        <div className="story-user-info">
          <img
            src={currentUser.avatar_url || '/default-avatar.png'}
            alt={currentUser.username}
            className="story-avatar"
          />
          <div className="story-username">
            @{currentUser.username}
            {currentUser.verified && <span className="verified">✓</span>}
          </div>
          <div className="story-time">
            {new Date(currentStory.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <button className="close-button" onClick={handleClose}>
          ✕
        </button>
      </div>

      {/* Story Content */}
      <div
        className="story-content"
        onClick={handleTap}
        onMouseDown={handleHoldStart}
        onMouseUp={handleHoldEnd}
        onTouchStart={handleHoldStart}
        onTouchEnd={handleHoldEnd}
      >
        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="story-media"
          />
        ) : (
          <video
            src={currentStory.media_url}
            className="story-media"
            autoPlay
            loop
            muted={currentStory.music_enabled !== true}
          />
        )}

        {/* Paused Indicator */}
        {paused && (
          <div className="paused-indicator">⏸ Paused</div>
        )}

        {/* Tap Hints */}
        <div className="tap-hint tap-left">← Previous</div>
        <div className="tap-hint tap-right">Next →</div>
        <div className="tap-hint tap-down">↓ Swipe down to close</div>
      </div>

      {/* Quick Reactions */}
      <div className="quick-reactions">
        {['❤️', '😂', '😮', '😢', '👏', '🔥'].map(emoji => (
          <button
            key={emoji}
            className="reaction-button"
            onClick={() => handleQuickReaction(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Reply Input (if not own story) */}
      {!isOwnStory && (
        <div className="reply-section">
          <input
            type="text"
            className="reply-input"
            placeholder={`Reply to @${currentUser.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleReply();
            }}
          />
          <button
            className="send-button"
            onClick={handleReply}
            disabled={!replyText.trim()}
          >
            Send
          </button>
        </div>
      )}

      {/* View Count (own story only) */}
      {isOwnStory && (
        <div className="view-count" onClick={handleViewViewers}>
          👁 {currentStory.view_count || 0} views
        </div>
      )}

      {/* Viewer List Modal */}
      {viewerListOpen && (
        <motion.div
          className="viewer-list-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
        >
          <div className="viewer-list-header">
            <h3>Viewers</h3>
            <button onClick={() => setViewerListOpen(false)}>✕</button>
          </div>
          <div className="viewer-list-content">
            {/* Fetch and display viewers here */}
            <p>Loading viewers...</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Flash;
