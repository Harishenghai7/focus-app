/**
 * ============================================================================
 * 💬 COMMENT MODAL - PRODUCTION GRADE
 * ============================================================================
 * 
 * Instagram-style comment modal with:
 * - Full post preview at top
 * - Scrollable comments lis  // ========== ESCAPE KEY HANDLER ==========
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);l-time comment updates
 * - Comment input with mention support
 * - Like individual comments
 * - Reply to comments (nested)
 * - Delete own comments
 * - Loading states
 * - Empty state
 * - Mobile & desktop responsive
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { formatTimeAgo } from '../utils/formatDate';
import { formatNumber } from '../utils/formatNumber';
import './CommentModal.css';

const CommentModal = ({ isOpen, onClose, post, user }) => {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  const inputRef = useRef(null);
  const commentsContainerRef = useRef(null);
  const realtimeChannel = useRef(null);

  // ========== FETCH COMMENTS ==========
  const fetchComments = useCallback(async () => {
    if (!post?.id) return;

    try {
      setLoading(true);

      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          user_id,
          content,
          parent_id,
          created_at,
          user:users!comments_user_id_fkey (
            id,
            username,
            display_name,
            avatar_url,
            verified
          )
        `)
        .eq('post_id', post.id)
        .is('parent_id', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch likes for each comment
      const commentsWithLikes = await Promise.all(
        (commentsData || []).map(async (comment) => {
          const { count: likesCount } = await supabase
            .from('comment_likes')
            .select('*', { count: 'exact', head: true })
            .eq('comment_id', comment.id);

          // Check if user liked
          let isLiked = false;
          if (user) {
            const { data: likeData } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', user.id)
              .maybeSingle();
            isLiked = !!likeData;
          }

          // Fetch replies
          const { data: repliesData } = await supabase
            .from('comments')
            .select(`
              id,
              post_id,
              user_id,
              content,
              parent_id,
              created_at,
              user:users!comments_user_id_fkey (
                id,
                username,
                display_name,
                avatar_url,
                verified
              )
            `)
            .eq('parent_id', comment.id)
            .order('created_at', { ascending: true });

          return {
            ...comment,
            likes_count: likesCount || 0,
            is_liked: isLiked,
            replies: repliesData || [],
          };
        })
      );

      setComments(commentsWithLikes);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [post, user]);

  // ========== INITIAL FETCH ==========
  useEffect(() => {
    if (isOpen && post?.id) {
      fetchComments();
    }
  }, [isOpen, post, fetchComments]);

  // ========== REAL-TIME SUBSCRIPTIONS ==========
  useEffect(() => {
    if (!isOpen || !post?.id) return;

    realtimeChannel.current = supabase
      .channel(`comments_${post.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          console.log('New comment detected:', payload.new);
          fetchComments();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          console.log('Comment deleted:', payload.old);
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannel.current) {
        realtimeChannel.current.unsubscribe();
      }
    };
  }, [isOpen, post, fetchComments]);

  // ========== POST COMMENT ==========
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentText.trim() || !user) return;

    try {
      setSubmitting(true);

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: commentText.trim(),
          parent_id: replyingTo?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Send notification to post author
      if (post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          type: 'comment',
          actor_id: user.id,
          post_id: post.id,
          comment_id: data.id,
        });
      }

      // Clear input
      setCommentText('');
      setReplyingTo(null);

      // Refresh comments
      fetchComments();

      // Scroll to bottom
      if (commentsContainerRef.current) {
        setTimeout(() => {
          commentsContainerRef.current.scrollTop = commentsContainerRef.current.scrollHeight;
        }, 100);
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ========== LIKE COMMENT ==========
  const handleLikeComment = async (commentId, currentlyLiked) => {
    if (!user) return;

    try {
      // Optimistic update
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: !currentlyLiked,
              likes_count: currentlyLiked ? comment.likes_count - 1 : comment.likes_count + 1,
            };
          }
          return comment;
        })
      );

      if (currentlyLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
          });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      // Revert optimistic update
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return {
              ...comment,
              is_liked: currentlyLiked,
              likes_count: currentlyLiked ? comment.likes_count + 1 : comment.likes_count - 1,
            };
          }
          return comment;
        })
      );
    }
  };

  // ========== DELETE COMMENT ==========
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment.');
    }
  };

  // ========== HANDLE CLOSE ==========
  const handleClose = () => {
    setCommentText('');
    setReplyingTo(null);
    onClose();
  };

  // ========== HANDLE BACKDROP CLICK ==========
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // ========== HANDLE ESCAPE KEY ==========
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // ========== PREVENT BODY SCROLL ==========
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="comment-modal-overlay"
        onClick={handleBackdropClick}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="comment-modal"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="comment-modal-header">
            <h2>Comments</h2>
            <button
              className="comment-modal-close"
              onClick={handleClose}
              aria-label="Close comments"
            >
              ✕
            </button>
          </div>

          {/* Post Preview */}
          <div className="comment-modal-post-preview">
            <div className="post-preview-author">
              <img
                src={post.profiles?.avatar_url || '/default-avatar.png'}
                alt={post.profiles?.display_name || post.profiles?.username}
                className="post-preview-avatar"
              />
              <div className="post-preview-info">
                <span className="post-preview-name">
                  {post.profiles?.display_name || post.profiles?.username}
                  {post.profiles?.verified && (
                    <span className="verified-badge" title="Verified">✓</span>
                  )}
                </span>
                <span className="post-preview-time">
                  {formatTimeAgo(post.created_at)}
                </span>
              </div>
            </div>
            {post.caption && (
              <p className="post-preview-caption">{post.caption}</p>
            )}
          </div>

          {/* Comments List */}
          <div
            className="comment-modal-comments"
            ref={commentsContainerRef}
          >
            {loading && comments.length === 0 ? (
              <div className="comments-loading">
                <div className="loading-spinner" />
                <p>Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="comments-empty">
                <div className="empty-icon">💬</div>
                <h3>No comments yet</h3>
                <p>Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <img
                    src={comment.user?.avatar_url || '/default-avatar.png'}
                    alt={comment.user?.display_name || comment.user?.username}
                    className="comment-avatar"
                  />
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">
                        {comment.user?.display_name || comment.user?.username}
                        {comment.user?.verified && (
                          <span className="verified-badge" title="Verified">✓</span>
                        )}
                      </span>
                      <span className="comment-time">
                        {formatTimeAgo(comment.created_at)}
                      </span>
                    </div>
                    <p className="comment-text">{comment.content}</p>
                    <div className="comment-actions">
                      <button
                        className={`comment-like-btn ${comment.is_liked ? 'liked' : ''}`}
                        onClick={() => handleLikeComment(comment.id, comment.is_liked)}
                        aria-label={comment.is_liked ? 'Unlike comment' : 'Like comment'}
                      >
                        {comment.is_liked ? '❤️' : '🤍'}
                        {comment.likes_count > 0 && (
                          <span>{formatNumber(comment.likes_count)}</span>
                        )}
                      </button>
                      <button
                        className="comment-reply-btn"
                        onClick={() => {
                          setReplyingTo(comment);
                          inputRef.current?.focus();
                        }}
                      >
                        Reply
                      </button>
                      {comment.user_id === user?.id && (
                        <button
                          className="comment-delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                          aria-label="Delete comment"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="comment-replies">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="comment-item reply">
                            <img
                              src={reply.user?.avatar_url || '/default-avatar.png'}
                              alt={reply.user?.display_name || reply.user?.username}
                              className="comment-avatar"
                            />
                            <div className="comment-content">
                              <div className="comment-header">
                                <span className="comment-author">
                                  {reply.user?.display_name || reply.user?.username}
                                  {reply.user?.verified && (
                                    <span className="verified-badge" title="Verified">✓</span>
                                  )}
                                </span>
                                <span className="comment-time">
                                  {formatTimeAgo(reply.created_at)}
                                </span>
                              </div>
                              <p className="comment-text">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <form className="comment-modal-input-wrapper" onSubmit={handleSubmitComment}>
            {replyingTo && (
              <div className="replying-to">
                <span>Replying to @{replyingTo.user?.username}</span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancel reply"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="comment-input-container">
              <input
                ref={inputRef}
                type="text"
                className="comment-input"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                disabled={submitting}
                maxLength={500}
              />
              <button
                type="submit"
                className="comment-submit-btn"
                disabled={!commentText.trim() || submitting}
              >
                {submitting ? '...' : 'Post'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommentModal;
