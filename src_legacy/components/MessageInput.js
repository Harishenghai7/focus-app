import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import EmojiPicker from './EmojiPicker';
import VoiceRecorder from './VoiceRecorder';
import styles from './MessageInput.module.css';
import GifPicker from './GifPicker';

/**
 * MessageInput - Advanced message input with emoji, voice, and file attachments
 * @component
 * @param {function} onSend - Handler for sending text messages
 * @param {function} onVoiceSend - Handler for sending voice messages
 * @param {function} onFileSend - Handler for sending files
 * @param {boolean} disabled - Disable input
 * @returns {React.ReactElement}
 */
const MessageInput = React.memo(function MessageInput({ 
  onSend, 
  onVoiceSend, 
  onFileSend, 
  disabled = false 
}) {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      setShowEmojiPicker(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleGifSelect = (gif) => {
    // Insert selected GIF URL into the message
    setMessage(prev => (prev ? prev + ' ' : '') + (gif?.url || gif?.previewUrl || ''));
    setShowGifPicker(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleVoiceRecordingComplete = (blob, duration) => {
    setShowVoiceRecorder(false);
    if (onVoiceSend) {
      onVoiceSend(blob, duration);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileSend) {
      onFileSend(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={styles.messageInputContainer}>
      {showEmojiPicker && (
        <div className={styles.emojiPickerPopup}>
          <EmojiPicker onSelect={handleEmojiSelect} />
        </div>
      )}

      {showVoiceRecorder && (
        <div className={styles.voiceRecorderPopup}>
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}

      {/* GIF Picker Modal */}
      <GifPicker
        isOpen={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelect={handleGifSelect}
        provider="tenor"
      />

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,video/*"
          multiple
          style={{ display: 'none' }}
          aria-label="Upload images or videos"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={styles.iconButton}
          disabled={disabled}
          aria-label="Attach file"
          title="Attach image or video"
        >
          📎
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker(prev => !prev)}
          className={styles.iconButton}
          disabled={disabled}
          aria-label="Add emoji"
          title="Add emoji"
        >
          😊
        </button>

        {/* Open GIF picker */}
        <button
          type="button"
          onClick={() => setShowGifPicker(true)}
          className={styles.iconButton}
          disabled={disabled}
          aria-label="Insert GIF"
          title="Insert GIF"
        >
          GIF
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={styles.textarea}
          disabled={disabled}
          rows={1}
          aria-label="Message input"
        />

        {message.trim() ? (
          <button
            type="submit"
            className={styles.sendButton}
            disabled={disabled}
            aria-label="Send message"
            title="Send message"
          >
            ➤
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowVoiceRecorder(true)}
            className={styles.iconButton}
            disabled={disabled}
            aria-label="Record voice message"
            title="Record voice message"
          >
            🎤
          </button>
        )}
      </form>
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

MessageInput.propTypes = {
  onSend: PropTypes.func.isRequired,
  onVoiceSend: PropTypes.func,
  onFileSend: PropTypes.func,
  disabled: PropTypes.bool
};

export default MessageInput;
