import React from 'react';
import styles from './ReactionPicker.module.css';

// Quick reactions (Instagram/WhatsApp style)
const QUICK_REACTIONS = [
    { emoji: '❤️', label: 'Love' },
    { emoji: '😂', label: 'Haha' },
    { emoji: '😮', label: 'Wow' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '👍', label: 'Like' },
    { emoji: '🔥', label: 'Fire' },
    { emoji: '🎉', label: 'Party' }
];

const ReactionPicker = ({ onSelect, onClose, position = 'top' }) => {
    const handleSelect = (emoji) => {
        onSelect(emoji);
        onClose();
    };

    return (
        <>
            <div className={styles.overlay} onClick={onClose} />
            <div className={`${styles.picker} ${styles[position]}`}>
                <div className={styles.reactions}>
                    {QUICK_REACTIONS.map(({ emoji, label }) => (
                        <button
                            key={emoji}
                            className={styles.reactionButton}
                            onClick={() => handleSelect(emoji)}
                            title={label}
                            aria-label={label}
                        >
                            <span className={styles.emoji}>{emoji}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
};

export default ReactionPicker;
