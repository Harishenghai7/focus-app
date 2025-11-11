import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOffline } from '../utils/offlineManager';
import './OfflineIndicator.css';

export default function OfflineIndicator() {
  const { isOnline, pendingActions } = useOffline();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="offline-indicator"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="offline-content">
            <span className="offline-icon">📡</span>
            <div className="offline-text">
              <span className="offline-title">You're offline</span>
              {pendingActions > 0 && (
                <span className="offline-subtitle">
                  {pendingActions} action{pendingActions !== 1 ? 's' : ''} will sync when online
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}