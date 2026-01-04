import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './SearchResultCard.css';

/**
 * SearchResultCard - Display search results for users, posts, or hashtags
 * @component
 */
const SearchResultCard = React.memo(function SearchResultCard({ 
  result, 
  type, 
  onClick 
}) {
  const handleClick = () => {
    onClick(result);
  };

  // Render User Card
  if (type === 'user') {
    return (
      <motion.div
        className="search-result-card user-card"
        onClick={handleClick}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="user-avatar">
          <img
            src={result.avatarurl || `https://ui-avatars.com/api/?name=${result.username}`}
            alt={result.username}
            loading="lazy"
          />
        </div>
        <div className="user-info">
          <div className="user-name-row">
            <span className="user-name">
              {result.fullname || result.username}
            </span>
            {result.isverified && (
              <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
            )}
          </div>
          <span className="user-username">@{result.username}</span>
          {result.bio && (
            <p className="user-bio">{result.bio}</p>
          )}
          {result.followercount !== undefined && (
            <span className="user-stats">
              {result.followercount.toLocaleString()} followers
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // Render Post Card
  if (type === 'post') {
    const thumbnail = result.thumbnailurl || result.mediaurl || (result.mediaurls && result.mediaurls[0]);
    const author = result.profiles;
    
    return (
      <motion.div
        className="search-result-card post-card"
        onClick={handleClick}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {thumbnail && (
          <div className="post-thumbnail">
            <img
              src={thumbnail}
              alt="Post"
              loading="lazy"
            />
            {result.iscarousel && (
              <div className="carousel-indicator">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
            {result.mediatype === 'video' || (result.mediatypes && result.mediatypes[0] === 'video') && (
              <div className="video-indicator">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>
        )}
        <div className="post-info">
          {result.caption && (
            <p className="post-caption">
              {result.caption.length > 100 
                ? `${result.caption.substring(0, 100)}...` 
                : result.caption}
            </p>
          )}
          {author && (
            <div className="post-author">
              <img
                src={author.avatarurl || `https://ui-avatars.com/api/?name=${author.username}`}
                alt={author.username}
              />
              <span>{author.username}</span>
              {author.isverified && (
                <svg className="verified-badge" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>
          )}
          <div className="post-stats">
            {result.likecount !== undefined && (
              <span>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {result.likecount.toLocaleString()}
              </span>
            )}
            {result.commentcount !== undefined && (
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {result.commentcount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Render Hashtag Card
  if (type === 'hashtag') {
    return (
      <motion.div
        className="search-result-card hashtag-card"
        onClick={handleClick}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="hashtag-icon">
          <span>#</span>
        </div>
        <div className="hashtag-info">
          <span className="hashtag-name">#{result.tag}</span>
          {result.postcount !== undefined && (
            <span className="hashtag-count">
              {result.postcount.toLocaleString()} posts
            </span>
          )}
          {result.trendingscore !== undefined && result.trendingscore > 0 && (
            <div className="hashtag-trending">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.5 14.5l2.5-2.5 2.5 2.5 5-5" />
              </svg>
              <span>Trending</span>
            </div>
          )}
        </div>
        <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </motion.div>
    );
  }

  return null;
});

SearchResultCard.propTypes = {
  result: PropTypes.object.isRequired,
  type: PropTypes.oneOf(['user', 'post', 'hashtag']).isRequired,
  onClick: PropTypes.func.isRequired
};

export default SearchResultCard;
