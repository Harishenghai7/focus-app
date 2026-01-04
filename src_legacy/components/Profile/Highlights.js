import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import './Highlights.css';

/**
 * Highlights - Horizontal scrolling highlight covers with add button
 */
const Highlights = ({ userId, isOwnProfile }) => {
  const [highlights, setHighlights] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // TODO: Fetch highlights from database
    // For now, return empty
    setLoading(false);
  }, [userId]);

  if (loading) {
    return (
      <div className="highlights-container">
        <div className="highlights-scroll">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="highlight-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (highlights.length === 0 && !isOwnProfile) {
    return null;
  }

  return (
    <div className="highlights-container">
      <div className="highlights-scroll">
        {isOwnProfile && (
          <motion.button
            className="highlight-add"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Add Highlight"
          >
            <div className="highlight-cover add-icon">
              <span>+</span>
            </div>
            <span className="highlight-label">New</span>
          </motion.button>
        )}

        {highlights.map((highlight, index) => (
          <motion.button
            key={highlight.id}
            className="highlight-item"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={`View ${highlight.name} highlight`}
          >
            <div className="highlight-cover">
              <img
                src={highlight.cover_url}
                alt={highlight.name}
                className="highlight-image"
              />
            </div>
            <span className="highlight-label">{highlight.name}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

Highlights.propTypes = {
  userId: PropTypes.string.isRequired,
  isOwnProfile: PropTypes.bool
};

export default Highlights;
