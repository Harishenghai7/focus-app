import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './SuggestedUsers.css';

/**
 * SuggestedUsers - Horizontal suggested users bar with lavender glass styling
 * @param {Array} users - Array of suggested user objects
 * @param {Object} currentUser - Current logged in user
 */
const SuggestedUsers = ({ users = [], currentUser }) => {
  const [followedUsers, setFollowedUsers] = useState(new Set());
  const [following, setFollowing] = useState(false);
  const navigate = useNavigate();

  const handleFollow = async (userId, e) => {
    e.stopPropagation();
    if (!currentUser || following) return;

    const isFollowing = followedUsers.has(userId);
    const newFollowedUsers = new Set(followedUsers);

    if (isFollowing) {
      newFollowedUsers.delete(userId);
    } else {
      newFollowedUsers.add(userId);
    }

    setFollowedUsers(newFollowedUsers);
    setFollowing(true);

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('followerid', currentUser.id)
          .eq('followingid', userId);
      } else {
        await supabase
          .from('follows')
          .insert({
            followerid: currentUser.id,
            followingid: userId
          });
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setFollowedUsers(followedUsers); // Revert on error
    } finally {
      setFollowing(false);
    }
  };

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
  };

  if (!users || users.length === 0) {
    return null;
  }

  return (
    <div className="suggested-users-section">
      <div className="suggested-users-header">
        <svg
          className="suggested-users-icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <h3 className="suggested-users-title">Suggested Users</h3>
      </div>

      <div className="suggested-users-scroll-container">
        <div className="suggested-users-list">
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              className="suggested-user-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => handleUserClick(user.username)}
              role="button"
              tabIndex={0}
              aria-label={`View ${user.username}'s profile`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleUserClick(user.username);
                }
              }}
            >
              <div className="suggested-user-avatar-container">
                <img
                  src={user.avatarurl || '/default-avatar.png'}
                  alt={user.username}
                  className="suggested-user-avatar"
                  loading="lazy"
                />
                {user.isverified && (
                  <div className="suggested-user-verified-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="suggested-user-info">
                <div className="suggested-user-name-row">
                  <span className="suggested-user-username">@{user.username}</span>
                </div>
                {user.fullname && (
                  <span className="suggested-user-fullname">{user.fullname}</span>
                )}
                <div className="suggested-user-stats">
                  <span className="suggested-user-followers">
                    {formatNumber(user.followercount || 0)} followers
                  </span>
                </div>
              </div>

              <button
                className={`suggested-user-follow-btn ${
                  followedUsers.has(user.id) ? 'following' : ''
                }`}
                onClick={(e) => handleFollow(user.id, e)}
                disabled={following}
                aria-label={followedUsers.has(user.id) ? 'Unfollow' : 'Follow'}
              >
                {followedUsers.has(user.id) ? 'Following' : 'Follow'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to format numbers
const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

SuggestedUsers.propTypes = {
  users: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
      avatarurl: PropTypes.string,
      fullname: PropTypes.string,
      isverified: PropTypes.bool,
      followercount: PropTypes.number,
      bio: PropTypes.string
    })
  ),
  currentUser: PropTypes.shape({
    id: PropTypes.string.isRequired
  })
};

export default SuggestedUsers;
