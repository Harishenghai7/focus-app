import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './MediaViewer.module.css';

/**
 * MediaViewer - Displays media (image/video) in an overlay with download and close options.
 * @component
 * @param {string} mediaUrl - URL of the media to display
 * @param {string} mediaType - Type of media ('image' or 'video')
 * @param {function} onClose - Handler to close the viewer
 * @returns {React.ReactElement}
 */
const MediaViewer = React.memo(function MediaViewer({ mediaUrl, mediaType, onClose }) {
  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close media viewer">
        
      </button>
      <div className={styles.content} onClick={e => e.stopPropagation()}>
        {mediaType === 'video' ? (
          <video src={mediaUrl} controls autoPlay aria-label="Video preview" />
        ) : (
          <img src={mediaUrl} alt="Media" />
        )}
      </div>
      <button className={styles.downloadBtn} onClick={() => window.open(mediaUrl, '_blank')} aria-label="Download media">
         Download
      </button>
    </motion.div>
  );
});

MediaViewer.displayName = 'MediaViewer';
MediaViewer.propTypes = {
  mediaUrl: PropTypes.string.isRequired,
  mediaType: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

export default MediaViewer;
