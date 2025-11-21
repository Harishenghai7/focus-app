import React from 'react';
import '../styles/skeleton.css';

/**
 * PostSkeleton - Loading skeleton for post cards
 * Mimics the structure of a post with animated shimmer effect
 * 
 * @param {boolean} showActions - Whether to show action buttons skeleton
 * @param {number} lines - Number of content lines to show
 */
export const PostSkeleton = ({ showActions = true, lines = 3 }) => {
  return (
    <div className="skeleton-post">
      {/* Header - Avatar and Info */}
      <div className="skeleton-post-header">
        <div className="skeleton-avatar"></div>
        <div className="skeleton-info">
          <div className="skeleton-line skeleton-name"></div>
          <div className="skeleton-line skeleton-time"></div>
        </div>
      </div>

      {/* Post Image/Content Area */}
      <div className="skeleton-post-image"></div>

      {/* Post Text */}
      <div className="skeleton-post-content">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-line"
            style={{
              width: i === lines - 1 ? '80%' : '100%',
            }}
          ></div>
        ))}
      </div>

      {/* Engagement Stats */}
      <div className="skeleton-post-stats">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="skeleton-post-actions">
          <div className="skeleton-action"></div>
          <div className="skeleton-action"></div>
          <div className="skeleton-action"></div>
          <div className="skeleton-action"></div>
        </div>
      )}
    </div>
  );
};

/**
 * PostListSkeleton - Multiple post skeletons
 */
export const PostListSkeleton = ({ count = 3 }) => {
  return (
    <div className="skeleton-post-list">
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </div>
  );
};

export default PostSkeleton;
