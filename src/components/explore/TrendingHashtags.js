import React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import './TrendingHashtags.css';

const TrendingHashtags = ({ hashtags, onHashtagClick }) => {
  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  const handleClick = (hashtag) => {
    onHashtagClick(hashtag);
  };

  const handleKeyPress = (e, hashtag) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onHashtagClick(hashtag);
    }
  };

  return (
    <div className="trending-hashtags">
      <h2 className="trending-title">
        <svg className="trending-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M13 10V3L4 14h7v7l9-11h-7z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="currentColor"
          />
        </svg>
        Trending
      </h2>
      
      <div className="trending-tags" role="list">
        {hashtags.map((tag, index) => (
          <button
            key={tag.hashtag || index}
            className="explore-tag"
            onClick={() => handleClick(tag.hashtag)}
            onKeyPress={(e) => handleKeyPress(e, tag.hashtag)}
            role="listitem"
            aria-label={`Trending hashtag ${tag.hashtag} with ${formatNumber(tag.count)} posts`}
          >
            <span className="tag-rank" aria-hidden="true">{index + 1}</span>
            <div className="tag-content">
              <span className="tag-name">#{tag.hashtag}</span>
              <span className="tag-count">{formatNumber(tag.count)} posts</span>
            </div>
            <div className="tag-gradient" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default TrendingHashtags;
