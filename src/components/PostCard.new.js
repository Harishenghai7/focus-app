// src/components/PostCard.new.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { formatNumber } from '../utils/formatNumber';
import './PostCard.new.css';

const PostCard = ({
  post,
  onLike,
  onSave,
  onComment,
  onShare,
  currentUser
}) => {
  const navigate = useNavigate();
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const handleDoubleTap = () => {
    if (!post.isLiked) {
      setShowLikeAnimation(true);
      onLike(post.id, false);
      setTimeout(() => setShowLikeAnimation(false), 1000);
    }
  };

  const navigateMedia = (direction) => {
    if (direction === 'next') {
      setCurrentMediaIndex(Math.min(currentMediaIndex + 1, post.media_urls.length - 1));
    } else {
      setCurrentMediaIndex(Math.max(currentMediaIndex - 1, 0));
    }
  };

  return (
    <div className="post-card-new">
      {/* Post Header */}
      <div className="post-header">
        <div 
          className="post-user-info" 
          onClick={() => navigate(`/profile/${post.users.username}`)}
        >
          <img
            src={post.users.avatar_url || '/default-avatar.png'}
            alt={post.users.username}
            className="post-user-avatar"
          />
          <div className="post-user-details">
            <div className="post-username-row">
              <span className="post-username">{post.users.username}</span>
              {post.users.verified && (
                <svg className="verified-badge" width="16" height="16" viewBox="0 0 16 16">
                  <path fill="#38C2E5" d="M8 0L10 6L16 8L10 10L8 16L6 10L0 8L6 6L8 0Z"/>
                </svg>
              )}
            </div>
            {post.location && <span className="post-location">{post.location}</span>}
          </div>
        </div>
        <button className="post-options-btn">
          <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Post Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className="post-media-container">
          <div className="post-media-wrapper" onDoubleClick={handleDoubleTap}>
            {post.media_type === 'video' ? (
              <video
                src={post.media_urls[currentMediaIndex]}
                className="post-media"
                controls
                playsInline
              />
            ) : (
              <img
                src={post.media_urls[currentMediaIndex]}
                alt="Post"
                className="post-media"
                loading="lazy"
              />
            )}

            {/* Like Animation */}
            {showLikeAnimation && (
              <div className="like-animation">
                <Heart size={80} fill="#FF5378" stroke="none" />
              </div>
            )}
          </div>

          {/* Media Navigation */}
          {post.media_urls.length > 1 && (
            <>
              {currentMediaIndex > 0 && (
                <button
                  className="media-nav-btn media-nav-prev"
                  onClick={() => navigateMedia('prev')}
                  aria-label="Previous media"
                >
                  ‹
                </button>
              )}
              {currentMediaIndex < post.media_urls.length - 1 && (
                <button
                  className="media-nav-btn media-nav-next"
                  onClick={() => navigateMedia('next')}
                  aria-label="Next media"
                >
                  ›
                </button>
              )}
              
              {/* Media Indicators */}
              <div className="media-indicators">
                {post.media_urls.map((_, idx) => (
                  <span
                    key={idx}
                    className={`media-indicator ${idx === currentMediaIndex ? 'active' : ''}`}
                  ></span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Post Actions Bar */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button
            className={`post-action-btn ${post.isLiked ? 'liked' : ''}`}
            onClick={() => onLike(post.id, post.isLiked)}
            aria-label={post.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart 
              size={26} 
              fill={post.isLiked ? '#FF5378' : 'none'} 
              stroke={post.isLiked ? '#FF5378' : 'currentColor'}
            />
          </button>
          <button
            className="post-action-btn"
            onClick={() => onComment(post)}
            aria-label="Comment"
          >
            <MessageCircle size={26} />
          </button>
          <button
            className="post-action-btn"
            onClick={() => onShare && onShare(post)}
            aria-label="Share"
          >
            <Send size={26} />
          </button>
        </div>
        <button
          className={`post-action-btn ${post.isSaved ? 'saved' : ''}`}
          onClick={() => onSave(post.id, post.isSaved)}
          aria-label={post.isSaved ? 'Unsave' : 'Save'}
        >
          <Bookmark 
            size={26} 
            fill={post.isSaved ? '#38C2E5' : 'none'} 
            stroke={post.isSaved ? '#38C2E5' : 'currentColor'}
          />
        </button>
      </div>

      {/* Post Stats */}
      <div className="post-stats">
        <span className="post-likes">
          {formatNumber(post.likesCount)} {post.likesCount === 1 ? 'like' : 'likes'}
        </span>
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="post-caption">
          <span className="post-caption-username">{post.users.username}</span>
          <span className="post-caption-text">{post.caption}</span>
        </div>
      )}

      {/* Comments Count */}
      {post.commentsCount > 0 && (
        <button 
          className="post-view-comments" 
          onClick={() => onComment(post)}
        >
          View all {formatNumber(post.commentsCount)} comments
        </button>
      )}

      {/* Timestamp */}
      <div className="post-timestamp">{formatTimeAgo(post.created_at)}</div>
    </div>
  );
};

export default PostCard;
