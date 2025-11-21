import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './PullToRefresh.module.css';

/**
 * PullToRefresh
 * Mobile pull-to-refresh with spring animation.
 * @param {Function} onRefresh - Callback to refresh content
 * @param {React.ReactNode} children - Content to render inside
 * @example <PullToRefresh onRefresh={refreshFeed}>...</PullToRefresh>
 */
const PullToRefresh = ({ onRefresh, children }) => {
  const startY = useRef(null);
  const pulling = useRef(false);
  const containerRef = useRef(null);

  const handleTouchStart = (e) => {
    if (containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    }
  };
  const handleTouchMove = (e) => {
    if (!pulling.current) return;
    const diff = e.touches[0].clientY - startY.current;
    if (diff > 60) {
      pulling.current = false;
      onRefresh();
    }
  };
  const handleTouchEnd = () => {
    pulling.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Pull to refresh"
    >
      <div className={styles.spring} />
      {children}
    </div>
  );
};

PullToRefresh.propTypes = {
  onRefresh: PropTypes.func.isRequired,
  children: PropTypes.node
};

export default React.memo(PullToRefresh);
