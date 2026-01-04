import React from 'react';
import PropTypes from 'prop-types';
import styles from './ProgressBar.module.css';

/**
 * ProgressBar
 * Upload/download progress with percentage.
 * @param {number} value - Progress value (0-100)
 * @param {string} label - Optional label
 * @example <ProgressBar value={60} label="Uploading..." />
 */
const ProgressBar = ({ value, label }) => (
  <div className={styles.container} aria-label={label || 'Progress'}>
    {label && <span className={styles.label}>{label}</span>}
    <div className={styles.barWrapper}>
      <div className={styles.bar} style={{ width: `${value}%` }} />
    </div>
    <span className={styles.percent}>{value}%</span>
  </div>
);

ProgressBar.propTypes = {
  value: PropTypes.number.isRequired,
  label: PropTypes.string
};

export default React.memo(ProgressBar);
