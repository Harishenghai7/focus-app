import React from 'react';
import styles from './EmojiPicker.module.css';

const EmojiPicker = ({ onSelect, onClose }) => {
    const emojiCategories = {
        'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋'],
        'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
        'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
        'Objects': ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💯', '✅', '❌']
    };

    return (
        <div className={styles.emojiPicker}>
            <div className={styles.emojiHeader}>
                <h4 className={styles.emojiTitle}>Emojis</h4>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    ×
                </button>
            </div>
            <div className={styles.emojiContent}>
                {Object.entries(emojiCategories).map(([category, emojis]) => (
                    <div key={category} className={styles.emojiCategory}>
                        <h5 className={styles.categoryTitle}>{category}</h5>
                        <div className={styles.emojiGrid}>
                            {emojis.map((emoji, idx) => (
                                <button
                                    key={idx}
                                    className={styles.emojiButton}
                                    onClick={() => onSelect(emoji)}
                                    aria-label={`Select ${emoji}`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EmojiPicker;
