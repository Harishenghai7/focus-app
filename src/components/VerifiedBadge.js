import React from 'react';
import PropTypes from 'prop-types';
import styles from './VerifiedBadge.module.css';

/**
 * VerifiedBadge - SVG badge for verified users.
 * @component
 * @param {number} [size] - Size of the badge
 * @returns {React.ReactElement}
 */
const VerifiedBadge = React.memo(function VerifiedBadge({ size = 14 }) {
  return (
    <svg
      className={styles.verifiedBadge}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#3b82f6"
      aria-label="Verified badge"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
});

VerifiedBadge.displayName = 'VerifiedBadge';
VerifiedBadge.propTypes = {
  size: PropTypes.number
};

export default VerifiedBadge;
