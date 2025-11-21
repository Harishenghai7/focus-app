import React from 'react';

const LoadingFallback = () => {
  return (
    <div className="boltz-loading">
      <div className="loading-container">
        {/* Video Skeleton */}
        <div className="loading-video-skeleton">
          <div className="shimmer-overlay"></div>
          
          {/* Avatar Skeleton */}
          <div className="loading-avatar-skeleton"></div>
          
          {/* Info Skeleton */}
          <div className="loading-info-skeleton">
            <div className="loading-username-skeleton"></div>
            <div className="loading-caption-skeleton"></div>
            <div className="loading-caption-skeleton short"></div>
          </div>
          
          {/* Controls Skeleton */}
          <div className="loading-controls-skeleton">
            <div className="loading-action-skeleton"></div>
            <div className="loading-action-skeleton"></div>
            <div className="loading-action-skeleton"></div>
            <div className="loading-action-skeleton"></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="loading-text">
          <div className="loading-spinner"></div>
          <p>Loading Boltz...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingFallback;
