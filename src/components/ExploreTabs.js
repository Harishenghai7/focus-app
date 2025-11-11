import React from 'react';
import { motion } from 'framer-motion';
import './ExploreTabs.css';

export default function ExploreTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="explore-tabs">
      <div className="tabs-container">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.02 }}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>

            {activeTab === tab.id && (
              <motion.div
                className="tab-indicator"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
