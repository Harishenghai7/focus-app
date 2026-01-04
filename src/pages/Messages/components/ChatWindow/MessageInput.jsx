// ═══════════════════════════════════════════════════════════════════════
// MESSAGE INPUT COMPONENT - Text, emoji, media attachments
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { uploadImage, uploadVideo } from '../../utils/mediaUpload';
import styles from './MessageInput.module.css';

const EMOJI_CATEGORIES = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞']
};

const MessageInput = ({
    conversationId,
    currentUserId,
    replyTo,
    onClearReply,
    onSendMessage,
    typingUsers = []
}) => {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('smileys');
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [uploading, setUploading] = useState(false);

    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [text]);

    // Handle text change with typing indicator
    const handleTextChange = (e) => {
        setText(e.target.value);

        // Trigger typing indicator (debounced)
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Send typing status
        // setTypingStatus(conversationId, currentUserId, true);

        typingTimeoutRef.current = setTimeout(() => {
            // setTypingStatus(conversationId, currentUserId, false);
        }, 3000);
    };

    // Handle emoji selection
    const handleEmojiClick = (emoji) => {
        const cursorPos = textareaRef.current?.selectionStart || text.length;
        const newText = text.slice(0, cursorPos) + emoji + text.slice(cursorPos);
        setText(newText);
        textareaRef.current?.focus();
    };

    // Handle file selection
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setMediaFile(file);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setMediaPreview({
                url: e.target.result,
                name: file.name,
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                type: file.type.startsWith('image/') ? 'image' : 'video'
            });
        };
        reader.readAsDataURL(file);
    };

    // Handle send
    const handleSend = async () => {
        if (!text.trim() && !mediaFile) return;

        try {
            setUploading(true);

            let messageData = {
                content: text.trim(),
                replyToId: replyTo?.id
            };

            // Upload media if present
            if (mediaFile) {
                const isImage = mediaFile.type.startsWith('image/');
                const uploadFn = isImage ? uploadImage : uploadVideo;

                const attachmentData = await uploadFn(mediaFile, currentUserId);
                messageData.type = isImage ? 'image' : 'video';
                messageData.attachmentData = attachmentData;
            }

            await onSendMessage(messageData);

            // Clear input
            setText('');
            setMediaFile(null);
            setMediaPreview(null);
            onClearReply?.();

        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Handle Enter key
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.inputContainer}>
            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
                <div className={styles.typingIndicator}>
                    {typingUsers.length === 1 ? 'Typing...' : `${typingUsers.length} people typing...`}
                </div>
            )}

            {/* Reply Preview */}
            {replyTo && (
                <div className={styles.replyPreview}>
                    <div className={styles.replyContent}>
                        <div className={styles.replyTo}>
                            Replying to {replyTo.sender_id === currentUserId ? 'yourself' : replyTo.sender?.username}
                        </div>
                        <div className={styles.replyText}>
                            {replyTo.content || `[${replyTo.type}]`}
                        </div>
                    </div>
                    <button className={styles.closeReply} onClick={onClearReply}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Media Preview */}
            {mediaPreview && !uploading && (
                <div className={styles.mediaPreview}>
                    <div className={styles.previewThumbnail}>
                        {mediaPreview.type === 'image' ? (
                            <img src={mediaPreview.url} alt="Preview" />
                        ) : (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                        )}
                    </div>
                    <div className={styles.previewInfo}>
                        <div className={styles.previewName}>{mediaPreview.name}</div>
                        <div className={styles.previewSize}>{mediaPreview.size}</div>
                    </div>
                    <button className={styles.removePreview} onClick={() => {
                        setMediaFile(null);
                        setMediaPreview(null);
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Uploading State */}
            {uploading && (
                <div className={styles.uploading}>
                    <div className={styles.uploadSpinner}></div>
                    <div className={styles.uploadText}>Uploading...</div>
                </div>
            )}

            {/* Input Row */}
            <div className={styles.inputRow}>
                {/* Attach Button */}
                <button
                    className={styles.actionButton}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />

                {/* Text Input */}
                <div className={styles.inputWrapper}>
                    <textarea
                        ref={textareaRef}
                        className={styles.textInput}
                        placeholder="Type a message..."
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={uploading}
                    />

                    {/* Emoji Button */}
                    <button
                        className={styles.emojiButton}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        😊
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div className={styles.emojiPicker}>
                            <div className={styles.emojiCategories}>
                                {Object.keys(EMOJI_CATEGORIES).map(cat => (
                                    <button
                                        key={cat}
                                        className={`${styles.emojiCategory} ${selectedCategory === cat ? styles.active : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {EMOJI_CATEGORIES[cat][0]}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.emojiGrid}>
                                {EMOJI_CATEGORIES[selectedCategory].map((emoji, i) => (
                                    <div
                                        key={i}
                                        className={styles.emojiItem}
                                        onClick={() => handleEmojiClick(emoji)}
                                    >
                                        {emoji}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Send Button */}
                <button
                    className={styles.sendButton}
                    onClick={handleSend}
                    disabled={(!text.trim() && !mediaFile) || uploading}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default MessageInput;
