import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './MediaPreview.module.css';

/**
 * MediaPreview - Shows a preview of media before sending.
 * @component
 * @param {File} file - Media file to preview
 * @param {function} onRemove - Handler to remove preview
 * @param {function} onSend - Handler to send media
 * @returns {React.ReactElement}
 */
const MediaPreview = React.memo(function MediaPreview({ file, onRemove, onSend }) {
  const [preview, setPreview] = React.useState(null);
  const isVideo = file?.type.startsWith('video/');

  React.useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, [file]);

  return (
    <motion.div
      className={styles.mediaPreviewOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className={styles.mediaPreviewContainer}>
        <div className={styles.previewHeader}>
          <h3>Send {isVideo ? 'Video' : 'Photo'}</h3>
          <button className={styles.closeBtn} onClick={onRemove} aria-label="Close preview">
            ✕
          </button>
        </div>

        <div className={styles.previewContent}>
          {isVideo ? (
            <video src={preview} controls autoPlay loop aria-label="Video preview" />
          ) : (
            <img src={preview} alt="Preview" aria-label="Image preview" />
          )}
        </div>

        <div className={styles.previewActions}>
          <button className={styles.btnCancel} onClick={onRemove} aria-label="Cancel">
            Cancel
          </button>
          <button className={styles.btnSend} onClick={onSend} aria-label="Send media">
            Send {isVideo ? '🎥' : '📷'}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

MediaPreview.displayName = 'MediaPreview';
MediaPreview.propTypes = {
  file: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired
};

export default MediaPreview;
