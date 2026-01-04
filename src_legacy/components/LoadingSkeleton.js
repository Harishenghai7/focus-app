// src/components/LoadingSkeleton.js
import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ count = 3 }) => {
  return (
    <div className="loading-skeleton">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="post-skeleton">
          {/* Header */}
          <div className="skeleton-header">
            <div className="skeleton-avatar shimmer"></div>
            <div className="skeleton-text-group">
              <div className="skeleton-text skeleton-username shimmer"></div>
              <div className="skeleton-text skeleton-location shimmer"></div>
            </div>
          </div>

          {/* Media */}
          <div className="skeleton-media shimmer"></div>

          {/* Actions */}
          <div className="skeleton-actions">
            <div className="skeleton-icon shimmer"></div>
            <div className="skeleton-icon shimmer"></div>
            <div className="skeleton-icon shimmer"></div>
          </div>

          {/* Caption */}
          <div className="skeleton-caption">
            <div className="skeleton-text skeleton-caption-line shimmer"></div>
            <div className="skeleton-text skeleton-caption-line short shimmer"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
