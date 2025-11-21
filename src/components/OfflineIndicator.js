import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './OfflineIndicator.module.css';
import { useOffline } from '../utils/offlineManager';

/**
 * OfflineIndicator - Shows offline status and pending actions.
 * @component
 * @returns {React.ReactElement}
 */
const OfflineIndicator = React.memo(function OfflineIndicator() {
  const { isOnline, pendingActions } = useOffline();

  return (
    <>
      {!isOnline && (
        <motion.div
          className={styles.offlineIndicator}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="status"
          aria-live="polite"
        >
          <div className={styles.offlineContent}>
            <span className={styles.offlineIcon} aria-hidden="true">📡</span>
            <div className={styles.offlineText}>
              <span className={styles.offlineTitle}>You're offline</span>
              {pendingActions > 0 && (
                <span className={styles.offlineSubtitle}>
                  {pendingActions} action{pendingActions !== 1 ? 's' : ''} will sync when online
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </>
  );
});

OfflineIndicator.displayName = 'OfflineIndicator';
OfflineIndicator.propTypes = {};

export default OfflineIndicator;