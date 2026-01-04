import React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import './SuggestedUsers.css';

const SuggestedUsers = ({ users, onUserClick }) => {
  if (!users || users.length === 0) {
    return null;
  }

  const handleClick = (userId) => {
    onUserClick(userId);
  };

  const handleKeyPress = (e, userId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onUserClick(userId);
    }
  };

  return (
    <div className="suggested-users">
      <h2 className="suggested-title">
        <svg className="suggested-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Suggested
      </h2>
      
      <div className="suggested-users-list" role="list">
        {users.slice(0, 5).map((user) => (
          <button
            key={user.id}
            className="suggested-user"
            onClick={() => handleClick(user.id)}
            onKeyPress={(e) => handleKeyPress(e, user.id)}
            role="listitem"
            aria-label={`View profile of ${user.display_name || user.username}${user.verified ? ', verified user' : ''}`}
          >
            <div className="suggested-user-avatar-wrapper">
              <img
                src={user.avatar_url || '/default-avatar.png'}
                alt=""
                className="suggested-user-avatar"
                loading="lazy"
              />
              {user.verified && (
                <div className="verified-badge" aria-label="Verified">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="currentColor"
                    />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="suggested-user-info">
              <span className="suggested-user-name">
                {user.display_name || user.username}
              </span>
              <span className="suggested-user-username">@{user.username}</span>
              {user.follower_count !== undefined && (
                <span className="suggested-user-followers">
                  {formatNumber(user.follower_count)} followers
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;
