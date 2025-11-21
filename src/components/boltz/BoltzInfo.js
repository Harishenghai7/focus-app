import React from 'react';
import { linkifyText } from '../../utils/linkifyText';

const BoltzInfo = ({ boltz, currentUser, isFollowing, onFollow }) => {
  const handleProfileClick = () => {
    window.location.href = `/profile/${boltz.user.username}`;
  };

  return (
    <div className="boltz-info">
      {/* User Info */}
      <div className="boltz-user">
        <div 
          className="boltz-avatar-container"
          onClick={handleProfileClick}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleProfileClick()}
        >
          <img
            src={boltz.user.avatar_url || '/default-avatar.png'}
            alt={boltz.user.username}
            className="boltz-avatar"
          />
          {boltz.user.verified && (
            <svg className="verified-badge" viewBox="0 0 24 24">
              <path
                fill="#FFD600"
                d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
              />
              <circle cx="12" cy="12" r="11" fill="none" stroke="#FFD600" strokeWidth="2"/>
            </svg>
          )}
        </div>

        <div className="boltz-user-info">
          <div className="boltz-username-row">
            <span 
              className="boltz-username"
              onClick={handleProfileClick}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && handleProfileClick()}
            >
              @{boltz.user.username}
            </span>
            {boltz.user.verified && (
              <svg className="verified-icon" viewBox="0 0 16 16">
                <path
                  fill="currentColor"
                  d="M8 0L6.545 1.455 4.91 1.09 4.09 2.545 2.545 3.365 2.18 5l-.635 1.455L3 8l-1.455 1.545.365 1.545.82 1.455 1.455.82.365 1.635L6.545 16 8 14.545 9.455 16l1.635-.365 1.455-.82.82-1.455.365-1.545L15.455 10 14 8l1.455-1.545-.365-1.635-.82-1.455-1.455-.82L12.455 1 9.455 0 8 1.455z"
                />
                <path
                  fill="#fff"
                  d="M6.5 11L4 8.5l1-1 1.5 1.5 4-4 1 1z"
                />
              </svg>
            )}
          </div>

          {currentUser && currentUser.id !== boltz.user.id && (
            <button
              className={`boltz-follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onFollow();
              }}
              aria-label={isFollowing ? 'Unfollow' : 'Follow'}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>
      </div>

      {/* Caption */}
      {boltz.caption && (
        <div className="boltz-caption">
          <p dangerouslySetInnerHTML={{ __html: linkifyText(boltz.caption) }} />
        </div>
      )}

      {/* Hashtags */}
      {boltz.hashtags && boltz.hashtags.length > 0 && (
        <div className="boltz-hashtags">
          {boltz.hashtags.map((tag, index) => (
            <a
              key={index}
              href={`/explore?tag=${encodeURIComponent(tag)}`}
              className="boltz-hashtag"
              onClick={(e) => e.stopPropagation()}
            >
              #{tag}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default BoltzInfo;
