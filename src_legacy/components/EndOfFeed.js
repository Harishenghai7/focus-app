// src/components/EndOfFeed.js
import React from 'react';
import './EndOfFeed.css';

const EndOfFeed = () => {
  return (
    <div className="end-of-feed">
      <div className="end-of-feed-icon">🎉</div>
      <h3 className="end-of-feed-title">You're all caught up!</h3>
      <p className="end-of-feed-message">You've seen all new posts</p>
    </div>
  );
};

export default EndOfFeed;
