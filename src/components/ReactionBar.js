import React from 'react';
import PropTypes from 'prop-types';
import styles from './ReactionBar.module.css';

/**
 * ReactionBar
 * Quick reaction emojis (like, love, wow, sad, angry).
 * @param {Function} onReact - Callback with selected reaction
 * @example <ReactionBar onReact={handleReact} />
 */
const reactions = [
  { label: 'Like', emoji: '👍' },
  { label: 'Love', emoji: '❤️' },
  { label: 'Wow', emoji: '😮' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Angry', emoji: '😡' },
];

const ReactionBar = ({ onReact }) => (
  <div className={styles.container}>
    {reactions.map(r => (
      <button
        key={r.label}
        className={styles.reaction}
        onClick={() => onReact(r.label)}
        aria-label={r.label}
      >
        {r.emoji}
      </button>
    ))}
  </div>
);

ReactionBar.propTypes = {
  onReact: PropTypes.func.isRequired
};

export default React.memo(ReactionBar);
