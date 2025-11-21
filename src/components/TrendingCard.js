import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './TrendingCard.css';

/**
 * TrendingCard Component
 * 
 * A versatile card component for displaying trending items
 * Supports: hashtags, posts, users, and boltz
 */
const TrendingCard = ({ 
  type = 'post', 
  item, 
  rank, 
  onClick,
  compact = false 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick(item);
    } else {
      // Default navigation behavior
      switch (type) {
        case 'hashtag':
          navigate(`/hashtag/${item.tag}`);
          break;
        case 'post':
          navigate(`/post/${item.id}`);
          break;
        case 'user':
          navigate(`/profile/${item.id}`);
          break;
        case 'boltz':
          navigate(`/boltz/${item.id}`);
          break;
        default:
          break;
      }
    }
  };

  // Render different card types
  switch (type) {
    case 'hashtag':
      return (
        <motion.div
          className={`trending-card trending-card-hashtag${compact ? ' compact' : ''}`}
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          role="button"
          tabIndex={0}
          aria-label={`Trending hashtag ${item.tag}`}
        >
          {rank && <div className="card-rank">#{rank}</div>}
          <div className="card-content">
            <div className="hashtag-icon">#</div>
            <div className="hashtag-details">
              <div className="hashtag-name">{item.tag}</div>
              <div className="hashtag-count">
                {item.postcount?.toLocaleString() || 0} posts
              </div>
            </div>
          </div>
          {item.trendingscore && (
            <div className="trending-score">
              🔥 {item.trendingscore.toFixed(1)}
            </div>
          )}
        </motion.div>
      );

    case 'user':
      return (
        <motion.div
          className={`trending-card trending-card-user${compact ? ' compact' : ''}`}
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          role="button"
          tabIndex={0}
          aria-label={`User profile ${item.username}`}
        >
          {rank && <div className="card-rank">#{rank}</div>}
          <div className="card-content">
            <div className="user-avatar-container">
              <img
                src={item.avatarurl || '/default-avatar.png'}
                alt={item.username}
                className="user-avatar"
              />
              {item.isverified && (
                <span className="verified-badge" aria-label="Verified">✓</span>
              )}
            </div>
            <div className="user-details">
              <div className="user-name">
                {item.fullname || item.username}
              </div>
              <div className="user-username">@{item.username}</div>
              {!compact && item.bio && (
                <div className="user-bio">{item.bio}</div>
              )}
              <div className="user-follower-count">
                {(item.followercount || 0).toLocaleString()} followers
              </div>
            </div>
          </div>
        </motion.div>
      );

    case 'boltz':
      return (
        <motion.div
          className={`trending-card trending-card-boltz${compact ? ' compact' : ''}`}
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          role="button"
          tabIndex={0}
          aria-label="Trending boltz"
        >
          {rank && <div className="card-rank">#{rank}</div>}
          {item.mediaurl && (
            <div className="boltz-media">
              <img src={item.mediaurl} alt="Boltz media" />
            </div>
          )}
          <div className="card-content">
            <div className="boltz-author">
              <img
                src={item.profiles?.avatarurl || '/default-avatar.png'}
                alt={item.profiles?.username}
                className="author-avatar"
              />
              <span className="author-name">@{item.profiles?.username}</span>
            </div>
            <div className="boltz-text">{item.content}</div>
            <div className="boltz-engagement">
              <span className="boltz-likes">
                ❤️ {(item.likecount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      );

    case 'post':
    default:
      return (
        <motion.div
          className={`trending-card trending-card-post${compact ? ' compact' : ''}`}
          onClick={handleClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          role="button"
          tabIndex={0}
          aria-label="Trending post"
        >
          {rank && <div className="card-rank">#{rank}</div>}
          {(item.mediaurl || item.mediaurls?.[0]) && (
            <div className="post-media">
              <img 
                src={item.mediaurl || item.mediaurls[0]} 
                alt={item.caption || 'Post media'}
              />
              {item.mediaurls?.length > 1 && (
                <div className="media-count">
                  📸 {item.mediaurls.length}
                </div>
              )}
            </div>
          )}
          <div className="card-content">
            <div className="post-author">
              <img
                src={item.profiles?.avatarurl || '/default-avatar.png'}
                alt={item.profiles?.username}
                className="author-avatar"
              />
              <span className="author-name">@{item.profiles?.username}</span>
            </div>
            {!compact && item.caption && (
              <div className="post-caption">{item.caption}</div>
            )}
            <div className="post-engagement">
              <span className="post-likes">
                ❤️ {(item.likecount || 0).toLocaleString()}
              </span>
              {item.commentcount > 0 && (
                <span className="post-comments">
                  💬 {item.commentcount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </motion.div>
      );
  }
};

export default TrendingCard;
