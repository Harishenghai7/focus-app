import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import ReactionPicker from './ReactionPicker';
import styles from './InstagramCommentsModal.module.css';

/**
 * InstagramCommentsModal - Modal for Instagram-style comments and reactions.
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Handler to close modal
 * @param {string} contentId - Content ID
 * @param {string} contentType - Content type
 * @param {Object} user - Current user object
 * @param {string} contentOwnerId - Content owner ID
 * @param {function} onAddComment - Handler for adding comment
 * @returns {React.ReactElement}
 */
const InstagramCommentsModal = memo(function InstagramCommentsModal({
  isOpen,
  onClose,
  contentId,
  contentType,
  user,
  contentOwnerId,
  onAddComment
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const [showReactionPicker, setShowReactionPicker] = useState(null);
  const [commentReactions, setCommentReactions] = useState({});
  const inputRef = useRef(null);

  const fetchComments = useCallback(async () => {
    if (!contentId) return;

    setLoading(true);
    try {
      // Fetch parent comments (no parent_id)
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .is('parent_id', null)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch replies for each parent comment
      const commentsWithReplies = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: replies } = await supabase
            .from('comments')
            .select(`
              *,
              profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            replies: replies || [],
            reply_count: replies?.length || 0
          };
        })
      );

      setComments(commentsWithReplies);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [contentId, contentType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const commentData = {
        content_id: contentId,
        content_type: contentType,
        user_id: user.id,
        text: newComment.trim()
      };
      
      // Add parent_id if replying to a comment
      if (replyingTo) {
        commentData.parent_id = replyingTo.id;
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      if (data) {
        setNewComment('');
        
        if (replyingTo) {
          // Add reply to parent comment
          setComments(prev => prev.map(comment => 
            comment.id === replyingTo.id
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), data],
                  reply_count: (comment.reply_count || 0) + 1
                }
              : comment
          ));
          // Auto-expand replies for the parent comment
          setExpandedReplies(prev => new Set([...prev, replyingTo.id]));
          setReplyingTo(null);
        } else {
          // Add as new parent comment
          setComments(prev => [...prev, { ...data, replies: [], reply_count: 0 }]);
        }
        
        if (onAddComment) onAddComment(data);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleReply = (comment) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.profiles.username} `);
    inputRef.current?.focus();
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };
  
  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };
  
  const fetchAllReactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('comment_id, reaction, user_id');

      if (error) throw error;

      // Group reactions by comment_id
      const reactionsByComment = {};
      (data || []).forEach(reaction => {
        if (!reactionsByComment[reaction.comment_id]) {
          reactionsByComment[reaction.comment_id] = {};
        }
        if (!reactionsByComment[reaction.comment_id][reaction.reaction]) {
          reactionsByComment[reaction.comment_id][reaction.reaction] = [];
        }
        reactionsByComment[reaction.comment_id][reaction.reaction].push(reaction.user_id);
      });

      setCommentReactions(reactionsByComment);
    } catch (error) {
      console.error('Error fetching reactions:', error);
    }
  }, []);

  // Fetch comments and reactions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchComments();
      fetchAllReactions();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, contentId, fetchComments, fetchAllReactions]);
  
  const handleReaction = async (commentId, emoji) => {
    if (!user) return;
    
    try {
      const reactions = commentReactions[commentId] || {};
      const userReactions = reactions[emoji] || [];
      const hasReacted = userReactions.includes(user.id);
      
      if (hasReacted) {
        // Remove reaction
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)
          .eq('reaction', emoji);
        
        if (error) throw error;
        
        // Update local state
        setCommentReactions(prev => {
          const newReactions = { ...prev };
          if (newReactions[commentId] && newReactions[commentId][emoji]) {
            newReactions[commentId][emoji] = newReactions[commentId][emoji].filter(id => id !== user.id);
            if (newReactions[commentId][emoji].length === 0) {
              delete newReactions[commentId][emoji];
            }
          }
          return newReactions;
        });
      } else {
        // Add reaction
        const { error } = await supabase
          .from('comment_reactions')
          .insert([{
            comment_id: commentId,
            user_id: user.id,
            reaction: emoji
          }]);
        
        if (error) throw error;
        
        // Update local state
        setCommentReactions(prev => {
          const newReactions = { ...prev };
          if (!newReactions[commentId]) {
            newReactions[commentId] = {};
          }
          if (!newReactions[commentId][emoji]) {
            newReactions[commentId][emoji] = [];
          }
          newReactions[commentId][emoji].push(user.id);
          return newReactions;
        });
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };
  
  const getReactionSummary = (commentId) => {
    const reactions = commentReactions[commentId] || {};
    return Object.entries(reactions)
      .filter(([_, users]) => users.length > 0)
      .map(([emoji, users]) => ({
        emoji,
        count: users.length,
        hasReacted: users.includes(user?.id)
      }));
  };
  
  const handlePinComment = async (comment) => {
    if (!user) return;
    
    try {
      const newPinnedState = !comment.is_pinned;
      
      // Update in database
      const { error } = await supabase
        .from('comments')
        .update({ is_pinned: newPinnedState })
        .eq('id', comment.id);
      
      if (error) throw error;
      
      // Update local state
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { ...c, is_pinned: newPinnedState }
          : c
      ));
    } catch (error) {
      console.error('Error pinning comment:', error);
    }
  };
  
  const isPostOwner = (postOwnerId) => {
    return user?.id === postOwnerId;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.commentsModalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.commentsModal}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.commentsHeader}>
              <h3>Comments</h3>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close comments">
                ✕
              </button>
            </div>

            <div className={styles.commentsList}>
              {loading ? (
                <div className={styles.commentsLoading}>
                  <div className={styles.loadingSpinner} aria-hidden="true"></div>
                  <p>Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className={styles.commentsEmpty}>
                  <div className={styles.emptyIcon} aria-hidden="true">💬</div>
                  <h4>No comments yet</h4>
                  <p>Be the first to share your thoughts!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {comments.map((comment) => (
                    <div key={comment.id} className={styles.commentThread}>
                      <motion.div
                        className={styles.commentItem}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <img
                          src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.username || 'User'}`}
                          alt={comment.profiles?.username || 'User'}
                          className={styles.commentAvatar}
                          aria-hidden="true"
                        />
                        <div className={styles.commentContent}>
                          <div className={styles.commentHeader}>
                            <span className={styles.commentUsername}>
                              {comment.profiles?.username || 'User'}
                              {comment.is_pinned && (
                                <span className={styles.pinnedBadge} title="Pinned comment" aria-hidden="true">📌</span>
                              )}
                            </span>
                            <span className={styles.commentTime} aria-label={`Commented ${formatTimeAgo(comment.created_at)}`}>
                              {formatTimeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className={styles.commentText}>{comment.text}</p>
                          <div className={styles.commentActions}>
                            <button
                              className={styles.commentActionBtn}
                              onClick={() => handleReply(comment)}
                              aria-label={`Reply to ${comment.profiles.username}`}
                            >
                              Reply
                            </button>
                            <button
                              className={styles.commentActionBtn}
                              onClick={() => setShowReactionPicker(comment.id)}
                              aria-label={`React to ${comment.profiles.username}'s comment`}
                            >
                              React
                            </button>
                            {user?.id === contentOwnerId && (
                              <button
                                className={`${styles.commentActionBtn} ${styles.pinBtn}`}
                                onClick={() => handlePinComment(comment)}
                                aria-label={comment.is_pinned ? 'Unpin comment' : 'Pin comment'}
                              >
                                {comment.is_pinned ? 'Unpin' : 'Pin'}
                              </button>
                            )}
                            {comment.reply_count > 0 && (
                              <button
                                className={`${styles.commentActionBtn} ${styles.viewRepliesBtn}`}
                                onClick={() => toggleReplies(comment.id)}
                                aria-label={`View ${comment.reply_count} ${comment.reply_count === 1 ? 'reply' : 'replies'}`}
                              >
                                {expandedReplies.has(comment.id) ? '─' : '─'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                              </button>
                            )}
                          </div>

                          {/* Reaction Summary */}
                          {getReactionSummary(comment.id).length > 0 && (
                            <div className={styles.commentReactions}>
                              {getReactionSummary(comment.id).map(({ emoji, count, hasReacted }) => (
                                <button
                                  key={emoji}
                                  className={`${styles.reactionBadge} ${hasReacted ? styles.reactionBadgeReacted : ''}`}
                                  onClick={() => handleReaction(comment.id, emoji)}
                                  aria-label={`${hasReacted ? 'Remove' : 'Add'} ${emoji} reaction`}
                                >
                                  <span className={styles.reactionEmoji}>{emoji}</span>
                                  <span className={styles.reactionCount}>{count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>

                      {/* Reaction Picker */}
                      <AnimatePresence>
                        {showReactionPicker === comment.id && (
                          <ReactionPicker
                            onSelect={(emoji) => handleReaction(comment.id, emoji)}
                            onClose={() => setShowReactionPicker(null)}
                          />
                        )}
                      </AnimatePresence>

                      {/* Nested Replies */}
                      <AnimatePresence>
                        {expandedReplies.has(comment.id) && comment.replies && comment.replies.length > 0 && (
                          <motion.div
                            className={styles.commentReplies}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {comment.replies.map((reply) => (
                              <React.Fragment key={reply.id}>
                                <motion.div
                                  className={`${styles.commentItem} ${styles.commentReply}`}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                >
                                  <img
                                    src={reply.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${reply.profiles?.username || 'User'}`}
                                    alt={reply.profiles?.username || 'User'}
                                    className={styles.commentAvatar}
                                    aria-hidden="true"
                                  />
                                  <div className={styles.commentContent}>
                                    <div className={styles.commentHeader}>
                                      <span className={styles.commentUsername}>
                                        {reply.profiles?.username || 'User'}
                                      </span>
                                      <span className={styles.commentTime} aria-label={`Commented ${formatTimeAgo(reply.created_at)}`}>
                                        {formatTimeAgo(reply.created_at)}
                                      </span>
                                    </div>
                                    <p className={styles.commentText}>{reply.text}</p>
                                    <div className={styles.commentActions}>
                                      <button
                                        className={styles.commentActionBtn}
                                        onClick={() => setShowReactionPicker(reply.id)}
                                        aria-label={`React to ${reply.profiles.username}'s reply`}
                                      >
                                        React
                                      </button>
                                    </div>

                                    {/* Reaction Summary for Replies */}
                                    {getReactionSummary(reply.id).length > 0 && (
                                      <div className={styles.commentReactions}>
                                        {getReactionSummary(reply.id).map(({ emoji, count, hasReacted }) => (
                                          <button
                                            key={emoji}
                                            className={`${styles.reactionBadge} ${hasReacted ? styles.reactionBadgeReacted : ''}`}
                                            onClick={() => handleReaction(reply.id, emoji)}
                                            aria-label={`${hasReacted ? 'Remove' : 'Add'} ${emoji} reaction`}
                                          >
                                            <span className={styles.reactionEmoji}>{emoji}</span>
                                            <span className={styles.reactionCount}>{count}</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>

                                {/* Reaction Picker for Replies */}
                                <AnimatePresence>
                                  {showReactionPicker === reply.id && (
                                    <ReactionPicker
                                      onSelect={(emoji) => handleReaction(reply.id, emoji)}
                                      onClose={() => setShowReactionPicker(null)}
                                    />
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Reply Indicator */}
            <AnimatePresence>
              {replyingTo && (
                <motion.div
                  className={styles.replyIndicator}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>Replying to @{replyingTo.profiles.username}</span>
                  <button onClick={cancelReply} className={styles.cancelReplyBtn} aria-label="Cancel reply">
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form className={styles.commentForm} onSubmit={handleSubmit}>
              <img
                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email || 'User'}`}
                alt="Your avatar"
                className={styles.commentInputAvatar}
                aria-hidden="true"
              />
              <div className={styles.commentInputContainer}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? `Reply to ${replyingTo.profiles.username}...` : 'Add a comment...'}
                  className={styles.commentInput}
                  maxLength={500}
                  disabled={submitting}
                  aria-label={replyingTo ? `Reply to ${replyingTo.profiles.username}` : 'Add a comment'}
                />
                <button
                  type="submit"
                  className={styles.commentSubmitBtn}
                  disabled={!newComment.trim() || submitting}
                  aria-label="Post comment"
                >
                  {submitting ? '...' : 'Post'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

InstagramCommentsModal.displayName = 'InstagramCommentsModal';
InstagramCommentsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  contentId: PropTypes.string.isRequired,
  contentType: PropTypes.string.isRequired,
  user: PropTypes.object,
  contentOwnerId: PropTypes.string,
  onAddComment: PropTypes.func
};

export default InstagramCommentsModal;
