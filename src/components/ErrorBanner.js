// src/components/ErrorBanner.js
import React from 'react';
import './ErrorBanner.css';

const ErrorBanner = ({ message = 'Failed to load posts', onRetry }) => {
  return (
    <div className="error-banner">
      <div className="error-banner-icon">😔</div>
      <h2 className="error-banner-title">Oops!</h2>
      <p className="error-banner-message">{message}</p>
      {onRetry && (
        <button className="error-banner-button" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorBanner;
