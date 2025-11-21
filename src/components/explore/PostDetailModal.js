import React, { useEffect, useRef } from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { linkifyText } from '../../utils/linkifyText';
import './PostDetailModal.css';

const PostDetailModal = ({ post, onClose, currentUserId }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    // Lock body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Focus modal for accessibility
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const isVideo = post.media_type === 'video' || 
    (post.media_url && post.media_url.match(/\.(mp4|webm|mov)$/i));

  const isLiked = post.liked_by_user || 
    (post.post_likes && Array.isArray(post.post_likes) && 
     post.post_likes.some(like => like.user_id === currentUserId));

  const mediaSrc = post.media_url || post.image_url;

  const captionParts = post.caption 
    ? linkifyText(
        post.caption,
        (username) => console.log('Navigate to:', username),
        (hashtag) => console.log('Search hashtag:', hashtag)
      )
    : [];

  return (
    <div
      className="post-detail-modal-backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
    >
      <div className="post-detail-modal" ref={modalRef} tabIndex={0}>
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close modal"
          type="button"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 18L18 6M6 6l12 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="modal-content">
          <div className="modal-media-section">
            {isVideo ? (
              <video
                className="modal-media"
                src={mediaSrc}
                controls
                autoPlay
                loop
                playsInline
                aria-label="Post video"
              />
            ) : (
              <img
                className="modal-media"
                src={mediaSrc || '/placeholder-image.png'}
                alt={post.caption || 'Post image'}
              />
            )}
          </div>

          <div className="modal-details-section">
            <div className="modal-header">
              <div className="modal-user-info">
                <img
                  src={post.profile?.avatar_url || '/default-avatar.png'}
                  alt=""
                  className="modal-user-avatar"
                />
                <div className="modal-user-text">
                  <div className="modal-user-name">
                    {post.profile?.display_name || post.profile?.username || 'Unknown'}
                    {post.profile?.verified && (
                      <svg className="verified-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="modal-user-username">@{post.profile?.username || 'unknown'}</div>
                </div>
              </div>
              
              <button className="modal-options-btn" aria-label="Post options">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="5" r="2" fill="currentColor" />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                  <circle cx="12" cy="19" r="2" fill="currentColor" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {post.caption && (
                <div className="modal-caption">
                  <p>
                    {captionParts.map((part, index) => {
                      if (part.type === 'mention') {
                        return (
                          <button
                            key={index}
                            className="mention-link"
                            onClick={part.onClick}
                          >
                            {part.content}
                          </button>
                        );
                      } else if (part.type === 'hashtag') {
                        return (
                          <button
                            key={index}
                            className="hashtag-link"
                            onClick={part.onClick}
                          >
                            {part.content}
                          </button>
                        );
                      } else if (part.type === 'url') {
                        return (
                          <a
                            key={index}
                            href={part.url}
                            className="url-link"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {part.content}
                          </a>
                        );
                      }
                      return <span key={index}>{part.content}</span>;
                    })}
                  </p>
                </div>
              )}

              <div className="modal-timestamp">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div className="modal-actions">
              <div className="modal-stats-row">
                <button className={`modal-action-btn ${isLiked ? 'liked' : ''}`} aria-label="Like post">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"}>
                    <path
                      d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill={isLiked ? "currentColor" : "none"}
                    />
                  </svg>
                  <span>{formatNumber(post.likes_count || 0)}</span>
                </button>

                <button className="modal-action-btn" aria-label="Comment on post">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>{formatNumber(post.comments_count || 0)}</span>
                </button>

                <button className="modal-action-btn" aria-label="Share post">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                <button className="modal-action-btn" aria-label="Bookmark post">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="modal-comments-section">
              <div className="comments-header">
                <h3>Comments</h3>
              </div>
              <div className="comments-list">
                <div className="no-comments">No comments yet. Be the first to comment!</div>
              </div>
              <div className="comment-input-wrapper">
                <input
                  type="text"
                  className="comment-input"
                  placeholder="Add a comment..."
                  aria-label="Add a comment"
                />
                <button className="comment-submit-btn" aria-label="Post comment">
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
