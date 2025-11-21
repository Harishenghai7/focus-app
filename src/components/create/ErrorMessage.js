import React, { useEffect } from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ message, onClose, duration = 5000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className="error-message-container">
      <div className="error-message">
        <span className="error-icon">⚠️</span>
        <p className="error-text">{message}</p>
        <button className="error-close" onClick={onClose} aria-label="Close error">
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorMessage;
