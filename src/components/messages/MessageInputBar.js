import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from './EmojiPicker';
// v2.0 ADVANCED FEATURES - Restored
import StickerPicker from './StickerPicker';
import GifPicker from './GifPicker';
import AudioRecorder from './AudioRecorder';
import ReplyPreview from './ReplyPreview';
import SmartReplies from './SmartReplies';
import AttachmentMenu from './AttachmentMenu';
import { useAttachmentUpload } from '../../hooks/useAttachmentUpload';
import styles from './MessageInputBar.module.css';

const MessageInputBar = ({
    onSend,
    onTyping,
    onStopTyping,
    replyTo,
    onCancelReply,
    disabled = false,
    silentMode = false,
    onSilentModeToggle,
    lastMessage,
    onPollClick,
    onLocationClick,
    onVideoNoteClick,
    onEventClick,
    onStickerClick,
    onGifClick,
    isGroup = false
}) => {
    const [message, setMessage] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
    const [showAudioRecorder, setShowAudioRecorder] = useState(false);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    const { uploadFile, uploading } = useAttachmentUpload();

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [message]);

    const handleChange = (e) => {
        setMessage(e.target.value);
        if (onTyping) onTyping();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSend = () => {
        if (!message.trim() || disabled) return;

        onSend(message.trim(), { replyTo, messageType: 'text', silent: silentMode });
        setMessage('');

        if (onStopTyping) onStopTyping();
        if (onCancelReply) onCancelReply();
    };

    const handleEmojiSelect = (emoji) => {
        setMessage(prev => prev + emoji);
        textareaRef.current?.focus();
    };

    const handleFileSelect = async (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const uploadedUrl = await uploadFile(file);
            onSend('', {
                attachments: [{ url: uploadedUrl, name: file.name, type: file.type }],
                replyTo,
                messageType: type,
                silent: silentMode
            });

            if (onCancelReply) onCancelReply();
        } catch (error) {
            console.error('Failed to upload file:', error);
        }
    };

    const handleAudioRecordComplete = async (audioBlob, duration) => {
        try {
            const audioFile = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            const uploadedUrl = await uploadFile(audioFile);

            onSend('', {
                attachments: [{ url: uploadedUrl, name: audioFile.name, type: 'audio/webm', duration }],
                replyTo,
                messageType: 'audio',
                silent: silentMode
            });

            setShowAudioRecorder(false);
            if (onCancelReply) onCancelReply();
        } catch (error) {
            console.error('Failed to send voice message:', error);
        }
    };

    const handlePhotoClick = () => {
        fileInputRef.current.accept = 'image/*';
        fileInputRef.current.onchange = (e) => handleFileSelect(e, 'image');
        fileInputRef.current.click();
    };

    const handleVideoClick = () => {
        fileInputRef.current.accept = 'video/*';
        fileInputRef.current.onchange = (e) => handleFileSelect(e, 'video');
        fileInputRef.current.click();
    };

    const handleDocumentClick = () => {
        fileInputRef.current.accept = '*/*';
        fileInputRef.current.onchange = (e) => handleFileSelect(e, 'file');
        fileInputRef.current.click();
    };

    const handleAudioFileClick = () => {
        fileInputRef.current.accept = 'audio/*';
        fileInputRef.current.onchange = (e) => handleFileSelect(e, 'audio');
        fileInputRef.current.click();
    };

    const handleStickerClick = () => {
        setShowStickerPicker(true);
        setShowAttachmentMenu(false);
    };

    const handleGifClick = () => {
        setShowGifPicker(true);
        setShowAttachmentMenu(false);
    };

    const handleStickerSelect = (stickerPath, stickerName) => {
        onSend(stickerPath, { replyTo, messageType: 'sticker', silent: silentMode });
        setShowStickerPicker(false);
        if (onCancelReply) onCancelReply();
    };

    const handleGifSelect = (gifUrl, gifDesc) => {
        onSend(gifUrl, { replyTo, messageType: 'gif', silent: silentMode });
        setShowGifPicker(false);
        if (onCancelReply) onCancelReply();
    };

    return (
        <div className={styles.inputContainer}>
            {/* v2.0 Smart Replies */}
            {lastMessage && !message && (
                <SmartReplies
                    lastMessage={lastMessage}
                    onSelectReply={(reply) => setMessage(reply)}
                />
            )}

            {replyTo && (
                <ReplyPreview message={replyTo} onCancel={onCancelReply} />
            )}

            {/* v2.0 Audio Recorder */}
            {showAudioRecorder ? (
                <AudioRecorder
                    onRecordComplete={handleAudioRecordComplete}
                    onCancel={() => setShowAudioRecorder(false)}
                />
            ) : (
                <div className={styles.inputWrapper}>
                    {/* Attachment Button (WhatsApp Style) */}
                    <button
                        className={`${styles.iconButton} ${showAttachmentMenu ? styles.active : ''}`}
                        onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                        aria-label="Attach"
                        title="Attach"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Text Input */}
                    <textarea
                        ref={textareaRef}
                        className={styles.input}
                        placeholder="Type a message..."
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || uploading}
                        rows={1}
                        aria-label="Message input"
                    />

                    {/* Emoji Button */}
                    <button
                        className={`${styles.iconButton} ${showEmojiPicker ? styles.active : ''}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        aria-label="Emoji"
                        title="Emoji"
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>

                    {/* Send or Mic Button */}
                    {message.trim() ? (
                        <button
                            className={`${styles.sendButton} ${styles.active}`}
                            onClick={handleSend}
                            disabled={disabled || uploading}
                            aria-label="Send message"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            className={styles.iconButton}
                            onClick={() => setShowAudioRecorder(true)}
                            aria-label="Record voice message"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    )}
                </div>
            )}

            {/* Emoji Picker */}
            {showEmojiPicker && (
                <div className={styles.emojiPickerWrapper}>
                    <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                </div>
            )}

            {/* v2.0 Attachment Menu */}
            {showAttachmentMenu && (
                <AttachmentMenu
                    onClose={() => setShowAttachmentMenu(false)}
                    onPhotoClick={handlePhotoClick}
                    onVideoClick={handleVideoClick}
                    onCameraClick={handlePhotoClick}
                    onDocumentClick={handleDocumentClick}
                    onAudioClick={handleAudioFileClick}
                    onLocationClick={onLocationClick}
                    onPollClick={onPollClick}
                    onEventClick={onEventClick}
                    onVideoNoteClick={onVideoNoteClick}
                    onStickerClick={handleStickerClick}
                    onGifClick={handleGifClick}
                    isGroup={isGroup}
                />
            )}

            {/* v2.0 Sticker Picker */}
            {showStickerPicker && (
                <div className={styles.emojiPickerWrapper}>
                    <StickerPicker onSelect={handleStickerSelect} onClose={() => setShowStickerPicker(false)} />
                </div>
            )}

            {/* v2.0 GIF Picker */}
            {showGifPicker && (
                <div className={styles.emojiPickerWrapper}>
                    <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} />
                </div>
            )}


            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
            />
        </div>
    );
};

export default MessageInputBar;
