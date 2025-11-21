import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import VerificationBadge from '../VerificationBadge';
import { linkifyText } from '../../utils/textUtils';
import './ProfileHeader.css';

/**
 * ProfileHeader - Complete profile header with avatar, stats, bio, and action buttons
 */
const ProfileHeader = ({
  profile,
  isOwnProfile,
  followStatus,
  onFollowClick,
  onMessageClick,
  onCallClick,
  onEditClick,
  onShareClick,
  onOptionsClick,
  isOnline
}) => {
  if (!profile) return null;

  const getActionButtons = () => {
    if (isOwnProfile) {
      return (
        <div className="profile-action-buttons">
          <motion.button
            className="profile-action-btn edit-profile-btn"
            onClick={onEditClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Edit Profile"
          >
            <span className="btn-icon">✏️</span>
            <span className="btn-text">Edit Profile</span>
          </motion.button>
          <motion.button
            className="profile-action-btn share-profile-btn"
            onClick={onShareClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            aria-label="Share Profile"
          >
            <span className="btn-icon">🔗</span>
          </motion.button>
        </div>
      );
    }

    return (
      <div className="profile-action-buttons">
        <motion.button
          className={`profile-action-btn follow-btn ${followStatus === 'accepted' ? 'following' : followStatus === 'pending' ? 'pending' : 'follow'}`}
          onClick={onFollowClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label={followStatus === 'accepted' ? 'Following' : followStatus === 'pending' ? 'Requested' : 'Follow'}
        >
          <span className="btn-text">
            {followStatus === 'accepted' ? 'Following' : followStatus === 'pending' ? 'Requested' : 'Follow'}
          </span>
        </motion.button>
        <motion.button
          className="profile-action-btn message-btn"
          onClick={onMessageClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Message"
        >
          <span className="btn-icon">💬</span>
          <span className="btn-text">Message</span>
        </motion.button>
        <motion.button
          className="profile-action-btn call-btn"
          onClick={onCallClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Call"
        >
          <span className="btn-icon">📞</span>
        </motion.button>
      </div>
    );
  };

  return (
    <div className="profile-header">
      <div className="profile-header-background"></div>
      
      <div className="profile-header-content">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className={`profile-avatar-wrapper ${isOnline ? 'online' : ''}`}>
            <motion.img
              src={profile.avatar_url || '/default-avatar.png'}
              alt={`${profile.full_name || profile.username}'s avatar`}
              className="profile-avatar"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            {isOnline && <div className="online-indicator" aria-label="Online"></div>}
          </div>
        </div>

        {/* Info Section */}
        <div className="profile-info-section">
          <div className="profile-name-row">
            <h1 className="profile-username">{profile.username}</h1>
            {profile.is_verified && <VerificationBadge />}
            {!isOwnProfile && (
              <motion.button
                className="profile-options-btn"
                onClick={onOptionsClick}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Profile Options"
              >
                ⋯
              </motion.button>
            )}
          </div>

          {profile.full_name && (
            <h2 className="profile-display-name">{profile.full_name}</h2>
          )}

          {/* Action Buttons */}
          {getActionButtons()}

          {/* Bio */}
          {profile.bio && (
            <div className="profile-bio">
              {linkifyText(profile.bio)}
            </div>
          )}

          {/* External Links */}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-website"
              aria-label={`Visit ${profile.website}`}
            >
              🔗 {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}

          {/* Contact Info (if available) */}
          {profile.location && (
            <div className="profile-location">
              📍 {profile.location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ProfileHeader.propTypes = {
  profile: PropTypes.object.isRequired,
  isOwnProfile: PropTypes.bool.isRequired,
  followStatus: PropTypes.string,
  onFollowClick: PropTypes.func.isRequired,
  onMessageClick: PropTypes.func.isRequired,
  onCallClick: PropTypes.func.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onShareClick: PropTypes.func.isRequired,
  onOptionsClick: PropTypes.func.isRequired,
  isOnline: PropTypes.bool
};

export default ProfileHeader;
