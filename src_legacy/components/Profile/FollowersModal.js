import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useFollowersList } from '../../hooks/useFollow';
import FollowButton from '../FollowButton';
import './FollowersModal.css';

const FollowersModal = ({ userId, onClose, currentUserId }) => {
  const { followers, loading, error } = useFollowersList(userId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFollowers = followers.filter(follower =>
    follower.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    follower.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="followers-modal"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Followers</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="Search followers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="modal-body">
          {loading && <div className="loading-text">Loading followers...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && filteredFollowers.length === 0 && (
            <div className="empty-state">No followers found</div>
          )}
          {filteredFollowers.map(follower => (
            <div key={follower.id} className="user-item">
              <img src={follower.avatar_url || '/default-avatar.png'} alt={follower.username} className="user-avatar" />
              <div className="user-info">
                <div className="user-username">{follower.username}</div>
                {follower.full_name && <div className="user-fullname">{follower.full_name}</div>}
              </div>
              {follower.id !== currentUserId && (
                <FollowButton myUserId={currentUserId} profileUserId={follower.id} />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

FollowersModal.propTypes = {
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  currentUserId: PropTypes.string
};

export default FollowersModal;
