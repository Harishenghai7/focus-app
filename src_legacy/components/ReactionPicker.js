import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import styles from './ReactionPicker.module.css';

/**
 * ReactionPicker - Emoji reaction picker modal.
 * @component
 * @param {function} onSelect - Handler for emoji selection
 * @param {function} onClose - Handler to close picker
 * @returns {React.ReactElement}
 */
const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🙌'];

const ReactionPicker = React.memo(function ReactionPicker({ onSelect, onClose }) {
  return (
    <motion.div
      className={styles.reactionPickerOverlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Pick a reaction"
    >
      <motion.div
        className={styles.reactionPicker}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            className={styles.reactionButton}
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
});

ReactionPicker.displayName = 'ReactionPicker';
ReactionPicker.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ReactionPicker;
