import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { formatNumber } from '../../utils/formatNumber';
import './ProfileStats.css';

/**
 * ProfileStats - Interactive stats display for profile (Posts, Followers, Following, Boltz, Flash)
 */
const ProfileStats = ({
  stats,
  onFollowersClick,
  onFollowingClick,
  onPostsClick,
  onBoltzClick,
  onFlashClick
}) => {
  const statsConfig = [
    { 
      key: 'posts', 
      label: 'Posts', 
      value: stats.posts || 0, 
      onClick: onPostsClick,
      icon: '📄'
    },
    { 
      key: 'followers', 
      label: 'Followers', 
      value: stats.followers || 0, 
      onClick: onFollowersClick,
      icon: '👥'
    },
    { 
      key: 'following', 
      label: 'Following', 
      value: stats.following || 0, 
      onClick: onFollowingClick,
      icon: '➕'
    },
    { 
      key: 'boltz', 
      label: 'Boltz', 
      value: stats.boltz || 0, 
      onClick: onBoltzClick,
      icon: '⚡'
    },
    { 
      key: 'flash', 
      label: 'Flash', 
      value: stats.flash || 0, 
      onClick: onFlashClick,
      icon: '💫'
    }
  ];

  return (
    <div className="profile-stats">
      {statsConfig.map((stat, index) => (
        <motion.button
          key={stat.key}
          className={`profile-stat-item ${stat.key}`}
          onClick={stat.onClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          aria-label={`${stat.value} ${stat.label}`}
        >
          <span className="stat-icon" aria-hidden="true">{stat.icon}</span>
          <span className="stat-count">{formatNumber(stat.value)}</span>
          <span className="stat-label">{stat.label}</span>
          <div className="stat-glow"></div>
        </motion.button>
      ))}
    </div>
  );
};

ProfileStats.propTypes = {
  stats: PropTypes.shape({
    posts: PropTypes.number,
    followers: PropTypes.number,
    following: PropTypes.number,
    boltz: PropTypes.number,
    flash: PropTypes.number
  }).isRequired,
  onFollowersClick: PropTypes.func.isRequired,
  onFollowingClick: PropTypes.func.isRequired,
  onPostsClick: PropTypes.func,
  onBoltzClick: PropTypes.func,
  onFlashClick: PropTypes.func
};

export default ProfileStats;
