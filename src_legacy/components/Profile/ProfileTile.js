import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './ProfileTile.css';

/**
 * ProfileTile - Individual media thumbnail for grid with overlay indicators
 */
const ProfileTile = ({ item, index, onClick, contentType }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const getMediaUrl = () => {
    if (contentType === 'boltz' || item.type === 'video') {
      return item.thumbnail_url || item.media_url;
    }
    return item.media_url || item.thumbnail_url;
  };

  const isVideo = contentType === 'boltz' || item.type === 'video' || item.is_video;
  const isMulti = item.media_urls?.length > 1 || item.media_count > 1;
  const hasAudio = item.has_audio || item.audio_url;

  const getOverlayStats = () => {
    const stats = [];
    
    if (item.views_count || item.views) {
      stats.push({
        icon: '👁️',
        value: formatCount(item.views_count || item.views)
      });
    }
    
    if (item.likes_count || item.likes) {
      stats.push({
        icon: '❤️',
        value: formatCount(item.likes_count || item.likes)
      });
    }

    return stats;
  };

  const formatCount = (count) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const stats = getOverlayStats();

  return (
    <motion.div
      className="profile-tile"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View ${contentType} ${index + 1}`}
    >
      {/* Thumbnail Image */}
      <div className="tile-media-wrapper">
        {!imageLoaded && (
          <div className="tile-loading-skeleton">
            <div className="skeleton-shimmer"></div>
          </div>
        )}
        <img
          src={getMediaUrl()}
          alt={item.caption || `${contentType} thumbnail`}
          className={`tile-media ${imageLoaded ? 'loaded' : ''}`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
      </div>

      {/* Overlay Indicators */}
      <div className="tile-overlay">
        {/* Media Type Indicators */}
        <div className="tile-indicators">
          {isVideo && (
            <div className="tile-indicator video-indicator" aria-label="Video">
              ▶️
            </div>
          )}
          {isMulti && (
            <div className="tile-indicator multi-indicator" aria-label="Multiple media">
              📚
            </div>
          )}
          {hasAudio && (
            <div className="tile-indicator audio-indicator" aria-label="Has audio">
              🎵
            </div>
          )}
        </div>

        {/* Stats Overlay */}
        {stats.length > 0 && (
          <div className="tile-stats">
            {stats.map((stat, idx) => (
              <div key={idx} className="tile-stat">
                <span className="stat-icon">{stat.icon}</span>
                <span className="stat-value">{stat.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hover Gradient */}
      <div className="tile-hover-gradient"></div>
    </motion.div>
  );
};

ProfileTile.propTypes = {
  item: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired,
  contentType: PropTypes.string
};

export default ProfileTile;
