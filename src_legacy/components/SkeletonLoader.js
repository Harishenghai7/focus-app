import React from 'react';
import PropTypes from 'prop-types';
import styles from './SkeletonLoader.module.css';

/**
 * SkeletonLoader
 * Content placeholder with shimmer effect.
 * @param {string} variant - Type of skeleton (post, profile, list, grid)
 * @param {number} count - Number of skeletons to render
 * @example <SkeletonLoader variant="post" count={3} />
 */
const SkeletonLoader = ({ variant = 'post', count = 1 }) => {
  return (
    <div 
      className={`${styles.container} ${variant === 'grid' ? styles.gridContainer : ''}`}
      aria-busy="true" 
      aria-label="Loading content"
      data-testid="loading-state"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${styles.skeleton} ${styles[variant]}`} />
      ))}
    </div>
  );
};

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(['post', 'profile', 'list', 'grid']),
  count: PropTypes.number
};

export default React.memo(SkeletonLoader);
