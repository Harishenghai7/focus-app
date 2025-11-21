import React from 'react';

const LoadingFallback = () => {
  return (
    <div className="loading-fallback">
      <div className="loading-spinner" role="status" aria-live="polite">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-text">Loading settings...</p>
    </div>
  );
};

export default LoadingFallback;
