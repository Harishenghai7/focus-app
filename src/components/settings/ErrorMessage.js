import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message" role="alert">
      <div className="error-icon">⚠️</div>
      <h3 className="error-title">Oops! Something went wrong</h3>
      <p className="error-text">{message || 'Failed to load settings. Please try again.'}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
