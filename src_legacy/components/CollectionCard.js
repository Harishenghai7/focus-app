import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './CollectionCard.css';

/**
 * CollectionCard Component
 * Displays a saved post collection with preview images
 * 
 * @param {Object} collection - Collection data
 * @param {Function} onDelete - Callback for deleting collection
 */
export default function CollectionCard({ collection, onDelete }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/saved/collection/${collection.id}`);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete collection "${collection.name}"?`)) {
      onDelete(collection.id);
    }
  };

  return (
    <motion.div
      className="collection-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={handleClick}
    >
      <div className="collection-preview">
        {collection.preview_images && collection.preview_images.length > 0 ? (
          <div className="collection-grid-preview">
            {collection.preview_images.slice(0, 4).map((img, idx) => (
              <div key={idx} className="preview-item">
                <img src={img} alt="" />
              </div>
            ))}
          </div>
        ) : (
          <div className="collection-empty-preview">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
        )}
      </div>

      <div className="collection-info">
        <h3>{collection.name}</h3>
        <p className="collection-count">{collection.post_count || 0} posts</p>
      </div>

      <button
        className="collection-delete-btn"
        onClick={handleDelete}
        title="Delete collection"
      >
        🗑️
      </button>
    </motion.div>
  );
}
