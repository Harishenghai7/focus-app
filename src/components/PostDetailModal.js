import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './PostDetailModal.css';

/**
 * PostDetailModal - Full post viewer modal with media, likes, comments
 */
const PostDetailModal = ({ post, onClose, user }) => {
  const navigate = useNavigate();

  const handleUserClick = () => {
    navigate(`/profile/${post.username || post.user_id}`);
    onClose();
  };

  return (
    <motion.div
      className="modal-overlay post-detail-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="post-detail-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="post-detail-content">
          {/* Media Section */}
          <div className="post-media-section">
            {post.type === 'video' || post.media_type === 'video' ? (
              <video
                src={post.media_url}
                controls
                autoPlay
                loop
                className="post-media-video"
              />
            ) : (
              <img
                src={post.media_url}
                alt={post.caption || 'Post media'}
                className="post-media-image"
              />
            )}
          </div>

          {/* Info Section */}
          <div className="post-info-section">
            {/* User Header */}
            <div className="post-user-header">
              <button className="post-user-info" onClick={handleUserClick}>
                <img
                  src={post.avatar_url || '/default-avatar.png'}
                  alt={post.username}
                  className="post-user-avatar"
                />
                <span className="post-username">{post.username || 'User'}</span>
              </button>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="post-caption-section">
                <button className="caption-username" onClick={handleUserClick}>
                  {post.username}
                </button>
                <p className="post-caption-text">{post.caption}</p>
              </div>
            )}

            {/* Stats & Actions */}
            <div className="post-stats-section">
              <div className="post-stats">
                {post.likes_count !== undefined && (
                  <span className="post-stat">❤️ {post.likes_count}</span>
                )}
                {post.comments_count !== undefined && (
                  <span className="post-stat">💬 {post.comments_count}</span>
                )}
                {post.views_count !== undefined && (
                  <span className="post-stat">👁️ {post.views_count}</span>
                )}
              </div>
              {post.created_at && (
                <span className="post-timestamp">
                  {new Date(post.created_at).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="post-actions">
              <button className="action-btn like-btn" aria-label="Like">
                ❤️ Like
              </button>
              <button className="action-btn comment-btn" aria-label="Comment">
                💬 Comment
              </button>
              <button className="action-btn share-btn" aria-label="Share">
                📤 Share
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

PostDetailModal.propTypes = {
  post: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object
};

export default PostDetailModal;
