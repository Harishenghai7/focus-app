import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
import { useClickOutside } from '../../hooks/useClickOutside';
import styles from './MessageActions.module.css';

const MessageActions = ({
    message,
    isOwn,
    onReply,
    onReact,
    onEdit,
    onDelete,
    onStar,
    onForward,
    onCopy,
    position = 'right',
    onMenuOpen,
    onMenuClose
}) => {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);
    const emojiRef = useRef(null);

    useEffect(() => {
        if (showMenu) {
            onMenuOpen?.();
        } else {
            onMenuClose?.();
        }
    }, [showMenu, onMenuOpen, onMenuClose]);

    useClickOutside(menuRef, () => setShowMenu(false));
    useClickOutside(emojiRef, () => setShowEmojiPicker(false));

    const handleReact = (emoji) => {
        console.log('🎭 handleReact called:', emoji, message);
        onReact(message, emoji);
        setShowEmojiPicker(false);
    };

    const handleCopy = () => {
        console.log('📋 handleCopy called:', message.content);
        if (message.content) {
            navigator.clipboard.writeText(message.content);
            setShowMenu(false);
        }
    };

    const handleDelete = () => {
        console.log('🗑️ handleDelete called:', message);
        onDelete(message);
        setShowMenu(false);
    };

    const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

    return (
        <div className={`${styles.messageActions} ${styles[position]}`}>
            {/* Quick Reactions */}
            <div className={styles.quickReactions}>
                {quickReactions.map((emoji) => (
                    <button
                        key={emoji}
                        className={styles.quickReaction}
                        onClick={() => handleReact(emoji)}
                        title={`React with ${emoji}`}
                    >
                        {emoji}
                    </button>
                ))}
                <button
                    className={styles.quickReaction}
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="More reactions"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <circle cx="8" cy="10" r="1.5" fill="currentColor" />
                        <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                        <path d="M8 15c1 1.5 3 2 4 2s3-.5 4-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
                <button
                    className={styles.actionBtn}
                    onClick={() => {
                        console.log('↩️ Reply button clicked:', message);
                        onReply(message);
                    }}
                    title="Reply"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M9 11l-6 6v-6m0 0l6-6m-6 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                <button
                    className={styles.actionBtn}
                    onClick={() => setShowMenu(!showMenu)}
                    title="More options"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                        <circle cx="12" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                </button>
            </div>

            {/* Emoji Picker Dropdown */}
            {showEmojiPicker && (
                <div ref={emojiRef} className={styles.emojiPickerDropdown}>
                    <EmojiPicker onSelect={handleReact} />
                </div>
            )}

            {/* More Actions Menu */}
            {showMenu && (
                <div ref={menuRef} className={styles.actionsMenu}>
                    <button className={styles.menuItem} onClick={handleCopy}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <span>Copy</span>
                    </button>

                    {isOwn && (
                        <button className={`${styles.menuItem} ${styles.danger}`} onClick={handleDelete}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageActions;
