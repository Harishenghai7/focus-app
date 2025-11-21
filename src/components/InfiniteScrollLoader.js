import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './InfiniteScrollLoader.module.css';

/**
 * InfiniteScrollLoader
 * Intersection Observer-based infinite scroll loader with spinner.
 * @param {Function} onLoadMore - Callback when more data should be loaded
 * @param {boolean} loading - Whether data is currently loading
 * @param {React.ReactNode} children - Content to render above loader
 * @example <InfiniteScrollLoader onLoadMore={fetchMore} loading={isLoading}>...</InfiniteScrollLoader>
 */
const InfiniteScrollLoader = ({ onLoadMore, loading, children }) => {
  const loaderRef = useRef(null);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new window.IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loading, onLoadMore]);

  return (
    <div className={styles.container}>
      {children}
      <div ref={loaderRef} className={styles.loader} aria-label="Loading more content" role="status">
        {loading && <span className={styles.spinner} />}
      </div>
    </div>
  );
};

InfiniteScrollLoader.propTypes = {
  onLoadMore: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node
};

export default React.memo(InfiniteScrollLoader);
