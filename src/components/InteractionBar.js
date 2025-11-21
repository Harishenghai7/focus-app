import React, { useState, memo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ShareModal from './ShareModal';
import InstagramCommentsModal from './InstagramCommentsModal';
import SaveCollectionsModal from './SaveCollectionsModal';
import { useRealtimeInteractions } from '../hooks/useRealtimeInteractions';
import { formatNumber } from '../utils/formatters/formatNumber';
import { formatDate } from '../utils/formatters/formatDate';
import styles from './InteractionBar.module.css';

/**
 * InteractionBar - Displays interactive controls (like, comment, save, share) for content.
 * 
 * Features:
 * - Like button (heart icon, filled if liked)
 * - Comment button
 * - Share button
 * - Save button (bookmark icon, filled if saved)
 * - Like count (clickable to show list)
 * - Comment count
 * - Share count
 * - Timestamp
 * 
 * @component
 * @param {string} contentId - Unique content identifier
 * @param {string} contentType - Type of content ('post' | 'boltz' | 'flash')
 * @param {Object} user - Current user object
 * @param {Object} contentData - Data for the content
 * @returns {React.ReactElement}
 */
const InteractionBar = memo(function InteractionBar({
  contentId,
  contentType,
  user,
  contentData
}) {
  const navigate = useNavigate();
  
  // Use realtime interactions hook
  const {
    likesCount,
    commentsCount,
    sharesCount,
    isLiked,
    loading,
    toggleLike
  } = useRealtimeInteractions(contentId, contentType, user);
  
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSaveCollections, setShowSaveCollections] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [showLikesList, setShowLikesList] = useState(false);

  // Handle like button click with animation
  const handleLike = async () => {
    if (!user || loading) return;
    
    setLikeAnimation(!isLiked);
    await toggleLike();
    setTimeout(() => setLikeAnimation(false), 600);
  };

  // Handle save button click
  const handleSave = () => {
    if (!user) return;
    setShowSaveCollections(true);
  };

  // Handle share button click
  const handleShare = () => {
    setShowShare(true);
  };

  // Handle comment button click
  const handleComment = () => {
    setShowComments(true);
  };

  // Handle like count click (show likes list)
  const handleLikesClick = () => {
    if (likesCount > 0) {
      setShowLikesList(true);
    }
  };

  // Format counts for display (e.g., 1.2K, 5.3M)
  const formatCount = (count) => {
    if (!count || count === 0) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <>
      <div className={styles.interactionBar}>
        <div className={styles.leftActions}>
          {/* Like Button */}
          <motion.button
            className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`}
            onClick={handleLike}
            disabled={loading}
            whileTap={{ scale: 0.9 }}
            aria-label={isLiked ? 'Unlike' : 'Like'}
          >
            <svg 
              width={24} 
              height={24} 
              viewBox="0 0 24 24" 
              fill={isLiked ? '#ff3040' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </motion.button>

          {/* Like Count (clickable) */}
          {likesCount > 0 && (
            <button 
              className={styles.countBtn}
              onClick={handleLikesClick}
              aria-label={`${likesCount} likes`}
            >
              {formatCount(likesCount)}
            </button>
          )}

          {/* Comment Button */}
          <motion.button
            className={styles.actionBtn}
            onClick={handleComment}
            whileTap={{ scale: 0.9 }}
            aria-label="Comment"
          >
            <svg 
              width={24} 
              height={24} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
          </motion.button>

          {/* Comment Count */}
          {commentsCount > 0 && (
            <span className={styles.count}>{formatCount(commentsCount)}</span>
          )}

          {/* Share Button */}
          <motion.button
            className={styles.actionBtn}
            onClick={handleShare}
            whileTap={{ scale: 0.9 }}
            aria-label="Share"
          >
            <svg 
              width={24} 
              height={24} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </motion.button>

          {/* Share Count */}
          {sharesCount > 0 && (
            <span className={styles.count}>{formatCount(sharesCount)}</span>
          )}
        </div>

        <div className={styles.rightActions}>
          {/* Timestamp */}
          {contentData?.created_at && (
            <span className={styles.timestamp}>
              {formatDate(contentData.created_at, 'relative')}
            </span>
          )}

          {/* Save Button */}
          <motion.button
            className={`${styles.actionBtn} ${isSaved ? styles.saved : ''}`}
            onClick={handleSave}
            whileTap={{ scale: 0.9 }}
            aria-label={isSaved ? 'Saved' : 'Save'}
          >
            <svg 
              width={24} 
              height={24} 
              viewBox="0 0 24 24" 
              fill={isSaved ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </motion.button>
        </div>

        {/* Like Animation */}
        <AnimatePresence>
          {likeAnimation && (
            <motion.div
              className={styles.likeBurst}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
            >
              ❤️
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <InstagramCommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        contentId={contentId}
        contentType={contentType}
        user={user}
        contentOwnerId={contentData?.user_id}
      />

      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        contentData={contentData}
        user={user}
      />

      <SaveCollectionsModal
        isOpen={showSaveCollections}
        onClose={() => setShowSaveCollections(false)}
        contentId={contentId}
        contentType={contentType}
        user={user}
      />
    </>
  );
});

InteractionBar.displayName = 'InteractionBar';

InteractionBar.propTypes = {
  contentId: PropTypes.string.isRequired,
  contentType: PropTypes.oneOf(['post', 'boltz', 'flash']).isRequired,
  user: PropTypes.object,
  contentData: PropTypes.object
};

export default InteractionBar;
