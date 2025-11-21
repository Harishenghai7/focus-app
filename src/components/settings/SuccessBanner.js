import React, { useEffect } from 'react';

const SuccessBanner = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 4000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="success-banner" role="status" aria-live="polite">
      <div className="success-icon">✓</div>
      <p className="success-text">{message}</p>
      <button 
        className="close-button" 
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default SuccessBanner;
