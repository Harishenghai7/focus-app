import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useRealtimeInteractions } from '../hooks/useRealtimeInteractions';
import { formatDate } from '../utils/formatters/formatDate';
import linkify from '../utils/data/linkify';
import styles from './CommentSection.module.css';
import GifPicker from './GifPicker';

/**
 * CommentSection - Advanced comment system with nested replies, likes, sorting, and pinning.
 * 
 * Features:
 * - Comment list (nested/threaded)
 * - Add comment input with character counter
 * - Like comment with optimistic updates
 * - Reply to comment (nested threads)
 * - Load more comments (pagination)
 * - Sort by (top/recent/oldest)
 * - Pin comment (author only)
 * - Real-time updates
 * - Linkify URLs in comments
 * - Edit/Delete own comments
 * 
 * @component
 * @param {string} contentId - Unique content identifier
 * @param {string} contentType - Type of content ('post' | 'boltz' | 'flash')
 * @param {Object} user - Current user object
 * @returns {React.ReactElement}
 */
const CommentSection = React.memo(function CommentSection({ contentId, contentType = 'post', user }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replies, setReplies] = useState({});
  const [commentLikes, setCommentLikes] = useState({});
  const [loadingReplies, setLoadingReplies] = useState({});
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'top', 'oldest'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [contentAuthorId, setContentAuthorId] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  
  const COMMENTS_PER_PAGE = 10;
  const MAX_COMMENT_LENGTH = 500;

  // Fetch content author to enable pinning
  useEffect(() => {
    const fetchContentAuthor = async () => {
      if (!contentId || !contentType) return;
      
      try {
        const table = contentType === 'post' ? 'posts' : contentType === 'boltz' ? 'boltz' : 'flashes';
        const { data, error } = await supabase
          .from(table)
          .select('user_id')
          .eq('id', contentId)
          .single();
        
        if (!error && data) {
          setContentAuthorId(data.user_id);
        }
      } catch (error) {
        console.error('Error fetching content author:', error);
      }
    };

    fetchContentAuthor();
  }, [contentId, contentType]);

  // Fetch comments
  const fetchComments = useCallback(async (reset = false) => {
    if (!contentId) return;
    
    setLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const from = (currentPage - 1) * COMMENTS_PER_PAGE;
      const to = from + COMMENTS_PER_PAGE - 1;

      let query = supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, avatar_url, verified),
          comment_likes:likes!likes_comment_id_fkey(user_id)
        `, { count: 'exact' })
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .is('parent_comment_id', null);

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('is_pinned', { ascending: false })
          .order('created_at', { ascending: true });
      } else if (sortBy === 'top') {
        query = query.order('is_pinned', { ascending: false })
          .order('likes_count', { ascending: false });
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      
      const formattedData = (data || []).map(comment => ({
        ...comment,
        isLiked: comment.comment_likes?.some(like => like.user_id === user?.id) || false,
        likesCount: comment.likes_count || 0
      }));

      if (reset) {
        setComments(formattedData);
        setPage(1);
      } else {
        setComments(prev => [...prev, ...formattedData]);
      }
      
      setHasMore(formattedData.length === COMMENTS_PER_PAGE && count > to + 1);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  }, [contentId, contentType, page, sortBy, user]);

  // Fetch replies for a comment
  const fetchReplies = useCallback(async (commentId) => {
    if (replies[commentId]) {
      // Toggle collapse if already loaded
      setReplies(prev => ({ ...prev, [commentId]: null }));
      return;
    }

    setLoadingReplies(prev => ({ ...prev, [commentId]: true }));
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, avatar_url, verified),
          comment_likes:likes!likes_comment_id_fkey(user_id)
        `)
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const formattedReplies = (data || []).map(reply => ({
        ...reply,
        isLiked: reply.comment_likes?.some(like => like.user_id === user?.id) || false,
        likesCount: reply.likes_count || 0
      }));
      
      setReplies(prev => ({ ...prev, [commentId]: formattedReplies }));
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(prev => ({ ...prev, [commentId]: false }));
    }
  }, [replies, user]);

  // Submit comment or reply
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user || submitting) return;

    setSubmitting(true);
    try {
      const commentData = {
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
        text: newComment.trim(),
        parent_comment_id: replyingTo
      };

      const { data, error } = await supabase
        .from('comments')
        .insert([commentData])
        .select(`
          *,
          profiles!comments_user_id_fkey(id, username, avatar_url, verified)
        `)
        .single();

      if (error) throw error;

      // Add to local state
      const newCommentObj = {
        ...data,
        isLiked: false,
        likesCount: 0,
        comment_likes: []
      };

      if (replyingTo) {
        setReplies(prev => ({
          ...prev,
          [replyingTo]: [...(prev[replyingTo] || []), newCommentObj]
        }));
      } else {
        setComments(prev => [newCommentObj, ...prev]);
      }

      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Like/unlike a comment
  const toggleCommentLike = useCallback(async (commentId, isCurrentlyLiked) => {
    if (!user) return;

    // Optimistic update
    const updateLikeState = (commentsList) => 
      (commentsList || []).map(c => 
        c.id === commentId 
          ? { ...c, isLiked: !isCurrentlyLiked, likesCount: c.likesCount + (isCurrentlyLiked ? -1 : 1) }
          : c
      );

    setComments(updateLikeState);
    Object.keys(replies).forEach(key => {
      if (replies[key]) {
        setReplies(prev => ({ ...prev, [key]: updateLikeState(prev[key]) }));
      }
    });

    try {
      if (isCurrentlyLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert({ comment_id: commentId, user_id: user.id });
      }
    } catch (error) {
      // Revert on error
      setComments(updateLikeState);
      Object.keys(replies).forEach(key => {
        if (replies[key]) {
          setReplies(prev => ({ ...prev, [key]: updateLikeState(prev[key]) }));
        }
      });
      console.error('Error toggling comment like:', error);
    }
  }, [user, replies]);

  // Pin/unpin comment (author only)
  const togglePin = useCallback(async (commentId, isPinned) => {
    if (!user || user.id !== contentAuthorId) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ is_pinned: !isPinned })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => 
        (prev || []).map(c => c.id === commentId ? { ...c, is_pinned: !isPinned } : c)
      );
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }, [user, contentAuthorId]);

  // Delete comment
  const deleteComment = useCallback(async (commentId, isReply = false, parentId = null) => {
    if (!user) return;

    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      if (isReply && parentId) {
        setReplies(prev => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter(r => r.id !== commentId)
        }));
      } else {
        setComments(prev => prev.filter(c => c.id !== commentId));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment.');
    }
  }, [user]);

  // Setup reply
  const handleReply = useCallback((commentId, username) => {
    setReplyingTo(commentId);
    setNewComment(`@${username} `);
  }, []);

  const cancelReply = useCallback(() => {
    setReplyingTo(null);
    setNewComment('');
  }, []);

  // Insert GIF URL into comment
  const handleGifSelect = useCallback((gif) => {
    const url = gif?.url || gif?.previewUrl;
    if (!url) { setShowGifPicker(false); return; }
    setNewComment(prev => (prev ? prev + ' ' : '') + url);
    setShowGifPicker(false);
  }, []);

  // Initial load and sort change
  useEffect(() => {
    fetchComments(true);
  }, [contentId, contentType, sortBy]);

  // Load more handler
  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchComments(false);
  };

  // Render linkified text
  const renderText = (text) => {
    return { __html: linkify(text) };
  };

  // Check if user is content author
  const isContentAuthor = user?.id === contentAuthorId;

  // Safe comment rendering
  const renderComment = (comment, isReply = false, parentId = null) => {
    const isOwnComment = user?.id === comment.user_id;
    const commentReplies = replies[comment.id];
    const hasReplies = comment.replies_count > 0;

    return (
      <motion.div
        key={comment.id}
        className={`${styles.commentItem} ${isReply ? styles.replyItem : ''} ${comment.is_pinned ? styles.pinnedComment : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {comment.is_pinned && (
          <div className={styles.pinnedBadge}>
            <span>📌</span> Pinned by author
          </div>
        )}
        
        <div className={styles.commentInner}>
          <img
            src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.username || 'User'}`}
            alt={comment.profiles?.username || 'User'}
            className={styles.commentAvatar}
            loading="lazy"
          />
          
          <div className={styles.commentContent}>
            <div className={styles.commentHeader}>
              <div className={styles.commentMeta}>
                <span className={styles.commentUsername}>
                  {comment.profiles?.username || 'User'}
                  {comment.profiles?.verified && <span className={styles.verifiedBadge}>✓</span>}
                </span>
                <span className={styles.commentTime} title={new Date(comment.created_at).toLocaleString()}>
                  {formatDate(comment.created_at, 'relative')}
                </span>
              </div>
              
              {isOwnComment && (
                <button
                  onClick={() => deleteComment(comment.id, isReply, parentId)}
                  className={styles.deleteButton}
                  aria-label="Delete comment"
                  title="Delete comment"
                >
                  🗑️
                </button>
              )}
            </div>
            
            <div 
              className={styles.commentText}
              dangerouslySetInnerHTML={renderText(comment.text)}
            />
            
            <div className={styles.commentFooter}>
              <button
                onClick={() => toggleCommentLike(comment.id, comment.isLiked)}
                className={`${styles.likeButton} ${comment.isLiked ? styles.liked : ''}`}
                aria-label={comment.isLiked ? 'Unlike comment' : 'Like comment'}
                disabled={!user}
              >
                <span>{comment.isLiked ? '❤️' : '🤍'}</span>
                {comment.likesCount > 0 && <span className={styles.likeCount}>{comment.likesCount}</span>}
              </button>
              
              <button
                onClick={() => handleReply(comment.id, comment.profiles?.username || 'User')}
                className={styles.replyButton}
                aria-label="Reply to comment"
                disabled={!user}
              >
                Reply
              </button>
              
              {isContentAuthor && !isReply && (
                <button
                  onClick={() => togglePin(comment.id, comment.is_pinned)}
                  className={styles.pinButton}
                  aria-label={comment.is_pinned ? 'Unpin comment' : 'Pin comment'}
                >
                  {comment.is_pinned ? 'Unpin' : 'Pin'}
                </button>
              )}
              
              {hasReplies && !isReply && (
                <button
                  onClick={() => fetchReplies(comment.id)}
                  className={styles.viewRepliesButton}
                  aria-label={`${commentReplies ? 'Hide' : 'View'} ${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}`}
                  disabled={loadingReplies[comment.id]}
                >
                  {loadingReplies[comment.id] 
                    ? 'Loading...' 
                    : commentReplies 
                      ? `Hide ${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}`
                      : `View ${comment.replies_count} ${comment.replies_count === 1 ? 'reply' : 'replies'}`
                  }
                </button>
              )}
            </div>

            {commentReplies && commentReplies.length > 0 && (
              <div className={styles.repliesList}>
                <AnimatePresence>
                  {(commentReplies || []).map(reply => renderComment(reply, true, comment.id))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  if (!contentId) return null;

  return (
    <div className={styles.commentSection}>
      {/* Gif Picker Modal */}
      <GifPicker
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleGifSelect}
        provider="tenor"
      />
      
      <div className={styles.commentHeader}>
        <h3 className={styles.title}>
          Comments {comments.length > 0 && <span className={styles.count}>({comments.length})</span>}
        </h3>
        
        <div className={styles.sortButtons}>
          <button
            onClick={() => setSortBy('recent')}
            className={`${styles.sortButton} ${sortBy === 'recent' ? styles.active : ''}`}
            aria-label="Sort by most recent"
          >
            Recent
          </button>
          <button
            onClick={() => setSortBy('top')}
            className={`${styles.sortButton} ${sortBy === 'top' ? styles.active : ''}`}
            aria-label="Sort by most liked"
          >
            Top
          </button>
          <button
            onClick={() => setSortBy('oldest')}
            className={`${styles.sortButton} ${sortBy === 'oldest' ? styles.active : ''}`}
            aria-label="Sort by oldest"
          >
            Oldest
          </button>
        </div>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className={styles.commentForm}>
          {replyingTo && (
            <div className={styles.replyingIndicator}>
              Replying to comment
              <button type="button" onClick={cancelReply} className={styles.cancelReplyButton}>
                ✕
              </button>
            </div>
          )}
          
          <div className={styles.inputWrapper}>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
              disabled={submitting}
              maxLength={MAX_COMMENT_LENGTH}
              className={styles.commentInput}
              aria-label={replyingTo ? "Write a reply" : "Write a comment"}
              rows={3}
            />
            <div className={styles.inputFooter}>
              <button
                type="button"
                onClick={() => setShowGifPicker(true)}
                aria-label="Insert GIF"
                title="Insert GIF"
                className={styles.sortButton}
              >
                GIF
              </button>
              <span className={styles.charCounter}>
                {newComment.length}/{MAX_COMMENT_LENGTH}
              </span>
              <button 
                type="submit" 
                disabled={!newComment.trim() || submitting}
                className={styles.submitButton}
                aria-label="Post comment"
              >
                {submitting ? 'Posting...' : replyingTo ? 'Reply' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className={styles.loginPrompt}>
          Please log in to comment
        </div>
      )}

      <div className={styles.commentsList}>
        {loading && comments.length === 0 ? (
          <div className={styles.loadingState}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className={styles.emptyState}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            <AnimatePresence>
              {(comments || []).map(comment => renderComment(comment))}
            </AnimatePresence>
            
            {hasMore && (
              <button
                onClick={handleLoadMore}
                className={styles.loadMoreButton}
                disabled={loading}
                aria-label="Load more comments"
              >
                {loading ? 'Loading...' : 'Load More Comments'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

CommentSection.displayName = 'CommentSection';

CommentSection.propTypes = {
  contentId: PropTypes.string.isRequired,
  contentType: PropTypes.oneOf(['post', 'boltz', 'flash']),
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    username: PropTypes.string,
    avatar_url: PropTypes.string
  })
};

export default CommentSection;
