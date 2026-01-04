import React from 'react';
import './UploadOverlay.css';

const UploadOverlay = ({ progress, isVisible, status = 'uploading', onClose }) => {
  if (!isVisible) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'uploading':
        return {
          icon: '📤',
          title: 'Uploading...',
          message: 'Please wait while we upload your content',
          color: '#8B7FD7'
        };
      case 'processing':
        return {
          icon: '⚙️',
          title: 'Processing...',
          message: 'Optimizing your media files',
          color: '#EE7BFA'
        };
      case 'success':
        return {
          icon: '✅',
          title: 'Published!',
          message: 'Your post has been published successfully',
          color: '#34C759'
        };
      case 'error':
        return {
          icon: '❌',
          title: 'Upload Failed',
          message: 'Something went wrong. Please try again',
          color: '#FF3B30'
        };
      default:
        return {
          icon: '📤',
          title: 'Uploading...',
          message: 'Please wait',
          color: '#8B7FD7'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="upload-overlay" role="dialog" aria-modal="true" aria-labelledby="upload-title">
      <div className="upload-overlay-backdrop" onClick={status === 'success' || status === 'error' ? onClose : undefined} />
      
      <div className="upload-content-card">
        <div className="upload-icon-wrapper" style={{ '--status-color': config.color }}>
          <div className="upload-icon">{config.icon}</div>
          {status === 'uploading' || status === 'processing' ? (
            <div className="icon-pulse" />
          ) : null}
        </div>

        <h2 id="upload-title" className="upload-title">{config.title}</h2>
        <p className="upload-message">{config.message}</p>

        {(status === 'uploading' || status === 'processing') && (
          <>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${config.color}, #EE7BFA)`
                }}
              />
            </div>
            <div className="progress-text">{Math.round(progress)}%</div>
          </>
        )}

        {status === 'success' && (
          <button
            className="upload-action-btn success"
            onClick={onClose}
            aria-label="Close"
          >
            View Post
          </button>
        )}

        {status === 'error' && (
          <div className="upload-actions">
            <button
              className="upload-action-btn secondary"
              onClick={onClose}
              aria-label="Cancel"
            >
              Cancel
            </button>
            <button
              className="upload-action-btn primary"
              onClick={onClose}
              aria-label="Try again"
            >
              Try Again
            </button>
          </div>
        )}

        {(status === 'uploading' || status === 'processing') && (
          <div className="upload-hint">
            Please don't close this window
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadOverlay;
