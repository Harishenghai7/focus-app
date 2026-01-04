import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useFollowingList } from '../../hooks/useFollow';
import FollowButton from '../FollowButton';
import '../Profile/FollowersModal.css';

const FollowingModal = ({ userId, onClose, currentUserId }) => {
  const { following, loading, error } = useFollowingList(userId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFollowing = following.filter(user =>
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h2>Following</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-search">
          <input
            type="text"
            placeholder="Search following..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="modal-body">
          {loading && <div className="loading-text">Loading following...</div>}
          {error && <div className="error-message">{error}</div>}
          {!loading && filteredFollowing.length === 0 && (
            <div className="empty-state">No following found</div>
          )}
          {filteredFollowing.map(user => (
            <div key={user.id} className="user-item">
              <img src={user.avatar_url || '/default-avatar.png'} alt={user.username} className="user-avatar" />
              <div className="user-info">
                <div className="user-username">{user.username}</div>
                {user.full_name && <div className="user-fullname">{user.full_name}</div>}
              </div>
              {user.id !== currentUserId && (
                <FollowButton myUserId={currentUserId} profileUserId={user.id} />
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

FollowingModal.propTypes = {
  userId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  currentUserId: PropTypes.string
};

export default FollowingModal;
