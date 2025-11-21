import React from 'react';
import './LoadingFallback.css';

const LoadingFallback = () => {
  // Generate skeleton items for grid layout
  const skeletonItems = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div className="loading-fallback" role="status" aria-label="Loading content">
      <div className="loading-grid">
        {skeletonItems.map((item) => (
          <div key={item} className="skeleton-tile" aria-hidden="true">
            <div className="skeleton-media">
              <div className="skeleton-shimmer" />
            </div>
            <div className="skeleton-overlay">
              <div className="skeleton-stats">
                <div className="skeleton-stat" />
                <div className="skeleton-stat" />
              </div>
              <div className="skeleton-user">
                <div className="skeleton-avatar" />
                <div className="skeleton-name" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Loading explore content...</span>
    </div>
  );
};

export default LoadingFallback;
