import React from 'react';
import '../styles/skeleton.css';

/**
 * ProfileSkeleton - Loading skeleton for profile pages
 * Shows profile header with cover, avatar, bio and posts grid
 * 
 * @param {boolean} showPostsGrid - Whether to show posts grid skeleton
 * @param {number} postCount - Number of posts to show in grid
 */
export const ProfileSkeleton = ({ showPostsGrid = true, postCount = 6 }) => {
  return (
    <div className="skeleton-profile">
      {/* Cover Image */}
      <div className="skeleton-profile-cover"></div>

      {/* Profile Header */}
      <div className="skeleton-profile-header">
        {/* Avatar */}
        <div className="skeleton-profile-avatar"></div>

        {/* Profile Info */}
        <div className="skeleton-profile-info">
          <div className="skeleton-line skeleton-profile-name"></div>
          <div className="skeleton-line skeleton-profile-username"></div>
          <div className="skeleton-line skeleton-profile-bio"></div>
        </div>

        {/* Stats */}
        <div className="skeleton-profile-stats">
          <div className="skeleton-stat-block">
            <div className="skeleton-stat-value"></div>
            <div className="skeleton-stat-label"></div>
          </div>
          <div className="skeleton-stat-block">
            <div className="skeleton-stat-value"></div>
            <div className="skeleton-stat-label"></div>
          </div>
          <div className="skeleton-stat-block">
            <div className="skeleton-stat-value"></div>
            <div className="skeleton-stat-label"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="skeleton-profile-actions">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>

      {/* Posts Grid */}
      {showPostsGrid && (
        <div className="skeleton-posts-grid">
          {Array.from({ length: postCount }).map((_, i) => (
            <div key={i} className="skeleton-post-grid-item"></div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ProfileHeaderSkeleton - Just the profile header skeleton
 */
export const ProfileHeaderSkeleton = () => {
  return (
    <div className="skeleton-profile">
      <div className="skeleton-profile-cover"></div>
      <div className="skeleton-profile-header" style={{ marginTop: '-30px' }}>
        <div className="skeleton-profile-avatar" style={{ width: '100px', height: '100px' }}></div>
        <div className="skeleton-profile-info">
          <div className="skeleton-line skeleton-profile-name"></div>
          <div className="skeleton-line skeleton-profile-username"></div>
          <div className="skeleton-line skeleton-profile-bio"></div>
        </div>
        <div className="skeleton-profile-actions">
          <div className="skeleton-button"></div>
          <div className="skeleton-button"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * ProfileGridSkeleton - Just the posts grid skeleton
 */
export const ProfileGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="skeleton-posts-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-post-grid-item"></div>
      ))}
    </div>
  );
};

export default ProfileSkeleton;
