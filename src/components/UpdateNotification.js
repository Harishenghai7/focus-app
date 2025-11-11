import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UpdateNotification.css';
import { startVersionChecking, dismissUpdate, forceRefresh } from '../utils/versionManager';

const UpdateNotification = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Start checking for updates
    const cleanup = startVersionChecking((update) => {
      setUpdateInfo(update);
    });

    return cleanup;
  }, []);

  const handleUpdate = () => {
    forceRefresh();
  };

  const handleDismiss = () => {
    if (updateInfo && !updateInfo.forceUpdate) {
      dismissUpdate(updateInfo.newVersion);
      setUpdateInfo(null);
    }
  };

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  if (!updateInfo) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="update-notification-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="update-notification-modal"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <div className="update-notification-header">
            <div className="update-icon">🎉</div>
            <h2>Update Available</h2>
            {updateInfo.forceUpdate && (
              <span className="update-badge">Required</span>
            )}
          </div>

          <div className="update-notification-content">
            <p className="update-version-info">
              A new version of Focus is available!
            </p>
            <div className="update-versions">
              <span className="version-current">
                Current: v{updateInfo.currentVersion}
              </span>
              <span className="version-arrow">→</span>
              <span className="version-new">
                New: v{updateInfo.newVersion}
              </span>
            </div>

            {updateInfo.releaseNotes && updateInfo.releaseNotes.length > 0 && (
              <div className="update-release-notes">
                <button
                  className="release-notes-toggle"
                  onClick={handleToggleDetails}
                >
                  {showDetails ? '▼' : '▶'} What's New
                </button>
                <AnimatePresence>
                  {showDetails && (
                    <motion.ul
                      className="release-notes-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      {updateInfo.releaseNotes.map((note, index) => (
                        <li key={index}>{note}</li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            )}

            {updateInfo.forceUpdate && (
              <p className="update-force-message">
                This update is required to continue using Focus.
              </p>
            )}
          </div>

          <div className="update-notification-actions">
            <button
              className="update-button update-button-primary"
              onClick={handleUpdate}
            >
              {updateInfo.forceUpdate ? 'Update Now' : 'Update & Refresh'}
            </button>
            {!updateInfo.forceUpdate && (
              <button
                className="update-button update-button-secondary"
                onClick={handleDismiss}
              >
                Remind Me Later
              </button>
            )}
          </div>

          <p className="update-notification-footer">
            The app will refresh automatically after updating.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UpdateNotification;
