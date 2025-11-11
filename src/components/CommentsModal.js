import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import './CommentsModal.css';

export default function CommentsModal({ 
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
      className={`comment-item ${isReply ? 'comment-reply' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      layout
    >
      <img
        src={comment.profiles?.avatar_url || '/default-avatar.png'}
        alt={comment.profiles?.username}
        className="comment-avatar"
      />
      <div className="comment-content">
        <div className="comment-header">
          <span className="comment-username">
            {comment.profiles?.username}
            {comment.profiles?.verified && (
              <span className="verified-badge">✓</span>
            )}
          </span>
          <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
        </div>
        <p className="comment-text">{comment.content}</p>
        <div className="comment-actions">
          <button
            className="comment-action-btn"
            onClick={() => handleReply(comment)}
          >
            Reply
          </button>
          <button className="comment-action-btn">
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
          className="comments-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="comments-modal"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="comments-header">
              <h3>Comments</h3>
              <button className="close-btn" onClick={onClose}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Comments List */}
            <div className="comments-list" ref={commentsRef}>
              {loading ? (
                <div className="comments-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="comments-empty">
                  <div className="empty-icon">💬</div>
                  <h4>No comments yet</h4>
                  <p>Be the first to share your thoughts!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {comments.map((comment) => (
                    <div key={comment.id}>
                      <CommentItem comment={comment} />
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="replies-container">
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
                  className="reply-indicator"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>Replying to @{replyTo.profiles.username}</span>
                  <button onClick={cancelReply}>Cancel</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Comment Input */}
            <form className="comment-form" onSubmit={handleSubmit}>
              <img
                src={user?.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="Your avatar"
                className="comment-input-avatar"
              />
              <div className="comment-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.profiles.username}...` : 'Add a comment...'}
                  className="comment-input"
                  maxLength={500}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? (
                    <div className="loading-spinner small"></div>
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
}