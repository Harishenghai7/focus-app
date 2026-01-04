import React, { useState, useRef, useEffect } from 'react';
import { validateCaption, getCaptionCharCount } from '../utils/validateCaption';
import { parseHashtags } from '../utils/parseHashtags';
import { parseMentions } from '../utils/parseMentions';
import './CaptionInput.css';

const EMOJI_SHORTCUTS = ['😊', '❤️', '🔥', '✨', '💯', '🎉', '👏', '🙌', '💪', '🌟'];

const CaptionInput = ({ value, onChange, placeholder = 'Write a caption...' }) => {
  const textareaRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [charCount, setCharCount] = useState(getCaptionCharCount(value));
  const [validation, setValidation] = useState({ valid: true, errors: [], warnings: [] });
  const [hashtags, setHashtags] = useState([]);
  const [mentions, setMentions] = useState([]);

  useEffect(() => {
    const count = getCaptionCharCount(value);
    const validationResult = validateCaption(value);
    const extractedHashtags = parseHashtags(value);
    const extractedMentions = parseMentions(value);

    setCharCount(count);
    setValidation(validationResult);
    setHashtags(extractedHashtags);
    setMentions(extractedMentions);
  }, [value]);

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    onChange(newValue);
    
    // Reset cursor position after emoji
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
      textarea.focus();
    }, 0);
  };

  const insertHashtag = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + '#' + value.substring(start);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      textarea.focus();
    }, 0);
  };

  const insertMention = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newValue = value.substring(0, start) + '@' + value.substring(start);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 1;
      textarea.focus();
    }, 0);
  };

  const getCharCountColor = () => {
    if (charCount.percentage >= 95) return '#ff3b30';
    if (charCount.percentage >= 85) return '#ff9500';
    return 'rgba(139, 127, 215, 0.6)';
  };

  return (
    <div className="caption-input-container">
      <div className="caption-header">
        <h3>Caption</h3>
        <div 
          className="char-counter"
          style={{ color: getCharCountColor() }}
          aria-live="polite"
        >
          {charCount.current} / {charCount.max}
        </div>
      </div>

      <div className="caption-textarea-wrapper">
        <textarea
          ref={textareaRef}
          className={`caption-textarea ${!validation.valid ? 'error' : ''}`}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={charCount.max}
          rows={6}
          aria-label="Caption"
          aria-describedby="caption-validation"
        />

        <div className="caption-toolbar">
          <div className="toolbar-actions">
            <button
              type="button"
              className="toolbar-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Add emoji"
              title="Add emoji"
            >
              😊
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={insertHashtag}
              aria-label="Add hashtag"
              title="Add hashtag"
            >
              #
            </button>
            <button
              type="button"
              className="toolbar-btn"
              onClick={insertMention}
              aria-label="Mention user"
              title="Mention user"
            >
              @
            </button>
          </div>
        </div>

        {showEmojiPicker && (
          <div className="emoji-picker-panel">
            <div className="emoji-grid">
              {EMOJI_SHORTCUTS.map((emoji, index) => (
                <button
                  key={index}
                  type="button"
                  className="emoji-btn"
                  onClick={() => insertEmoji(emoji)}
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!validation.valid && validation.errors.length > 0 && (
        <div className="caption-validation-errors" id="caption-validation" role="alert">
          {validation.errors.map((error, index) => (
            <div key={index} className="validation-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          ))}
        </div>
      )}

      {(hashtags.length > 0 || mentions.length > 0) && (
        <div className="caption-meta">
          {hashtags.length > 0 && (
            <div className="meta-section">
              <span className="meta-label">Hashtags:</span>
              <div className="meta-tags">
                {hashtags.slice(0, 5).map((tag, index) => (
                  <span key={index} className="meta-tag hashtag">
                    #{tag}
                  </span>
                ))}
                {hashtags.length > 5 && (
                  <span className="meta-tag-more">+{hashtags.length - 5} more</span>
                )}
              </div>
            </div>
          )}
          
          {mentions.length > 0 && (
            <div className="meta-section">
              <span className="meta-label">Mentions:</span>
              <div className="meta-tags">
                {mentions.slice(0, 5).map((mention, index) => (
                  <span key={index} className="meta-tag mention">
                    @{mention}
                  </span>
                ))}
                {mentions.length > 5 && (
                  <span className="meta-tag-more">+{mentions.length - 5} more</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaptionInput;
