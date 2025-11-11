import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './SessionExpiredModal.css';

export default function SessionExpiredModal({ show, onReauth, onLogout }) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="session-expired-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="session-expired-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="session-expired-icon">⏰</div>
          <h2>Session Expired</h2>
          <p>Your session has expired for security reasons. Please sign in again to continue.</p>
          
          <div className="session-expired-actions">
            <button 
              className="btn-primary"
              onClick={onReauth}
            >
              Sign In Again
            </button>
            <button 
              className="btn-secondary"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
