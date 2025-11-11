import React from 'react';
import './SkeletonScreen.css';

// Base skeleton component
export const Skeleton = ({ width = '100%', height = '20px', borderRadius = '4px', className = '' }) => (
  <div 
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
    role="status"
    aria-label="Loading content"
    aria-busy="true"
  />
);

// Skeleton for post card
export const PostSkeleton = () => (
  <div className="post-skeleton" role="status" aria-label="Loading post" aria-busy="true">
    {/* Header */}
    <div className="post-skeleton-header">
      <Skeleton width="40px" height="40px" borderRadius="50%" />
      <div className="post-skeleton-header-text">
        <Skeleton width="120px" height="14px" />
        <Skeleton width="80px" height="12px" />
      </div>
    </div>
    
    {/* Image */}
    <Skeleton width="100%" height="400px" borderRadius="0" />
    
    {/* Actions */}
    <div className="post-skeleton-actions">
      <Skeleton width="24px" height="24px" borderRadius="50%" />
      <Skeleton width="24px" height="24px" borderRadius="50%" />
      <Skeleton width="24px" height="24px" borderRadius="50%" />
    </div>
    
    {/* Caption */}
    <div className="post-skeleton-caption">
      <Skeleton width="100%" height="14px" />
      <Skeleton width="80%" height="14px" />
    </div>
  </div>
);

// Skeleton for profile header
export const ProfileSkeleton = () => (
  <div className="profile-skeleton">
    <div className="profile-skeleton-header">
      <Skeleton width="80px" height="80px" borderRadius="50%" />
      <div className="profile-skeleton-stats">
        <div className="profile-skeleton-stat">
          <Skeleton width="40px" height="20px" />
          <Skeleton width="60px" height="14px" />
        </div>
        <div className="profile-skeleton-stat">
          <Skeleton width="40px" height="20px" />
          <Skeleton width="60px" height="14px" />
        </div>
        <div className="profile-skeleton-stat">
          <Skeleton width="40px" height="20px" />
          <Skeleton width="60px" height="14px" />
        </div>
      </div>
    </div>
    <div className="profile-skeleton-info">
      <Skeleton width="150px" height="16px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="90%" height="14px" />
    </div>
    <div className="profile-skeleton-actions">
      <Skeleton width="100%" height="36px" borderRadius="8px" />
    </div>
  </div>
);

// Skeleton for user list item
export const UserListSkeleton = () => (
  <div className="user-list-skeleton">
    <Skeleton width="48px" height="48px" borderRadius="50%" />
    <div className="user-list-skeleton-text">
      <Skeleton width="120px" height="16px" />
      <Skeleton width="180px" height="14px" />
    </div>
    <Skeleton width="80px" height="32px" borderRadius="8px" />
  </div>
);

// Skeleton for message list
export const MessageListSkeleton = () => (
  <div className="message-list-skeleton">
    {[1, 2, 3, 4, 5].map(i => (
      <div key={i} className="message-item-skeleton">
        <Skeleton width="48px" height="48px" borderRadius="50%" />
        <div className="message-item-skeleton-text">
          <div className="message-item-skeleton-header">
            <Skeleton width="120px" height="16px" />
            <Skeleton width="40px" height="12px" />
          </div>
          <Skeleton width="200px" height="14px" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for notification item
export const NotificationSkeleton = () => (
  <div className="notification-skeleton">
    <Skeleton width="40px" height="40px" borderRadius="50%" />
    <div className="notification-skeleton-text">
      <Skeleton width="100%" height="14px" />
      <Skeleton width="60%" height="12px" />
    </div>
  </div>
);

// Skeleton for grid (explore page)
export const GridSkeleton = ({ count = 9 }) => (
  <div className="grid-skeleton">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton 
        key={i} 
        width="100%" 
        height="0" 
        style={{ paddingBottom: '100%' }}
        borderRadius="4px"
      />
    ))}
  </div>
);

// Skeleton for story circles
export const StorySkeleton = () => (
  <div className="story-skeleton">
    {[1, 2, 3, 4, 5, 6].map(i => (
      <div key={i} className="story-item-skeleton">
        <Skeleton width="64px" height="64px" borderRadius="50%" />
        <Skeleton width="60px" height="12px" />
      </div>
    ))}
  </div>
);

// Skeleton for comment
export const CommentSkeleton = () => (
  <div className="comment-skeleton">
    <Skeleton width="32px" height="32px" borderRadius="50%" />
    <div className="comment-skeleton-text">
      <Skeleton width="100px" height="14px" />
      <Skeleton width="100%" height="14px" />
      <Skeleton width="80%" height="14px" />
    </div>
  </div>
);

// Full page skeleton for home feed
export const HomeFeedSkeleton = () => (
  <div className="home-feed-skeleton">
    <StorySkeleton />
    <PostSkeleton />
    <PostSkeleton />
    <PostSkeleton />
  </div>
);

// Full page skeleton for explore
export const ExploreSkeleton = () => (
  <div className="explore-skeleton">
    <div className="explore-skeleton-header">
      <Skeleton width="100%" height="40px" borderRadius="20px" />
    </div>
    <GridSkeleton count={12} />
  </div>
);

// Full page skeleton for profile
export const ProfilePageSkeleton = () => (
  <div className="profile-page-skeleton">
    <ProfileSkeleton />
    <div className="profile-tabs-skeleton">
      <Skeleton width="33%" height="44px" />
      <Skeleton width="33%" height="44px" />
      <Skeleton width="33%" height="44px" />
    </div>
    <GridSkeleton count={9} />
  </div>
);

// Full page skeleton for messages
export const MessagesPageSkeleton = () => (
  <div className="messages-page-skeleton">
    <div className="messages-header-skeleton">
      <Skeleton width="150px" height="28px" />
      <Skeleton width="32px" height="32px" borderRadius="50%" />
    </div>
    <MessageListSkeleton />
  </div>
);

// Full page skeleton for notifications
export const NotificationsPageSkeleton = () => (
  <div className="notifications-page-skeleton">
    <div className="notifications-header-skeleton">
      <Skeleton width="150px" height="28px" />
    </div>
    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
      <NotificationSkeleton key={i} />
    ))}
  </div>
);

// Loading spinner component
export const LoadingSpinner = ({ size = 'medium', color = 'primary' }) => {
  const sizes = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };
  
  return (
    <div 
      className={`loading-spinner loading-spinner-${color}`}
      style={{ 
        width: sizes[size], 
        height: sizes[size] 
      }}
      role="status"
      aria-label="Loading"
      aria-busy="true"
    />
  );
};

// Loading overlay
export const LoadingOverlay = ({ message = 'Loading...' }) => (
  <div className="loading-overlay" role="dialog" aria-modal="true" aria-labelledby="loading-message">
    <div className="loading-overlay-content">
      <LoadingSpinner size="large" />
      <p id="loading-message" className="loading-overlay-message">{message}</p>
    </div>
  </div>
);

export default {
  Skeleton,
  PostSkeleton,
  ProfileSkeleton,
  UserListSkeleton,
  MessageListSkeleton,
  NotificationSkeleton,
  GridSkeleton,
  StorySkeleton,
  CommentSkeleton,
  HomeFeedSkeleton,
  ExploreSkeleton,
  ProfilePageSkeleton,
  MessagesPageSkeleton,
  NotificationsPageSkeleton,
  LoadingSpinner,
  LoadingOverlay
};
