import React from 'react';

const FeedEmptyState = ({ onRefresh }) => {
  return (
    <div className="feed-empty">
      <p>No posts yet</p>
      <button onClick={onRefresh}>
        Refresh
      </button>
    </div>
  );
};

export default FeedEmptyState;
