import React from 'react';

const EndOfFeed = () => {
  return (
    <div className="end-of-feed">
      <div className="end-of-feed-content">
        <div className="end-icon">
          <svg viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        </div>
        
        <h3>You're all caught up!</h3>
        <p>You've seen all the latest Boltz</p>
        
        <button 
          className="create-more-btn"
          onClick={() => window.location.href = '/create/boltz'}
        >
          Create a Boltz
        </button>
      </div>
    </div>
  );
};

export default EndOfFeed;
