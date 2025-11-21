import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { supabase } from '../supabaseClient';
import MessageInput from './MessageInput';
import ReportModal from './ReportModal';
import { formatDate } from '../utils/dateFormatter';
import { linkifyAll } from '../utils/linkifiedText';
import styles from './CommentCard.module.css';

/**
 * CommentCard - Individual comment display with actions
 * @component
 * @param {Object} comment - Comment data
 * @param {Object} currentUser - Current logged in user
 * @param {Function} onReply - Reply handler
 * @param {Function} onDelete - Delete handler
 * @param {Function} onLike - Like handler
 * @param {number} depth - Nesting depth for indentation
 * @param {Function} onLoadReplies - Load more replies handler
 * @param {Function} onUserClick - User click handler (navigate to profile)
 * @returns {React.ReactElement}
 */
const CommentCard = React.memo(function CommentCard({
  comment,
  currentUser,
  onReply,
  onDelete,
  onLike,
  depth = 0,
  onLoadReplies,
  onUserClick
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isLiked, setIsLiked] = useState(comment.is_liked || false);
  const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle like/unlike
  const handleLike = async () => {
    if (!currentUser) return;

    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (newLikedState) {
        await supabase.from('comment_likes').insert({
          comment_id: comment.id,
          user_id: currentUser.id
        });
      } else {
        await supabase.from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUser.id);
      }
      if (onLike) onLike(comment.id, newLikedState);
    } catch (error) {
      console.error('Error liking comment:', error);
      // Revert on error
      setIsLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  // Handle reply
  const handleReplySubmit = (content) => {
    if (content.trim() && onReply) {
      onReply(comment.id, content);
      setShowReplyInput(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    setIsDeleting(true);
    try {
      await supabase.from('comments')
        .delete()
        .eq('id', comment.id)
        .eq('user_id', currentUser.id);
      
      if (onDelete) onDelete(comment.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment');
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle replies visibility
  const handleToggleReplies = () => {
    if (!showReplies && onLoadReplies) {
      onLoadReplies(comment.id);
    }
    setShowReplies(!showReplies);
  };

  // Check if user owns the comment
  const isOwner = currentUser && comment.user_id === currentUser.id;

  // Format comment text with links
  const formattedContent = linkifyAll(comment.content || '', {
    urls: true,
    mentions: true,
    hashtags: true
  });

  // Indent based on depth (max depth 5)
  const indentStyle = {
    marginLeft: `${Math.min(depth, 5) * 20}px`
  };

  return (
    <div className={styles.commentCard} style={indentStyle}>
      <div className={styles.commentHeader}>
        <div 
          className={styles.userInfo}
          onClick={() => onUserClick?.(comment.user?.username)}
          style={{ cursor: onUserClick ? 'pointer' : 'default' }}
        >
          {comment.user?.avatar_url ? (
            <img 
              src={comment.user.avatar_url} 
              alt={comment.user.username}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {(comment.user?.username || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className={styles.userDetails}>
            <span className={styles.username}>
              @{comment.user?.username || 'Unknown'}
            </span>
            <span className={styles.timestamp}>
              {formatDate(comment.created_at)}
            </span>
          </div>
        </div>

        {!isOwner && currentUser && (
          <button
            className={styles.reportBtn}
            onClick={() => setShowReportModal(true)}
            aria-label="Report comment"
            title="Report comment"
          >
            ⚠️
          </button>
        )}
      </div>

      <div 
        className={styles.commentContent}
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />

      <div className={styles.commentActions}>
        <button
          className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`}
          onClick={handleLike}
          disabled={!currentUser || isDeleting}
          aria-label={isLiked ? 'Unlike comment' : 'Like comment'}
        >
          {isLiked ? '❤️' : '🤍'} {likesCount > 0 && likesCount}
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => setShowReplyInput(!showReplyInput)}
          disabled={!currentUser || isDeleting}
          aria-label="Reply to comment"
        >
          💬 Reply
        </button>

        {comment.replies_count > 0 && (
          <button
            className={styles.actionBtn}
            onClick={handleToggleReplies}
            aria-label={showReplies ? 'Hide replies' : 'Show replies'}
          >
            {showReplies ? '▼' : '▶'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {isOwner && (
          <button
            className={`${styles.actionBtn} ${styles.deleteBtn}`}
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label="Delete comment"
          >
            🗑️ Delete
          </button>
        )}
      </div>

      {showReplyInput && (
        <div className={styles.replyInputContainer}>
          <MessageInput
            onSend={handleReplySubmit}
            disabled={isDeleting}
          />
        </div>
      )}

      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {comment.replies.map(reply => (
            <CommentCard
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onReply={onReply}
              onDelete={onDelete}
              onLike={onLike}
              depth={depth + 1}
              onLoadReplies={onLoadReplies}
            />
          ))}
        </div>
      )}

      {showReportModal && (
        <ReportModal
          reportType="comment"
          reportedId={comment.id}
          reportedUser={comment.user}
          currentUser={currentUser}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
});

CommentCard.propTypes = {
  comment: PropTypes.shape({
    id: PropTypes.string.isRequired,
    content: PropTypes.string.isRequired,
    user_id: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    user: PropTypes.object,
    is_liked: PropTypes.bool,
    likes_count: PropTypes.number,
    replies_count: PropTypes.number,
    replies: PropTypes.array
  }).isRequired,
  currentUser: PropTypes.object,
  onReply: PropTypes.func,
  onDelete: PropTypes.func,
  onLike: PropTypes.func,
  onUserClick: PropTypes.func,
  depth: PropTypes.number,
  onLoadReplies: PropTypes.func
};

export default CommentCard;
