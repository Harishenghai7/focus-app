import React from 'react';
import PropTypes from 'prop-types';
import styles from './OnlineIndicator.module.css';

/**
 * OnlineIndicator
 * Green dot for online status.
 * @param {boolean} online - Whether user is online
 * @example <OnlineIndicator online={true} />
 */
const OnlineIndicator = ({ online }) => (
  online ? <span className={styles.dot} aria-label="Online" title="Online" /> : null
);

OnlineIndicator.propTypes = {
  online: PropTypes.bool.isRequired
};

export default React.memo(OnlineIndicator);
