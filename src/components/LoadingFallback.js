import React from 'react';
import styles from './LoadingFallback.module.css';

/**
 * LoadingFallback
 * Full-screen loading spinner for lazy loading and route transitions.
 * Displays centered spinner with accessibility support.
 * @example <Suspense fallback={<LoadingFallback />}><LazyComponent /></Suspense>
 */
const LoadingFallback = () => {
  return (
    <div 
      className={styles.container}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading content, please wait"
      data-testid="loading-fallback"
    >
      <div className={styles.spinner}>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      <p className={styles.loadingText}>Loading...</p>
    </div>
  );
};

export default React.memo(LoadingFallback);
