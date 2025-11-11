import React from 'react';
import { motion } from 'framer-motion';
import './MediaViewer.css';

export default function MediaViewer({ mediaUrl, mediaType, onClose }) {
  return (
    <motion.div
      className="media-viewer-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <button className="viewer-close-btn" onClick={onClose}>✕</button>

      <div className="media-viewer-content" onClick={(e) => e.stopPropagation()}>
        {mediaType === 'video' ? (
          <video src={mediaUrl} controls autoPlay />
        ) : (
          <img src={mediaUrl} alt="Media" />
        )}
      </div>

      <button className="download-btn" onClick={() => window.open(mediaUrl, '_blank')}>
        ⬇️ Download
      </button>
    </motion.div>
  );
}
