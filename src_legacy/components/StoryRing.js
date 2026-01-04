import React from 'react';
import PropTypes from 'prop-types';
import styles from './StoryRing.module.css';

/**
 * StoryRing
 * Animated circular progress ring around profile picture.
 * @param {string} avatar - Profile image URL
 * @param {number} progress - Progress percentage (0-100)
 * @example <StoryRing avatar="..." progress={75} />
 */
const StoryRing = ({ avatar, progress }) => (
  <div className={styles.container}>
    <svg className={styles.ring} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" className={styles.bg} />
      <circle
        cx="24" cy="24" r="22"
        className={styles.fg}
        strokeDasharray={2 * Math.PI * 22}
        strokeDashoffset={2 * Math.PI * 22 * (1 - progress / 100)}
      />
    </svg>
    <img src={avatar} alt="Profile" className={styles.avatar} />
  </div>
);

StoryRing.propTypes = {
  avatar: PropTypes.string.isRequired,
  progress: PropTypes.number.isRequired
};

export default React.memo(StoryRing);
