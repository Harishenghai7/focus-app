import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SessionExpiredModal.module.css';

/**
 * SessionExpiredModal - Modal for session expiration and re-authentication.
 * @component
 * @param {boolean} show - Whether modal is shown
 * @param {function} onReauth - Handler for re-authentication
 * @param {function} onLogout - Handler for logout
 * @returns {React.ReactElement}
 */
const SessionExpiredModal = React.memo(function SessionExpiredModal({ show, onReauth, onLogout }) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={styles['session-expired-overlay']}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden={!show}
      >
        <motion.div
          className={styles['session-expired-modal']}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles['session-expired-icon']} aria-hidden="true">⏰</div>
          <h2>Session Expired</h2>
          <p>Your session has expired for security reasons. Please sign in again to continue.</p>
          
          <div className={styles['session-expired-actions']}>
            <button 
              className={styles['btn-primary']}
              onClick={onReauth}
              aria-label="Sign In Again"
            >
              Sign In Again
            </button>
            <button 
              className={styles['btn-secondary']}
              onClick={onLogout}
              aria-label="Logout"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

SessionExpiredModal.displayName = 'SessionExpiredModal';
SessionExpiredModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onReauth: PropTypes.func.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default SessionExpiredModal;
