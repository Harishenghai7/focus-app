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
    // Always animate the heart on double tap, even if already liked
    setShowLikeAnimation(true);
    
    // Only trigger the API call if not already liked
    if (!post.isLiked) {
      onLike(post.id, false); // false indicating we are NOT unliking
    }
    
    setTimeout(() => setShowLikeAnimation(false), 1000);
  };

  const navigateMedia = (e, direction) => {
    e.stopPropagation(); // Prevent triggering post click
    if (direction === 'next') {
      setCurrentMediaIndex(Math.min(currentMediaIndex + 1, post.media_urls.length - 1));
    } else {
      setCurrentMediaIndex(Math.max(currentMediaIndex - 1, 0));
    }
  };

  // Determine if we have valid media
  const hasMedia = post.media_urls && post.media_urls.length > 0;

  return (
    <article className="post-card-new glass-panel">
      {/* 1. Post Header */}
      <header className="post-header">
        <div 
          className="post-user-info" 
          onClick={() => navigate(`/profile/${post.users.username}`)}
        >
          <img
            src={post.users.avatar_url || '/default-avatar.png'}
            alt={post.users.username}
            className="post-user-avatar"
            loading="lazy"
          />
          <div className="post-user-details">
            <div className="post-username-row">
              <span className="post-username">{post.users.username}</span>
              {post.users.verified && (
                <svg className="verified-badge" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            {post.location && <span className="post-location">{post.location}</span>}
          </div>
        </div>
        <button className="post-options-btn" aria-label="More options">
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* 2. Post Media */}
      {hasMedia && (
        <div className="post-media-container" onDoubleClick={handleDoubleTap}>
          <div className="post-media-wrapper">
            {post.media_type === 'video' ? (
              <video
                src={post.media_urls[currentMediaIndex]}
                className="post-media"
                controls
                playsInline
                loop
                muted
              />
            ) : (
              <img
                src={post.media_urls[currentMediaIndex]}
                alt={`Post by ${post.users.username}`}
                className="post-media"
                loading="lazy"
              />
            )}

            {/* Double Tap Heart Animation */}
            <div className={`like-animation ${showLikeAnimation ? 'active' : ''}`}>
              {showLikeAnimation && <Heart size={80} fill="#FF5378" stroke="none" />}
            </div>
          </div>

          {/* Media Navigation Arrows */}
          {post.media_urls.length > 1 && (
            <>
              {currentMediaIndex > 0 && (
                <button
                  className="media-nav-btn media-nav-prev"
                  onClick={(e) => navigateMedia(e, 'prev')}
                  aria-label="Previous media"
                >
                  ‹
                </button>
              )}
              {currentMediaIndex < post.media_urls.length - 1 && (
                <button
                  className="media-nav-btn media-nav-next"
                  onClick={(e) => navigateMedia(e, 'next')}
                  aria-label="Next media"
                >
                  ›
                </button>
              )}
              
              {/* Media Dots Indicators */}
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

      {/* 3. Action Bar */}
      <div className="post-actions">
        <div className="post-actions-left">
          <button
            className={`post-action-btn ${post.isLiked ? 'liked' : ''}`}
            onClick={() => onLike(post.id, post.isLiked)}
            aria-label={post.isLiked ? 'Unlike' : 'Like'}
          >
            <Heart 
              size={24} 
              fill={post.isLiked ? 'currentColor' : 'none'} 
            />
          </button>
          <button
            className="post-action-btn"
            onClick={() => onComment(post)}
            aria-label="Comment"
          >
            <MessageCircle size={24} />
          </button>
          <button
            className="post-action-btn"
            onClick={() => onShare && onShare(post)}
            aria-label="Share"
          >
            <Send size={24} />
          </button>
        </div>
        <button
          className={`post-action-btn ${post.isSaved ? 'saved' : ''}`}
          onClick={() => onSave(post.id, post.isSaved)}
          aria-label={post.isSaved ? 'Unsave' : 'Save'}
        >
          <Bookmark 
            size={24} 
            fill={post.isSaved ? 'currentColor' : 'none'} 
          />
        </button>
      </div>

      {/* 4. Stats & Caption */}
      <div className="post-content-footer px-1">
        <div className="post-stats">
          <span className="post-likes">
            {formatNumber(post.likesCount)} {post.likesCount === 1 ? 'like' : 'likes'}
          </span>
        </div>

        {post.caption && (
          <div className="post-caption">
            <span className="post-caption-username">{post.users.username}</span>
            <span className="post-caption-text">{post.caption}</span>
          </div>
        )}

        {post.commentsCount > 0 && (
          <button 
            className="post-view-comments" 
            onClick={() => onComment(post)}
          >
            View all {formatNumber(post.commentsCount)} comments
          </button>
        )}

        <div className="post-timestamp">{formatTimeAgo(post.created_at)}</div>
      </div>
    </article>
  );
};

export default PostCard;