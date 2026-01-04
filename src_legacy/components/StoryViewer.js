import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import CountdownTimer from './CountdownTimer';
import ViewersModal from './ViewersModal';
import { formatDate } from '../utils/dateFormatter';
import { supabase } from '../supabaseClient';
import styles from './StoryViewer.module.css';

/**
 * StoryViewer
 * Full-screen story viewer with auto-advance timer, navigation, and interactions.
 * Features:
 * - Auto-advance timer (3 sec per story)
 * - Progress bars at top
 * - Pause on tap/hold
 * - Next/previous navigation
 * - Reply input at bottom
 * - Viewers list (own story only)
 * - Close button
 * 
 * @param {Array<{id:string, image:string, video:string, user_id:string, username:string, created_at:string}>} stories - List of stories
 * @param {number} initialIndex - Starting story index
 * @param {Function} onClose - Callback to close viewer
 * @param {string} currentUserId - Current user's ID
 * @example <StoryViewer stories={stories} initialIndex={0} onClose={closeViewer} currentUserId={userId} />
 */
const StoryViewer = ({ stories, initialIndex = 0, onClose, currentUserId }) => {
  const [index, setIndex] = useState(initialIndex);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const progressInterval = useRef(null);
  const pauseTimeout = useRef(null);
  const touchStartX = useRef(0);
  const touchStartTime = useRef(0);

  const STORY_DURATION = 3000; // 3 seconds per story
  const currentStory = stories[index];
  const isOwnStory = currentStory?.user_id === currentUserId;

  // Auto-advance timer with progress
  useEffect(() => {
    if (index >= stories.length || paused) return;

    setProgress(0);
    const startTime = Date.now();
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        clearInterval(progressInterval.current);
        goToNext();
      } else {
        setProgress(newProgress);
      }
    }, 16); // ~60fps

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [index, stories.length, paused]);

  // Mark story as viewed
  useEffect(() => {
    if (currentStory?.id && currentUserId && !isOwnStory) {
      markAsViewed(currentStory.id);
    }
  }, [currentStory?.id, currentUserId, isOwnStory]);

  // Close when all stories are done
  useEffect(() => {
    if (index >= stories.length && onClose) {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const markAsViewed = async (storyId) => {
    try {
      await supabase.rpc('mark_flash_viewed', {
        flash_uuid: storyId,
        viewer_uuid: currentUserId
      });
    } catch (err) {
      console.error('Error marking story as viewed:', err);
    }
  };

  const goToNext = () => {
    if (index < stories.length - 1) {
      setIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goToPrevious = () => {
    if (index > 0) {
      setIndex(i => i - 1);
      setProgress(0);
    }
  };

  // Pause on hold
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartTime.current = Date.now();
    
    pauseTimeout.current = setTimeout(() => {
      setPaused(true);
    }, 200); // 200ms hold to pause
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchDuration = Date.now() - touchStartTime.current;
    const touchDistance = touchEndX - touchStartX.current;

    if (pauseTimeout.current) {
      clearTimeout(pauseTimeout.current);
    }

    if (paused) {
      setPaused(false);
      return;
    }

    // Swipe detection
    if (touchDuration < 300 && Math.abs(touchDistance) > 50) {
      if (touchDistance > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
    // Tap left/right navigation
    else if (touchDuration < 300) {
      const screenWidth = window.innerWidth;
      if (touchEndX < screenWidth / 3) {
        goToPrevious();
      } else if (touchEndX > (screenWidth * 2) / 3) {
        goToNext();
      }
    }
  };

  const handleMouseDown = () => {
    pauseTimeout.current = setTimeout(() => {
      setPaused(true);
    }, 200);
  };

  const handleMouseUp = () => {
    if (pauseTimeout.current) {
      clearTimeout(pauseTimeout.current);
    }
    if (paused) {
      setPaused(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply) return;

    try {
      setSendingReply(true);
      
      // Create a direct message reply to story
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUserId,
        receiver_id: currentStory.user_id,
        content: `Reply to story: ${replyText}`,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      setReplyText('');
      // Optional: show success message
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  if (index >= stories.length || !currentStory) return null;

  return (
    <div 
      className={styles.overlay} 
      role="dialog" 
      aria-modal="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Progress bars at top */}
      <div className={styles.progressContainer}>
        {(stories || []).map((story, i) => (
          <div key={story.id || i} className={styles.progressBarWrapper}>
            <div 
              className={styles.progressBar}
              style={{
                width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Story header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {currentStory.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.username}>{currentStory.username || 'User'}</span>
            <span className={styles.timestamp}>
              {formatDate(currentStory.created_at, { format: 'relative' })}
            </span>
          </div>
        </div>
        
        <div className={styles.headerActions}>
          {paused && <span className={styles.pausedIndicator}>⏸</span>}
          {isOwnStory && (
            <button 
              className={styles.viewersBtn}
              onClick={() => setShowViewers(true)}
              aria-label="View story viewers"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )}
          <button 
            className={styles.close} 
            onClick={onClose} 
            aria-label="Close story viewer"
          >
            ×
          </button>
        </div>
      </div>

      {/* Story content */}
      <div className={styles.content}>
        {currentStory.video ? (
          <video 
            src={currentStory.video} 
            className={styles.media}
            autoPlay
            muted
            playsInline
            onEnded={goToNext}
          />
        ) : (
          <img 
            src={currentStory.image} 
            alt="Story" 
            className={styles.media}
          />
        )}
      </div>

      {/* Navigation areas (invisible) */}
      <div className={styles.navPrevious} onClick={goToPrevious} aria-label="Previous story" />
      <div className={styles.navNext} onClick={goToNext} aria-label="Next story" />

      {/* Reply input at bottom */}
      {!isOwnStory && (
        <form className={styles.replyContainer} onSubmit={handleReplySubmit}>
          <input
            type="text"
            className={styles.replyInput}
            placeholder={`Reply to ${currentStory.username || 'user'}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            disabled={sendingReply}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          />
          <button 
            type="submit" 
            className={styles.replyBtn}
            disabled={!replyText.trim() || sendingReply}
            aria-label="Send reply"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      )}

      {/* Viewers modal (own story only) */}
      {showViewers && isOwnStory && (
        <ViewersModal 
          flashId={currentStory.id}
          onClose={() => setShowViewers(false)}
        />
      )}
    </div>
  );
};

StoryViewer.propTypes = {
  stories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    image: PropTypes.string,
    video: PropTypes.string,
    user_id: PropTypes.string.isRequired,
    username: PropTypes.string,
    created_at: PropTypes.string.isRequired
  })).isRequired,
  initialIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  currentUserId: PropTypes.string.isRequired
};

export default React.memo(StoryViewer);
