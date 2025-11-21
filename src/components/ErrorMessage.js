/**
 * ============================================================================
 * ⚠️ ERROR MESSAGE COMPONENT - PRODUCTION GRADE
 * ============================================================================
 * 
 * Reusable error display component with:
 * - Custom error messages
 * - Retry functionality
 * - Different error types
 * - Accessible
 * - Animated
 */

import React from 'react';
import { motion } from 'framer-motion';
import './ErrorMessage.css';

const ErrorMessage = ({
  type = 'general',
  title,
  message,
  icon,
  onRetry,
  retryLabel = 'Try Again',
  showRetry = true,
}) => {
  const errorConfig = {
    network: {
      icon: '🌐',
      title: 'Network Error',
      message: 'Unable to connect. Please check your internet connection.',
    },
    notFound: {
      icon: '🔍',
      title: 'Not Found',
      message: 'The content you\'re looking for doesn\'t exist.',
    },
    unauthorized: {
      icon: '🔒',
      title: 'Unauthorized',
      message: 'You don\'t have permission to view this content.',
    },
    server: {
      icon: '⚙️',
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
    },
    general: {
      icon: '⚠️',
      title: 'Something Went Wrong',
      message: 'An unexpected error occurred.',
    },
  };

  const config = errorConfig[type] || errorConfig.general;
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;

  return (
    <motion.div
      className="error-message"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-icon-wrapper">
        <motion.div
          className="error-icon"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 0.5,
            repeat: 2,
          }}
        >
          {displayIcon}
        </motion.div>
      </div>

      <h3 className="error-title">{displayTitle}</h3>
      <p className="error-description">{displayMessage}</p>

      {showRetry && onRetry && (
        <button
          className="error-retry-button"
          onClick={onRetry}
          aria-label={retryLabel}
        >
          {retryLabel}
        </button>
      )}
    </motion.div>
  );
};

export default ErrorMessage;
