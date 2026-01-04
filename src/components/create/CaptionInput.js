import React, { useState } from 'react';
import styles from './CaptionInput.module.css';
import TagInput from '../shared/TagInput';
import { Smile } from 'lucide-react';

const CaptionInput = ({ caption, onCaptionChange, tags, onTagsChange }) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const EMOJIS = ['😊', '😂', '❤️', '🔥', '✨', '👍', '🎉', '💯'];

    const insertEmoji = (emoji) => {
        onCaptionChange(caption + emoji);
        setShowEmojiPicker(false);
    };

    return (
        <div className={styles.container}>
            <div className={styles.captionWrapper}>
                <textarea
                    className={styles.textarea}
                    placeholder="Write a caption..."
                    value={caption}
                    onChange={(e) => onCaptionChange(e.target.value)}
                    maxLength={2200}
                />
                <button
                    className={styles.emojiButton}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                    <Smile size={20} />
                </button>

                {showEmojiPicker && (
                    <div className={styles.emojiPicker}>
                        {EMOJIS.map((emoji, i) => (
                            <button
                                key={i}
                                className={styles.emojiBtn}
                                onClick={() => insertEmoji(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className={styles.charCount}>
                {caption.length} / 2200
            </div>

            <div className={styles.tagsSection}>
                <label className={styles.label}>Tags</label>
                <TagInput tags={tags} onChange={onTagsChange} />
            </div>
        </div>
    );
};

export default CaptionInput;
