import React from 'react';
import PropTypes from 'prop-types';
import styles from './Badge.module.css';

/**
 * Badge
 * Notification badge component with count.
 * @param {number} count - Number to display
 * @param {string} label - ARIA label
 * @example <Badge count={5} label="Notifications" />
 */
const Badge = ({ count, label }) => (
  <span className={styles.badge} aria-label={label || 'Badge'} role="status">
    {count}
  </span>
);

Badge.propTypes = {
  count: PropTypes.number.isRequired,
  label: PropTypes.string
};

export default React.memo(Badge);
