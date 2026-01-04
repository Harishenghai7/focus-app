import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { formatNumber } from '../../utils/formatNumber';

const CommentModal = ({ boltz, currentUser, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch comments
  useEffect(() => {
    fetchComments();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`boltz_comments:${boltz.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'boltz_comments',
          filter: `boltz_id=eq.${boltz.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchComments();
          } else if (payload.eventType === 'DELETE') {
            setComments(prev => prev.filter(c => c.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [boltz.id]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('boltz_comments')
        .select(`
          *,
          user:user_id (
            id,
            username,
            avatar_url,
            verified
          ),
          likes:comment_likes(count)
        `)
        .eq('boltz_id', boltz.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedComments = data.map(comment => ({
        ...comment,
        likes: comment.likes?.[0]?.count || 0,
        isLiked: false
      }));

      // Check if user liked any comments
      if (currentUser && formattedComments.length > 0) {
        const { data: likesData } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', currentUser.id)
          .in('comment_id', formattedComments.map(c => c.id));

        const likedIds = new Set(likesData?.map(l => l.comment_id) || []);
        formattedComments.forEach(comment => {
          comment.isLiked = likedIds.has(comment.id);
        });
      }

      setComments(formattedComments);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || submitting) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('boltz_comments').insert({
        boltz_id: boltz.id,
        user_id: currentUser.id,
        text: newComment.trim(),
        parent_id: replyTo?.id || null
      });

      if (error) throw error;

      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      console.error('Error posting comment:', err);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (comment) => {
    if (!currentUser) {
      alert('Please login to like comments');
      return;
    }

    const newLikedState = !comment.isLiked;
    const newLikeCount = comment.likes + (newLikedState ? 1 : -1);

    // Optimistic update
    setComments(prev => prev.map(c =>
      c.id === comment.id
        ? { ...c, isLiked: newLikedState, likes: newLikeCount }
        : c
    ));

    try {
      if (newLikedState) {
        await supabase.from('comment_likes').insert({
          comment_id: comment.id,
          user_id: currentUser.id
        });
      } else {
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUser.id);
      }
    } catch (err) {
      console.error('Error toggling comment like:', err);
      // Revert on error
      setComments(prev => prev.map(c =>
        c.id === comment.id
          ? { ...c, isLiked: comment.isLiked, likes: comment.likes }
          : c
      ));
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('boltz_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  };

  // Close on outside click
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div 
      className="comment-modal-overlay"
      ref={modalRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-labelledby="comment-modal-title"
      aria-modal="true"
    >
      <div className="comment-modal">
        {/* Header */}
        <div className="comment-modal-header">
          <h2 id="comment-modal-title">
            {formatNumber(comments.length)} Comment{comments.length !== 1 ? 's' : ''}
          </h2>
          <button
            className="comment-modal-close"
            onClick={onClose}
            aria-label="Close comments"
          >
            <svg viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
              />
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="comment-modal-body">
          {loading ? (
            <div className="comments-loading">
              <div className="spinner"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="comments-empty">
              <span className="empty-icon">💬</span>
              <p>No comments yet</p>
              <p className="empty-subtitle">Be the first to comment!</p>
            </div>
          ) : (
            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} className="comment-item">
                  <img
                    src={comment.user.avatar_url || '/default-avatar.png'}
                    alt={comment.user.username}
                    className="comment-avatar"
                  />
                  
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-username">
                        @{comment.user.username}
                        {comment.user.verified && (
                          <svg className="verified-icon" viewBox="0 0 16 16">
                            <path fill="currentColor" d="M8 0L6.545 1.455 4.91 1.09 4.09 2.545 2.545 3.365 2.18 5l-.635 1.455L3 8l-1.455 1.545.365 1.545.82 1.455 1.455.82.365 1.635L6.545 16 8 14.545 9.455 16l1.635-.365 1.455-.82.82-1.455.365-1.545L15.455 10 14 8l1.455-1.545-.365-1.635-.82-1.455-1.455-.82L12.455 1 9.455 0 8 1.455z"/>
                            <path fill="#fff" d="M6.5 11L4 8.5l1-1 1.5 1.5 4-4 1 1z"/>
                          </svg>
                        )}
                      </span>
                      <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
                    </div>
                    
                    <p className="comment-text">{comment.text}</p>
                    
                    <div className="comment-actions">
                      <button
                        className={`comment-like-btn ${comment.isLiked ? 'active' : ''}`}
                        onClick={() => handleLikeComment(comment)}
                      >
                        {comment.likes > 0 && (
                          <span className="comment-like-count">{formatNumber(comment.likes)}</span>
                        )}
                        Like
                      </button>
                      
                      <button
                        className="comment-reply-btn"
                        onClick={() => {
                          setReplyTo(comment);
                          inputRef.current?.focus();
                        }}
                      >
                        Reply
                      </button>
                      
                      {currentUser && currentUser.id === comment.user_id && (
                        <button
                          className="comment-delete-btn"
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        {currentUser && (
          <form className="comment-modal-footer" onSubmit={handleSubmit}>
            {replyTo && (
              <div className="reply-indicator">
                Replying to @{replyTo.user.username}
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  aria-label="Cancel reply"
                >
                  ×
                </button>
              </div>
            )}
            
            <div className="comment-input-container">
              <img
                src={currentUser.user_metadata?.avatar_url || '/default-avatar.png'}
                alt="Your avatar"
                className="comment-input-avatar"
              />
              
              <input
                ref={inputRef}
                type="text"
                className="comment-input"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={submitting}
                maxLength={500}
              />
              
              <button
                type="submit"
                className="comment-submit-btn"
                disabled={!newComment.trim() || submitting}
                aria-label="Post comment"
              >
                {submitting ? (
                  <div className="spinner small"></div>
                ) : (
                  <svg viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CommentModal;
