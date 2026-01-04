// ═══════════════════════════════════════════════════════════════════════
// ENHANCED MESSAGE INPUT - GIFs, Stickers, Media, Voice, Share Content
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { uploadImage, uploadVideo } from '../../utils/mediaUpload';
import GifPicker from '../Modals/GifPicker';
import StickerPicker from '../../../../components/messages/StickerPicker';
import styles from './MessageInput.module.css';

const EMOJI_CATEGORIES = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
    gestures: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋'],
    food: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞']
};

const EnhancedMessageInput = ({
    conversationId,
    currentUserId,
    replyTo,
    onClearReply,
    onSendMessage,
    typingUsers = [],
    onTypingChange
}) => {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
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
        onTypingChange?.(true);

        typingTimeoutRef.current = setTimeout(() => {
            onTypingChange?.(false);
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

    // Handle GIF selection
    const handleGifSelect = async (gifData) => {
        try {
            setUploading(true);

            const messageData = {
                type: 'gif',
                content: gifData.title,
                metadata: {
                    url: gifData.url,
                    previewUrl: gifData.previewUrl,
                    width: gifData.width,
                    height: gifData.height
                },
                replyToId: replyTo?.id
            };

            await onSendMessage(messageData);
            onClearReply?.();
        } catch (error) {
            console.error('Error sending GIF:', error);
            alert('Failed to send GIF: ' + error.message);
        } finally {
            setUploading(false);
            setShowGifPicker(false);
        }
    };

    // Handle sticker selection
    const handleStickerSelect = async (stickerUrl, stickerName) => {
        try {
            setUploading(true);

            const messageData = {
                type: 'sticker',
                content: stickerName,
                metadata: {
                    url: stickerUrl,
                    name: stickerName
                },
                replyToId: replyTo?.id
            };

            await onSendMessage(messageData);
            onClearReply?.();
        } catch (error) {
            console.error('Error sending sticker:', error);
            alert('Failed to send sticker: ' + error.message);
        } finally {
            setUploading(false);
            setShowStickerPicker(false);
        }
    };

    // Handle send
    const handleSend = async () => {
        if (!text.trim() && !mediaFile) return;

        // Prevent duplicate sends
        if (uploading) return;

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

                console.log('📤 Uploading media:', mediaFile.name);
                const attachmentData = await uploadFn(mediaFile, currentUserId);
                console.log('✅ Upload complete:', attachmentData);

                messageData.type = isImage ? 'image' : 'video';
                messageData.attachmentData = attachmentData;
            }

            console.log('📨 Sending message:', messageData);
            await onSendMessage(messageData);
            console.log('✅ Message sent successfully');

            // Clear input and reset file input
            setText('');
            setMediaFile(null);
            setMediaPreview(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            onClearReply?.();
            onTypingChange?.(false);

        } catch (error) {
            console.error('❌ Error sending message:', error);
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
                    <div className={styles.typingDots}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span className={styles.typingText}>
                        {typingUsers.length === 1 ? 'Typing...' : `${typingUsers.length} people typing...`}
                    </span>
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


            {/* Media Preview - DISABLED FOR LAUNCH
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
            */}


            {/* Uploading State */}
            {uploading && (
                <div className={styles.uploading}>
                    <div className={styles.uploadSpinner}></div>
                    <div className={styles.uploadText}>Sending...</div>
                </div>
            )}

            {/* Input Row */}
            <div className={styles.inputRow}>
                {/* Media Buttons */}
                <div className={styles.mediaButtons}>
                    {/* Image/Video Upload - DISABLED FOR LAUNCH, WILL ADD IN v2.0
                    <button
                        className={styles.actionButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        title="Upload image or video"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    */}

                    {/* GIF Button */}
                    <button
                        className={`${styles.actionButton} ${showGifPicker ? styles.active : ''}`}
                        onClick={() => {
                            setShowGifPicker(!showGifPicker);
                            setShowStickerPicker(false);
                            setShowEmojiPicker(false);
                        }}
                        disabled={uploading}
                        title="Send GIF"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                            <line x1="7" y1="2" x2="7" y2="22" />
                            <line x1="17" y1="2" x2="17" y2="22" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                        </svg>
                    </button>

                    {/* Sticker Button */}
                    <button
                        className={`${styles.actionButton} ${showStickerPicker ? styles.active : ''}`}
                        onClick={() => {
                            setShowStickerPicker(!showStickerPicker);
                            setShowGifPicker(false);
                            setShowEmojiPicker(false);
                        }}
                        disabled={uploading}
                        title="Send sticker"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </button>
                </div>

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
                        className={`${styles.emojiButton} ${showEmojiPicker ? styles.active : ''}`}
                        onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker);
                            setShowGifPicker(false);
                            setShowStickerPicker(false);
                        }}
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

            {/* GIF Picker Modal */}
            {showGifPicker && (
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            )}

            {/* Sticker Picker Modal */}
            {showStickerPicker && (
                <StickerPicker
                    onSelect={handleStickerSelect}
                    onClose={() => setShowStickerPicker(false)}
                />
            )}
        </div>
    );
};

export default EnhancedMessageInput;
