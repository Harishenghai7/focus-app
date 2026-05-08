/**
 * BoltzReactionPicker — Floating emoji reaction selector
 * Appears on long-press of Like button with staggered scale-in
 */
import React from 'react';
import styles from './BoltzReactionPicker.module.css';
import { REACTION_TYPES } from '../../hooks/useBoltzReactions';

const BoltzReactionPicker = ({ onSelect, onClose, activeReaction }) => {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.container} onClick={e => e.stopPropagation()}>
        <div className={styles.pill}>
          {REACTION_TYPES.map((reaction, i) => (
            <button
              key={reaction.key}
              className={`${styles.reactionBtn} ${activeReaction === reaction.key ? styles.active : ''}`}
              onClick={() => onSelect(reaction.key)}
              style={{ '--delay': `${i * 50}ms` }}
              title={reaction.label}
            >
              <span className={styles.emoji}>{reaction.emoji}</span>
            </button>
          ))}
        </div>
        <div className={styles.arrow} />
      </div>
    </div>
  );
};

export default BoltzReactionPicker;
