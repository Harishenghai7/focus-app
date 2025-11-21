import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import styles from './CommentsModal.module.css';
import GifPicker from './GifPicker';

/**
 * CommentsModal - Modal for viewing and adding comments to content.
 * @component
 * @param {boolean} isOpen - Whether modal is open
 * @param {function} onClose - Handler to close modal
 * @param {string} contentId - Content ID
 * @param {string} contentType - Content type
 * @param {Object} user - Current user object
 * @param {function} onAddComment - Handler for adding comment
 * @returns {React.ReactElement}
 */
const CommentsModal = React.memo(function CommentsModal({ 
  isOpen, 
  onClose, 
  contentId, 
  contentType, 
  user, 
  onAddComment 
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const inputRef = useRef(null);
  const commentsRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      setupRealtimeSubscription();
    }
  }, [isOpen, contentId]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, replyTo]);

  const fetchComments = async () => {
    if (!contentId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(username, avatar_url, verified, full_name),
          replies:comments!parent_comment_id(
            *,
            profiles!comments_user_id_fkey(username, avatar_url, verified, full_name)
          )
        `)
        .eq(`${contentType}_id`, contentId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`comments_${contentType}_${contentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `${contentType}_id=eq.${contentId}`
      }, (payload) => {
        // Fetch the new comment with profile data
        supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_user_id_fkey(username, avatar_url, verified, full_name)
          `)
          .eq('id', payload.new.id)
          .single()
          .then(({ data }) => {
            if (data) {
              if (data.parent_comment_id) {
                // It's a reply
                setComments(prev => prev.map(comment => 
                  comment.id === data.parent_comment_id
                    ? { ...comment, replies: [...(comment.replies || []), data] }
                    : comment
                ));
              } else {
                // It's a top-level comment
                setComments(prev => [data, ...prev]);
              }
            }
          });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'comments',
        filter: `${contentType}_id=eq.${contentId}`
      }, (payload) => {
        setComments(prev => prev.filter(comment => {
          if (comment.id === payload.old.id) return false;
          if (comment.replies) {
            comment.replies = comment.replies.filter(reply => reply.id !== payload.old.id);
          }
          return true;
        }));
      })
      .subscribe();

    return () => channel.unsubscribe();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const commentData = await onAddComment(newComment, replyTo?.id);
      if (commentData) {
        setNewComment('');
        setReplyTo(null);
        
        // Scroll to bottom to show new comment
        setTimeout(() => {
          if (commentsRef.current) {
            commentsRef.current.scrollTop = commentsRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setNewComment(`@${comment.profiles.username} `);
    inputRef.current?.focus();
  };

  const cancelReply = () => {
    setReplyTo(null);
    setNewComment('');
  };

  const handleGifSelect = (gif) => {
    const url = gif?.url || gif?.previewUrl;
    if (!url) { setShowGifPicker(false); return; }
    setNewComment(prev => (prev ? prev + ' ' : '') + url);
    setShowGifPicker(false);
    inputRef.current?.focus();
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  const CommentItem = ({ comment, isReply = false }) => (
    <motion.div
      className={`${styles.commentItem} ${isReply ? styles.commentReply : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <img
        src={comment.profiles?.avatar_url || '/default-avatar.png'}
        alt={comment.profiles?.username}
        className={styles.commentAvatar}
      />
      <div className={styles.commentContent}>
        <div className={styles.commentHeader}>
          <span className={styles.commentUsername}>
            {comment.profiles?.username}
            {comment.profiles?.verified && (
              <span className={styles.verifiedBadge} aria-label="Verified user">✓</span>
            )}
          </span>
          <span className={styles.commentTime} aria-label="Comment time">
            {formatTimeAgo(comment.created_at)}
          </span>
        </div>
        <p className={styles.commentText}>{comment.content}</p>
        <div className={styles.commentActions}>
          <button
            className={styles.commentActionBtn}
            onClick={() => handleReply(comment)}
            aria-label={`Reply to ${comment.profiles?.username}`}
          >
            Reply
          </button>
          <button className={styles.commentActionBtn} aria-label="Like comment">
            Like
          </button>
        </div>
      </div>
    </motion.div>
  );

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
          {/* GIF Picker Modal */}
          <GifPicker
            isOpen={showGifPicker}
            onClose={() => setShowGifPicker(false)}
            onSelect={handleGifSelect}
            provider="tenor"
          />

          <motion.div
            className={styles.commentsModal}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className={styles.commentsHeader}>
              <h3>Comments</h3>
              <button className={styles.closeBtn} onClick={onClose} aria-label="Close comments">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Comments List */}
            <div className={styles.commentsList} ref={commentsRef}>
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
                    <div key={comment.id}>
                      <CommentItem comment={comment} />
                      {comment.replies && comment.replies.length > 0 && (
                        <div className={styles.repliesContainer}>
                          {comment.replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} isReply />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Reply Indicator */}
            <AnimatePresence>
              {replyTo && (
                <motion.div
                  className={styles.replyIndicator}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>Replying to @{replyTo.profiles.username}</span>
                  <button onClick={cancelReply} aria-label="Cancel reply">
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment Input */}
            <form className={styles.commentForm} onSubmit={handleSubmit}>
              <img
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="Your avatar"
                className={styles.commentInputAvatar}
              />
              <div className={styles.commentInputContainer}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <button
                    type="button"
                    onClick={() => setShowGifPicker(true)}
                    className={styles.commentActionBtn}
                    aria-label="Insert GIF"
                    title="Insert GIF"
                  >
                    GIF
                  </button>
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.profiles.username}...` : 'Add a comment...'}
                  className={styles.commentInput}
                  maxLength={500}
                  disabled={submitting}
                  aria-label={replyTo ? `Reply to ${replyTo.profiles.username}` : 'Add a comment'}
                />
                <button
                  type="submit"
                  className={styles.commentSubmitBtn}
                  disabled={!newComment.trim() || submitting}
                  aria-label="Submit comment"
                >
                  {submitting ? (
                    <div className={styles.loadingSpinner + ' ' + styles.small} aria-hidden="true"></div>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

CommentsModal.displayName = 'CommentsModal';
CommentsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  contentId: PropTypes.string.isRequired,
  contentType: PropTypes.string.isRequired,
  user: PropTypes.object,
  onAddComment: PropTypes.func
};

export default CommentsModal;