import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './TrendingHashtags.css';

/**
 * TrendingHashtags - Horizontal hashtag bar with lavender glass styling
 * @param {Array} hashtags - Array of hashtag objects
 * @param {Function} onHashtagClick - Click handler for hashtags
 * @param {String} selectedHashtag - Currently selected hashtag
 */
export default function TrendingHashtags({ hashtags = [], onHashtagClick, selectedHashtag }) {
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    else if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  return (
    <div className="trending-hashtags-section">
      <div className="trending-hashtags-header">
        <svg
          className="trending-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
        <h3 className="trending-hashtags-title">Trending Hashtags</h3>
      </div>

      <div className="trending-hashtags-scroll-container">
        <div className="trending-hashtags-list">
          {hashtags.map((hashtag, index) => (
            <motion.button
              key={hashtag.id || hashtag.tag}
              className={`trending-hashtag-tag ${
                selectedHashtag === hashtag.tag ? 'active' : ''
              }`}
              onClick={() => onHashtagClick?.(hashtag.tag)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              aria-label={`Filter by ${hashtag.tag} hashtag`}
              role="button"
              tabIndex={0}
            >
              <span className="hashtag-symbol">#</span>
              <span className="hashtag-text">{hashtag.tag}</span>
              <span className="hashtag-count">{formatNumber(hashtag.postcount || 0)}</span>
              {selectedHashtag === hashtag.tag && (
                <motion.div
                  className="hashtag-selected-indicator"
                  layoutId="selectedHashtag"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

TrendingHashtags.propTypes = {
  hashtags: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      tag: PropTypes.string.isRequired,
      postcount: PropTypes.number
    })
  ),
  onHashtagClick: PropTypes.func,
  selectedHashtag: PropTypes.string
};
