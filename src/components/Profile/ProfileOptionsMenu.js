import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './ProfileOptionsMenu.css';

const ProfileOptionsMenu = ({ profile, isOwnProfile, onClose, currentUserId }) => {
  const navigate = useNavigate();

  const handleBlock = () => {
    // TODO: Implement block functionality
    console.log('Block user:', profile.id);
    onClose();
  };

  const handleReport = () => {
    // TODO: Implement report functionality
    console.log('Report user:', profile.id);
    onClose();
  };

  const handleSettings = () => {
    navigate('/settings');
    onClose();
  };

  const options = isOwnProfile ? [
    { icon: '⚙️', label: 'Settings', onClick: handleSettings },
    { icon: '📊', label: 'View Analytics', onClick: () => navigate('/analytics') },
    { icon: '🔐', label: 'Privacy', onClick: () => navigate('/settings/privacy') },
    { icon: '📥', label: 'Export Data', onClick: () => navigate('/settings/data') }
  ] : [
    { icon: '🚫', label: 'Block', onClick: handleBlock, danger: true },
    { icon: '⚠️', label: 'Report', onClick: handleReport, danger: true },
    { icon: '🔕', label: 'Restrict', onClick: () => console.log('Restrict') }
  ];

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="profile-options-menu"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {options.map((option, index) => (
          <motion.button
            key={index}
            className={`option-btn ${option.danger ? 'danger' : ''}`}
            onClick={option.onClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="option-icon">{option.icon}</span>
            <span className="option-label">{option.label}</span>
          </motion.button>
        ))}
        <button className="option-btn cancel-btn" onClick={onClose}>
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
};

ProfileOptionsMenu.propTypes = {
  profile: PropTypes.object.isRequired,
  isOwnProfile: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentUserId: PropTypes.string
};

export default ProfileOptionsMenu;
