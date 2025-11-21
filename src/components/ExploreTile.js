import React from 'react';
import { motion } from 'framer-motion';
import VerifiedBadge from './VerifiedBadge'; // Assuming you have a verified badge component
import './ExploreTile.css';

export default function ExploreTile({
  item,
  activeTab,
  isLiked,
  isFollowing,
  onLike,
  onFollow,
  onClick,
}) {
  const renderContent = () => {
    switch (item.itemtype) {
      case 'post':
      case 'boltz':
        const thumbnailUrl =
          item.mediatype === 'carousel' ? item.mediaurls?.[0] : item.mediaurl;
        return (
          <img
            src={thumbnailUrl}
            alt={item.caption || 'Post image'}
            className="explore-tile-image"
            loading="lazy"
            decoding="async"
          />
        );
      case 'user':
        return (
          <div className="explore-tile-user">
            <img
              src={item.avatarurl || '/default-avatar.png'}
              alt={item.username}
              className="explore-tile-avatar"
              loading="lazy"
              decoding="async"
            />
            <div className="username-info">
              <span className="username">{item.username}</span>
              {item.verified && <VerifiedBadge />}
            </div>
            <button
              className={`follow-btn ${isFollowing ? 'following' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onFollow();
              }}
              aria-label={isFollowing ? 'Unfollow user' : 'Follow user'}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        );
      case 'hashtag':
        return (
          <div className="explore-tile-hashtag">
            <span className="hashtag-symbol">#</span>
            <span className="hashtag-text">{item.hashtag || item.tag}</span>
            <span className="post-count">{item.postcount?.toLocaleString()} posts</span>
          </div>
        );
      default:
        return <div className="explore-tile-default">Unknown item type</div>;
    }
  };

  return (
    <motion.div
      className={`explore-tile ${activeTab}-tile`}
      onClick={onClick}
      whileHover={{ scale: 1.03, boxShadow: 'var(--shadow-lg)' }}
      whileTap={{ scale: 0.98 }}
      tabIndex={0}
      role="button"
      aria-label={`Open ${item.itemtype}`}
    >
      {renderContent()}
      {(item.itemtype === 'post' || item.itemtype === 'boltz') && (
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          aria-label={isLiked ? 'Unlike post' : 'Like post'}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={isLiked ? '#e0245e' : 'none'}
            stroke={isLiked ? '#e0245e' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.72-7.72 1.06-1.06a5.5 5.5 0 0 0 0-7.84z"></path>
          </svg>
          <span className="like-count">{item.likecount?.toLocaleString() || 0}</span>
        </button>
      )}
    </motion.div>
  );
}
