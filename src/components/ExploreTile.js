import React from 'react';
import { motion } from 'framer-motion';
import './ExploreTile.css';

export default function ExploreTile({ 
  item, 
  activeTab, 
  isLiked, 
  isFollowing, 
  onLike, 
  onFollow, 
  onClick 
}) {
  const renderTileContent = () => {
    switch (item.item_type) {
      case 'post':
      case 'boltz':
      case 'flash':
        return (
          <div className="media-tile" onClick={onClick}>
            <div className="media-thumbnail">
              <img 
                src={item.thumbnail_path || '/default-thumbnail.png'} 
                alt={item.caption}
                loading="lazy"
              />
              <div className="media-overlay">
                <div className="media-type-badge">
                  {item.media_type === 'video' && '▶️'}
                  {item.media_type === 'boltz' && '⚡'}
                  {item.media_type === 'flash' && '✨'}
                </div>
                <div className="media-stats">
                  <span className="stat">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {item.likes_count || 0}
                  </span>
                  {item.comments_count > 0 && (
                    <span className="stat">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      {item.comments_count}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="media-info">
              <div className="creator-info">
                <img 
                  src={item.avatar_url || '/default-avatar.png'} 
                  alt={item.username}
                  className="creator-avatar"
                />
                <div className="creator-details">
                  <span className="creator-username">
                    {item.username}
                    {item.is_verified && <span className="verified-badge">✓</span>}
                  </span>
                </div>
              </div>
              
              {item.caption && (
                <p className="media-caption">{item.caption}</p>
              )}
              
              <div className="tile-actions">
                <motion.button
                  className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike();
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>
        );
      
      case 'user':
        return (
          <div className="user-tile" onClick={onClick}>
            <div className="user-avatar-container">
              <img 
                src={item.avatar_url || '/default-avatar.png'} 
                alt={item.username}
                className="user-avatar"
              />
            </div>
            
            <div className="user-info">
              <h3 className="user-username">
                {item.username}
                {item.is_verified && <span className="verified-badge">✓</span>}
              </h3>
              
              {item.caption && (
                <p className="user-bio">{item.caption}</p>
              )}
              
              {item.followers_count > 0 && (
                <p className="user-stats">
                  {item.followers_count.toLocaleString()} followers
                </p>
              )}
              
              <motion.button
                className={`follow-btn ${isFollowing ? 'following' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onFollow();
                }}
                whileTap={{ scale: 0.95 }}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </motion.button>
            </div>
          </div>
        );
      
      case 'hashtag':
        return (
          <div className="hashtag-tile" onClick={onClick}>
            <div className="hashtag-icon">
              #️⃣
            </div>
            
            <div className="hashtag-info">
              <h3 className="hashtag-name">#{item.hashtag}</h3>
              
              <p className="hashtag-stats">
                {item.usage_count?.toLocaleString() || 0} posts
              </p>
              
              <div className="hashtag-trend">
                <span className="trend-indicator">📈</span>
                <span>Trending</span>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`explore-tile ${item.item_type}-tile-container`}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      {renderTileContent()}
    </motion.div>
  );
}