import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import ShareModal from './ShareModal';
import InstagramCommentsModal from './InstagramCommentsModal';
import SaveCollectionsModal from './SaveCollectionsModal';
import { notifyLike, notifyComment, deleteNotification, processMentionsAndNotify } from '../utils/notificationService';
import { generateAriaLabel, formatCountForScreenReader, announceToScreenReader } from '../utils/accessibility';
import './InteractionBar.css';

export default function InteractionBar({ 
  contentId, 
  contentType, 
  user, 
  contentData,
  className = '',
  showCounts = true,
  size = 'medium',
  showSave = false
}) {
  const navigate = useNavigate();
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showSaveCollections, setShowSaveCollections] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  useEffect(() => {
    if (contentId && user) {
      loadInteractionData();
    }
  }, [contentId, user?.id]);

  const loadInteractionData = async () => {
    try {
      // Load likes count and user's like status
      const { data: likesData } = await supabase
        .from('likes')
        .select('id, user_id')
        .eq('content_id', contentId)
        .eq('content_type', contentType);
      
      setLikesCount(likesData?.length || 0);
      setIsLiked(likesData?.some(like => like.user_id === user.id) || false);

      // Load comments count
      const { data: commentsData } = await supabase
        .from('comments')
        .select('id')
        .eq('content_id', contentId)
        .eq('content_type', contentType);
      
      setCommentsCount(commentsData?.length || 0);

      // Load saves count and user's save status
      if (showSave) {
        const { data: savesData } = await supabase
          .from('saves')
          .select('id, user_id')
          .eq('content_id', contentId)
          .eq('content_type', contentType);
        
        setSaveCount(savesData?.length || 0);
        setIsSaved(savesData?.some(save => save.user_id === user.id) || false);
      }

      // Load views count for Boltz
      if (contentType === 'boltz') {
        // This would need to be implemented based on your analytics system
        setViewsCount(Math.floor(Math.random() * 1000) + 100); // Placeholder
      }
    } catch (error) {
      console.error("Error loading interaction data:", error);
    }
  };

  const toggleLike = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    const wasLiked = isLiked;
    const newLiked = !wasLiked;
    const previousCount = likesCount;
    
    // Optimistic update - immediate UI feedback
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    try {
      if (wasLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .eq('user_id', user.id);
        
        if (error) throw error;

        // Delete notification when unliking
        if (contentData?.user_id && contentData.user_id !== user.id) {
          await deleteNotification(contentData.user_id, user.id, 'like', contentId);
        }
      } else {
        const { error } = await supabase
          .from("likes")
          .insert([{
            content_id: contentId,
            content_type: contentType,
            user_id: user.id
          }]);
        
        if (error) throw error;

        // Create notification if not own content
        if (contentData?.user_id && contentData.user_id !== user.id) {
          await notifyLike(contentData.user_id, user.id, contentId, contentType);
        }
      }
    } catch (error) {
      // Revert optimistic update on failure
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      console.error("Error toggling like:", error);
      
      // Show user-friendly error message
      if (error.message?.includes('duplicate')) {
        // Already liked, just update UI to match server state
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    const wasSaved = isSaved;
    const newSaved = !wasSaved;
    const previousCount = saveCount;
    
    // Optimistic update - immediate UI feedback
    setIsSaved(newSaved);
    setSaveCount(prev => newSaved ? prev + 1 : prev - 1);
    
    try {
      if (wasSaved) {
        const { error } = await supabase
          .from("saves")
          .delete()
          .eq('content_id', contentId)
          .eq('content_type', contentType)
          .eq('user_id', user.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saves")
          .insert([{
            content_id: contentId,
            content_type: contentType,
            user_id: user.id
          }]);
        
        if (error) throw error;
      }
    } catch (error) {
      // Revert optimistic update on failure
      setIsSaved(wasSaved);
      setSaveCount(previousCount);
      console.error("Error toggling save:", error);
      
      // Show user-friendly error message
      if (error.message?.includes('duplicate')) {
        // Already saved, just update UI to match server state
        setIsSaved(true);
        setSaveCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (commentText) => {
    if (!user || !commentText.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from("comments")
        .insert([{
          content_id: contentId,
          content_type: contentType,
          user_id: user.id,
          text: commentText.trim()
        }])
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      setCommentsCount(prev => prev + 1);

      // Create notification if not own content
      if (contentData?.user_id && contentData.user_id !== user.id) {
        await notifyComment(contentData.user_id, user.id, contentId, contentType, commentText.trim());
      }

      // Process mentions in comment and create notifications
      await processMentionsAndNotify(commentText.trim(), user.id, data.id, 'comment');

      return data;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw error;
    }
  };

  const shareContent = async (platform) => {
    const url = `${window.location.origin}/${contentType}/${contentId}`;
    const text = `Check out this ${contentType} on Focus: ${contentData?.caption?.substring(0, 100) || ''}`;
    
    try {
      switch (platform) {
        case 'copy':
          await navigator.clipboard.writeText(url);
          return true;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
          return true;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
          return true;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.error("Error sharing content:", error);
      return false;
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 600);
    
    await toggleLike();
    
    // Announce to screen readers
    const message = isLiked 
      ? `Unliked ${contentType}. ${formatCountForScreenReader(likesCount - 1, 'like', 'likes')}`
      : `Liked ${contentType}. ${formatCountForScreenReader(likesCount + 1, 'like', 'likes')}`;
    announceToScreenReader(message);
  };

  const handleShare = async (platform) => {
    const success = await shareContent(platform);
    if (success) {
      setShowShare(false);
    }
    return success;
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const iconSize = size === 'small' ? 20 : size === 'large' ? 32 : 24;

  return (
    <>
      <div className={`interaction-bar ${className} interaction-bar-${size}`}>
        <div className="interaction-actions">
          {/* Like Button */}
          <motion.button
            className={`interaction-btn like-btn ${isLiked ? 'liked' : ''} ${loading ? 'loading' : ''}`}
            onClick={handleLike}
            disabled={loading}
            aria-label={generateAriaLabel('like', { isLiked, contentType, count: likesCount })}
            aria-pressed={isLiked}
            aria-busy={loading}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              className="interaction-icon"
              animate={likeAnimation ? { 
                scale: [1, 1.3, 1],
                rotate: [0, 15, -15, 0]
              } : loading ? {
                opacity: [1, 0.5, 1]
              } : {}}
              transition={loading ? { duration: 1, repeat: Infinity } : { duration: 0.6, ease: "easeOut" }}
            >
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
                <motion.path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={isLiked ? '#ff3040' : 'none'}
                  stroke={isLiked ? '#ff3040' : '#666'}
                  strokeWidth="2"
                  initial={false}
                  animate={{
                    fill: isLiked ? '#ff3040' : 'none',
                    stroke: isLiked ? '#ff3040' : '#666',
                    opacity: loading ? 0.5 : 1
                  }}
                  transition={{ duration: 0.2 }}
                />
              </svg>
            </motion.div>
            {showCounts && (
              <span className="interaction-count" aria-hidden="true">
                {formatCount(likesCount)}
              </span>
            )}
          </motion.button>

          {/* Comment Button */}
          <motion.button
            className="interaction-btn comment-btn"
            onClick={() => setShowComments(true)}
            aria-label={generateAriaLabel('comment', { contentType, count: commentsCount })}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="interaction-icon">
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            {showCounts && (
              <span className="interaction-count" aria-hidden="true">
                {formatCount(commentsCount)}
              </span>
            )}
          </motion.button>

          {/* Share Button */}
          <motion.button
            className="interaction-btn share-btn"
            onClick={() => setShowShare(true)}
            aria-label={generateAriaLabel('share', { contentType })}
            whileTap={{ scale: 0.85 }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="interaction-icon">
              <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16,6 12,2 8,6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
            </div>
          </motion.button>

          {/* Save Button */}
          {showSave && (
            <motion.button
              className={`interaction-btn save-btn ${isSaved ? 'saved' : ''} ${loading ? 'loading' : ''}`}
              onClick={() => setShowSaveCollections(true)}
              disabled={loading}
              aria-label={generateAriaLabel('save', { isSaved, contentType, count: saveCount })}
              aria-pressed={isSaved}
              aria-busy={loading}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
            >
              <motion.div 
                className="interaction-icon"
                animate={loading ? { opacity: [1, 0.5, 1] } : {}}
                transition={loading ? { duration: 1, repeat: Infinity } : {}}
              >
                <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </motion.div>
              {showCounts && saveCount > 0 && (
                <span className="interaction-count" aria-hidden="true">
                  {formatCount(saveCount)}
                </span>
              )}
            </motion.button>
          )}

          {/* Views Count (for Boltz) */}
          {contentType === 'boltz' && showCounts && viewsCount > 0 && (
            <div 
              className="views-count" 
              role="status"
              aria-label={formatCountForScreenReader(viewsCount, 'view', 'views')}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span aria-hidden="true">{formatCount(viewsCount)}</span>
            </div>
          )}
        </div>

        {/* Like Animation Overlay */}
        <AnimatePresence>
          {likeAnimation && (
            <motion.div
              className="like-animation-overlay"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="floating-hearts"
                initial={{ y: 0 }}
                animate={{ y: -50 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                {[...Array(3)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="floating-heart"
                    initial={{ opacity: 0, scale: 0, x: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0, 1, 0.8],
                      x: (i - 1) * 20
                    }}
                    transition={{ 
                      duration: 0.6, 
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    ❤️
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comments Modal */}
      <InstagramCommentsModal
        isOpen={showComments}
        onClose={() => setShowComments(false)}
        contentId={contentId}
        contentType={contentType}
        user={user}
        contentOwnerId={contentData?.user_id}
        onAddComment={addComment}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        contentData={contentData}
        onShare={handleShare}
      />

      {/* Save Collections Modal */}
      <SaveCollectionsModal
        isOpen={showSaveCollections}
        onClose={() => setShowSaveCollections(false)}
        contentId={contentId}
        contentType={contentType}
        user={user}
      />
    </>
  );
}