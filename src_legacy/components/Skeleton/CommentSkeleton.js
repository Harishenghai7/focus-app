import React from 'react';
import '../styles/skeleton.css';

/**
 * CommentSkeleton - Loading skeleton for a single comment
 * Mimics comment structure with avatar, author info, and text
 * 
 * @param {boolean} isReply - Whether this is a nested reply comment
 */
export const CommentSkeleton = ({ isReply = false }) => {
  return (
    <div className={`skeleton-comment ${isReply ? 'skeleton-comment-reply' : ''}`}>
      {/* Avatar */}
      <div className="skeleton-comment-avatar"></div>

      {/* Comment Content */}
      <div className="skeleton-comment-content">
        {/* Header - Author, Time, etc */}
        <div className="skeleton-comment-header">
          <div className="skeleton-line skeleton-comment-author"></div>
          <div className="skeleton-line skeleton-comment-time"></div>
        </div>

        {/* Comment Text */}
        <div className="skeleton-comment-text">
          <div className="skeleton-line"></div>
          <div className="skeleton-line" style={{ width: '85%' }}></div>
        </div>

        {/* Actions */}
        <div className="skeleton-comment-actions">
          <div className="skeleton-action-small"></div>
          <div className="skeleton-action-small"></div>
          <div className="skeleton-action-small"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * CommentSectionSkeleton - Loading skeleton for entire comment section
 */
export const CommentSectionSkeleton = ({ count = 4, hasReplies = true }) => {
  return (
    <div className="skeleton-comment-section">
      {/* Comments */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {/* Main Comment */}
          <CommentSkeleton isReply={false} />

          {/* Replies */}
          {hasReplies && i < count - 1 && (
            <div className="skeleton-comment-replies">
              <CommentSkeleton isReply={true} />
              <CommentSkeleton isReply={true} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * CommentInputSkeleton - Comment text input skeleton
 */
export const CommentInputSkeleton = () => {
  return (
    <div className="skeleton-comment-input">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-input-field"></div>
    </div>
  );
};

export default CommentSkeleton;
