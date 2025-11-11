import React from 'react';
import { motion } from 'framer-motion';
import './ReactionPicker.css';

export default function ReactionPicker({ onSelect, onClose }) {
  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '🙌'];

  return (
    <motion.div
      className="reaction-picker-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="reaction-picker"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {quickReactions.map((emoji) => (
          <button
            key={emoji}
            className="reaction-button"
            onClick={() => {
              onSelect(emoji);
              onClose();
            }}
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
