import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './ProfileTabs.css';

/**
 * ProfileTabs - Animated tab selector for profile content (Posts, Boltz, Flash, Tagged, Saved)
 */
const ProfileTabs = ({ activeTab, onTabChange, tabs }) => {
  const defaultTabs = [
    { id: 'posts', label: 'Posts', icon: '📄' },
    { id: 'boltz', label: 'Boltz', icon: '⚡' },
    { id: 'flash', label: 'Flash', icon: '💫' },
    { id: 'tagged', label: 'Tagged', icon: '🏷️' },
    { id: 'saved', label: 'Saved', icon: '🔖' }
  ];

  const displayTabs = tabs || defaultTabs;

  return (
    <div className="profile-tabs-container">
      <div className="profile-tabs" role="tablist">
        {displayTabs.map((tab, index) => (
          <motion.button
            key={tab.id}
            className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="tab-icon" aria-hidden="true">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className="tab-indicator"
                layoutId="tab-indicator"
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30
                }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

ProfileTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.string
    })
  )
};

export default ProfileTabs;
