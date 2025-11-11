/**
 * Rate Limit Error Component
 * Displays user-friendly rate limit error messages
 */

import React from 'react';
import './RateLimitError.css';

const RateLimitError = ({ 
  message, 
  remainingMinutes, 
  resetAt,
  onClose,
  show = true 
}) => {
  if (!show || !message) return null;

  const formatResetTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const reset = new Date(date);
    const diffMs = reset - now;
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins < 1) return 'less than a minute';
    if (diffMins === 1) return '1 minute';
    if (diffMins < 60) return `${diffMins} minutes`;
    
    const diffHours = Math.ceil(diffMins / 60);
    if (diffHours === 1) return '1 hour';
    return `${diffHours} hours`;
  };

  return (
    <div className="rate-limit-error-overlay">
      <div className="rate-limit-error-container">
        <div className="rate-limit-error-icon">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h3 className="rate-limit-error-title">Slow Down!</h3>
        
        <p className="rate-limit-error-message">{message}</p>

        {resetAt && (
          <p className="rate-limit-error-reset">
            You can try again in <strong>{formatResetTime(resetAt)}</strong>
          </p>
        )}

        <div className="rate-limit-error-tips">
          <p className="rate-limit-error-tips-title">Why am I seeing this?</p>
          <ul>
            <li>Rate limits help keep Focus safe and prevent spam</li>
            <li>They ensure a better experience for everyone</li>
            <li>Limits reset automatically after the time period</li>
          </ul>
        </div>

        {onClose && (
          <button 
            className="rate-limit-error-close"
            onClick={onClose}
            aria-label="Close"
          >
            I Understand
          </button>
        )}
      </div>
    </div>
  );
};

export default RateLimitError;
