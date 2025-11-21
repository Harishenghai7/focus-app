import React, { useState } from 'react';
import { formatNumber } from '../../utils/formatNumber';
import './ExploreTile.css';

const ExploreTile = ({ post, onClick, currentUserId, index }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isVideo = post.media_type === 'video' || 
    (post.media_url && post.media_url.match(/\.(mp4|webm|mov)$/i));
  
  const isBoltz = post.post_type === 'boltz';
  const isFlash = post.post_type === 'flash';
  
  const isLiked = post.liked_by_user || 
    (post.post_likes && Array.isArray(post.post_likes) && 
     post.post_likes.some(like => like.user_id === currentUserId));

  const mediaSrc = post.media_url || post.image_url || '/placeholder-image.png';
  const thumbnailSrc = post.thumbnail_url || mediaSrc;

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleClick = () => {
    onClick(post);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(post);
    }
  };

  return (
    <div
      className="explore-tile"
      role="article"
      tabIndex={0}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      aria-label={`Post by ${post.profile?.display_name || post.profile?.username}. ${post.likes_count || 0} likes, ${post.comments_count || 0} comments`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="tile-media-wrapper">
        {!imageLoaded && !imageError && (
          <div className="tile-skeleton" aria-hidden="true">
            <div className="skeleton-shimmer" />
          </div>
        )}
        
        {isVideo ? (
          <video
            className={`tile-media ${imageLoaded ? 'loaded' : ''}`}
            src={mediaSrc}
            poster={thumbnailSrc}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedData={handleImageLoad}
            onError={handleImageError}
            aria-label="Video post"
          />
        ) : (
          <img
            className={`tile-media ${imageLoaded ? 'loaded' : ''}`}
            src={imageError ? '/placeholder-image.png' : thumbnailSrc}
            alt={post.caption ? `${post.caption.slice(0, 100)}` : 'Post image'}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        )}

        <div className="tile-overlay">
          <div className="tile-stats">
            <div className="tile-stat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} aria-hidden="true">
                <path
                  d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill={isLiked ? "currentColor" : "none"}
                />
              </svg>
              <span>{formatNumber(post.likes_count || 0)}</span>
            </div>
            
            <div className="tile-stat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{formatNumber(post.comments_count || 0)}</span>
            </div>
            
            {isVideo && post.views_count !== undefined && (
              <div className="tile-stat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                <span>{formatNumber(post.views_count)}</span>
              </div>
            )}
          </div>

          <div className="tile-user">
            <img
              src={post.profile?.avatar_url || '/default-avatar.png'}
              alt=""
              className="tile-user-avatar"
              loading="lazy"
            />
            <span className="tile-user-name">
              {post.profile?.display_name || post.profile?.username || 'Unknown'}
            </span>
          </div>
        </div>

        {isVideo && (
          <div className="tile-video-badge" aria-label="Video content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M23 7l-7 5 7 5V7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="currentColor"
              />
              <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        )}

        {isBoltz && (
          <div className="tile-boltz-badge" aria-label="Boltz content">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" />
            </svg>
          </div>
        )}

        {isFlash && (
          <div className="tile-flash-badge" aria-label="Flash story">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="currentColor" />
            </svg>
          </div>
        )}

        {isLiked && (
          <div className="tile-liked-badge" aria-label="You liked this">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreTile;
