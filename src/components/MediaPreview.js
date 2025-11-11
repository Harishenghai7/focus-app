import React from 'react';
import { motion } from 'framer-motion';
import './MediaPreview.css';

export default function MediaPreview({ file, onRemove, onSend }) {
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
      className="media-preview-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="media-preview-container">
        <div className="preview-header">
          <h3>Send {isVideo ? 'Video' : 'Photo'}</h3>
          <button className="close-btn" onClick={onRemove}>✕</button>
        </div>

        <div className="preview-content">
          {isVideo ? (
            <video src={preview} controls autoPlay loop />
          ) : (
            <img src={preview} alt="Preview" />
          )}
        </div>

        <div className="preview-actions">
          <button className="btn-cancel" onClick={onRemove}>
            Cancel
          </button>
          <button className="btn-send" onClick={onSend}>
            Send {isVideo ? '🎥' : '📷'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
