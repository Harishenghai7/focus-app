import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './ExploreTabs.module.css';

/**
 * ExploreTabs - Tab navigation for explore page.
 * @component
 * @param {Array} tabs - Array of tab objects {id, label, icon}
 * @param {string} activeTab - Currently active tab id
 * @param {function} onTabChange - Handler for tab change
 * @returns {React.ReactElement}
 */
const ExploreTabs = React.memo(function ExploreTabs({ tabs, activeTab, onTabChange }) {
  return (
    <nav className={styles.exploreTabs} aria-label="Explore tabs">
      <div className={styles.tabsContainer} role="tablist">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                className={styles.tabIndicator}
                layoutId="activeTab"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                aria-hidden="true"
              />
            )}
          </motion.button>
        ))}
      </div>
    </nav>
  );
});

ExploreTabs.displayName = 'ExploreTabs';
ExploreTabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node
  })).isRequired,
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired
};

export default ExploreTabs;
