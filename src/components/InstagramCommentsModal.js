import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import ReactionPicker from './ReactionPicker';
import './CommentsModal.css';

export default function InstagramCommentsModal({ 
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

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      fetchAllReactions();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, contentId]);

  const fetchComments = async () => {
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
  };

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
  
  const fetchAllReactions = async () => {
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
  };
  
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
            <div className="comments-header">
              <h3>Comments</h3>
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="comments-list">
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
                    <div key={comment.id} className="comment-thread">
                      <motion.div
                        className="comment-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <img
                          src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.username || 'User'}`}
                          alt={comment.profiles?.username || 'User'}
                          className="comment-avatar"
                        />
                        <div className="comment-content">
                          <div className="comment-header">
                            <span className="comment-username">
                              {comment.profiles?.username || 'User'}
                              {comment.is_pinned && (
                                <span className="pinned-badge" title="Pinned comment">📌</span>
                              )}
                            </span>
                            <span className="comment-time">{formatTimeAgo(comment.created_at)}</span>
                          </div>
                          <p className="comment-text">{comment.text}</p>
                          <div className="comment-actions">
                            <button 
                              className="comment-action-btn"
                              onClick={() => handleReply(comment)}
                            >
                              Reply
                            </button>
                            <button 
                              className="comment-action-btn"
                              onClick={() => setShowReactionPicker(comment.id)}
                            >
                              React
                            </button>
                            {user?.id === contentOwnerId && (
                              <button 
                                className="comment-action-btn pin-btn"
                                onClick={() => handlePinComment(comment)}
                              >
                                {comment.is_pinned ? 'Unpin' : 'Pin'}
                              </button>
                            )}
                            {comment.reply_count > 0 && (
                              <button 
                                className="comment-action-btn view-replies-btn"
                                onClick={() => toggleReplies(comment.id)}
                              >
                                {expandedReplies.has(comment.id) ? '─' : '─'} {comment.reply_count} {comment.reply_count === 1 ? 'reply' : 'replies'}
                              </button>
                            )}
                          </div>
                          
                          {/* Reaction Summary */}
                          {getReactionSummary(comment.id).length > 0 && (
                            <div className="comment-reactions">
                              {getReactionSummary(comment.id).map(({ emoji, count, hasReacted }) => (
                                <button
                                  key={emoji}
                                  className={`reaction-badge ${hasReacted ? 'reacted' : ''}`}
                                  onClick={() => handleReaction(comment.id, emoji)}
                                >
                                  <span className="reaction-emoji">{emoji}</span>
                                  <span className="reaction-count">{count}</span>
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
                            className="comment-replies"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            {comment.replies.map((reply) => (
                              <React.Fragment key={reply.id}>
                                <motion.div
                                  className="comment-item comment-reply"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                >
                                  <img
                                    src={reply.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${reply.profiles?.username || 'User'}`}
                                    alt={reply.profiles?.username || 'User'}
                                    className="comment-avatar"
                                  />
                                  <div className="comment-content">
                                    <div className="comment-header">
                                      <span className="comment-username">
                                        {reply.profiles?.username || 'User'}
                                      </span>
                                      <span className="comment-time">{formatTimeAgo(reply.created_at)}</span>
                                    </div>
                                    <p className="comment-text">{reply.text}</p>
                                    <div className="comment-actions">
                                      <button 
                                        className="comment-action-btn"
                                        onClick={() => setShowReactionPicker(reply.id)}
                                      >
                                        React
                                      </button>
                                    </div>
                                    
                                    {/* Reaction Summary for Replies */}
                                    {getReactionSummary(reply.id).length > 0 && (
                                      <div className="comment-reactions">
                                        {getReactionSummary(reply.id).map(({ emoji, count, hasReacted }) => (
                                          <button
                                            key={emoji}
                                            className={`reaction-badge ${hasReacted ? 'reacted' : ''}`}
                                            onClick={() => handleReaction(reply.id, emoji)}
                                          >
                                            <span className="reaction-emoji">{emoji}</span>
                                            <span className="reaction-count">{count}</span>
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
                  className="reply-indicator"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <span>Replying to @{replyingTo.profiles.username}</span>
                  <button onClick={cancelReply} className="cancel-reply-btn">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="comment-form" onSubmit={handleSubmit}>
              <img
                src={user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user?.email || 'User'}`}
                alt="Your avatar"
                className="comment-input-avatar"
              />
              <div className="comment-input-container">
                <input
                  ref={inputRef}
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={replyingTo ? `Reply to ${replyingTo.profiles.username}...` : 'Add a comment...'}
                  className="comment-input"
                  maxLength={500}
                  disabled={submitting}
                />
                <button
                  type="submit"
                  className="comment-submit-btn"
                  disabled={!newComment.trim() || submitting}
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
}