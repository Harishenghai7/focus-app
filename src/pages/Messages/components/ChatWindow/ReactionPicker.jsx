/* ═══════════════════════════════════════════════════════════════════════
   REACTION PICKER - 6 emoji reactions
   ═══════════════════════════════════════════════════════════════════════ */

import React from 'react';
import styles from './ReactionPicker.module.css';

const REACTIONS = ['❤️', '😂', '🔥', '👍', '😮', '😢'];

const ReactionPicker = ({ onSelect, onClose }) => {
    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={styles.picker}>
                {REACTIONS.map(emoji => (
                    <button
                        key={emoji}
                        onClick={() => onSelect(emoji)}
                        className={styles.reactionButton}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </>
    );
};

export default ReactionPicker;
