import React from 'react';
import { motion } from 'framer-motion';
import './StateHandler.css';

// Universal component for loading, error, and empty states
export default function StateHandler({ 
  loading, 
  error, 
  empty, 
  emptyMessage = 'No items found',
  emptyIcon = '📭',
  emptyAction,
  emptyActionText = 'Try again',
  errorMessage,
  errorAction,
  errorActionText = 'Retry',
  loadingMessage = 'Loading...',
  children 
}) {
  // Loading state
  if (loading) {
    return (
      <motion.div 
        className="state-handler loading"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label={loadingMessage}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="loading-spinner" aria-hidden="true"></div>
        <p>{loadingMessage}</p>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div 
        className="state-handler error"
        role="alert"
        aria-live="assertive"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="error-icon" aria-hidden="true">⚠️</div>
        <h3>Oops! Something went wrong</h3>
        <p>{errorMessage || error}</p>
        {errorAction && (
          <button 
            className="state-action-btn" 
            onClick={errorAction}
            aria-label={`${errorActionText} after error`}
          >
            {errorActionText}
          </button>
        )}
      </motion.div>
    );
  }

  // Empty state
  if (empty) {
    return (
      <motion.div 
        className="state-handler empty"
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="empty-icon" aria-hidden="true">{emptyIcon}</div>
        <h3>{emptyMessage}</h3>
        {emptyAction && (
          <button 
            className="state-action-btn" 
            onClick={emptyAction}
            aria-label={emptyActionText}
          >
            {emptyActionText}
          </button>
        )}
      </motion.div>
    );
  }

  // Content
  return <>{children}</>;
}

// Specific state components for common use cases
export function LoadingState({ message = 'Loading...' }) {
  return (
    <div 
      className="state-handler loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="loading-spinner" aria-hidden="true"></div>
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div 
      className="state-handler error"
      role="alert"
      aria-live="assertive"
    >
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h3>Something went wrong</h3>
      <p>{message || 'Please try again'}</p>
      {onRetry && (
        <button 
          className="state-action-btn" 
          onClick={onRetry}
          aria-label="Retry after error"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, icon = '📭', action, actionText }) {
  return (
    <div 
      className="state-handler empty"
      role="status"
      aria-live="polite"
    >
      <div className="empty-icon" aria-hidden="true">{icon}</div>
      <h3>{message}</h3>
      {action && (
        <button 
          className="state-action-btn" 
          onClick={action}
          aria-label={actionText}
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
