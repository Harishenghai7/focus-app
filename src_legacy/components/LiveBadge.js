import React from 'react';
import styles from './LiveBadge.module.css';

/**
 * LiveBadge
 * Animated "LIVE" indicator.
 * @example <LiveBadge />
 */
const LiveBadge = () => (
  <span className={styles.badge} aria-label="Live" title="Live">
    <span className={styles.dot} /> LIVE
  </span>
);

export default React.memo(LiveBadge);
