import React from 'react';
import PropTypes from 'prop-types';
import styles from './TypingIndicator.module.css';

/**
 * TypingIndicator - Shows typing animation for a user.
 * @component
 * @param {string} username - Username of the person typing
 * @returns {React.ReactElement}
 */
const TypingIndicator = React.memo(function TypingIndicator({ username }) {
  return (
    <div className={styles.typingIndicator} role="status" aria-live="polite">
      <span className={styles.typingUsername}>{username} is typing</span>
      <div className={styles.typingDots} aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator';
TypingIndicator.propTypes = {
  username: PropTypes.string.isRequired
};

export default TypingIndicator;
