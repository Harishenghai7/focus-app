/**
 * CaptionEditor Component
 * Advanced caption editing with hashtags, mentions, emojis
 */

import React, { useState, useRef } from 'react';
import './CaptionEditor.css';

const CaptionEditor = ({ value = '', onChange, maxLength = 2200 }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef(null);

  // Common emojis
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
    '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛',
    '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
    '⭐', '🌟', '✨', '⚡', '☄️', '💫', '🔥', '💧', '🌊', '🎵',
    '🎶', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻',
    '🎬', '🎭', '🎨', '🎰', '🎲', '🎯', '🎳', '🎮', '🎴', '🃏',
    '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎫', '🎟️',
    '🔥', '⚡', '💯', '✅', '🎉', '🎊', '👏', '👍', '🙌', '💪',
  ];

  // Handle text change
  const handleChange = (e) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      setCursorPosition(e.target.selectionStart);
      
      // Check for @ or # mentions
      const words = newValue.slice(0, e.target.selectionStart).split(/\s/);
      const lastWord = words[words.length - 1];
      
      if (lastWord.startsWith('@') || lastWord.startsWith('#')) {
        // Fetch suggestions
        fetchSuggestions(lastWord);
      } else {
        setShowSuggestions(false);
      }
    }
  };

  // Fetch mention/hashtag suggestions
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setShowSuggestions(false);
      return;
    }

    // Mock suggestions - replace with actual API call
    if (query.startsWith('@')) {
      setSuggestions([
        { type: 'user', value: 'johndoe', name: 'John Doe', avatar: '/avatar1.jpg' },
        { type: 'user', value: 'janedoe', name: 'Jane Doe', avatar: '/avatar2.jpg' },
        { type: 'user', value: 'user123', name: 'User 123', avatar: '/avatar3.jpg' },
      ]);
      setShowSuggestions(true);
    } else if (query.startsWith('#')) {
      setSuggestions([
        { type: 'hashtag', value: 'photography', count: 15000 },
        { type: 'hashtag', value: 'photooftheday', count: 12000 },
        { type: 'hashtag', value: 'photo', count: 10000 },
      ]);
      setShowSuggestions(true);
    }
  };

  // Insert emoji
  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + emoji + value.substring(end);
    
    if (newValue.length <= maxLength) {
      onChange(newValue);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
    
    setShowEmojiPicker(false);
  };

  // Insert suggestion
  const insertSuggestion = (suggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = value.lastIndexOf(suggestion.type === 'user' ? '@' : '#', cursorPosition);
    const newValue = value.substring(0, start) + 
      (suggestion.type === 'user' ? `@${suggestion.value}` : `#${suggestion.value}`) + 
      ' ' + 
      value.substring(cursorPosition);
    
    onChange(newValue);
    setShowSuggestions(false);
    
    setTimeout(() => {
      const newPos = start + suggestion.value.length + 2;
      textarea.selectionStart = textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);
  };

  // Add popular hashtags
  const addHashtag = (tag) => {
    const newValue = value + (value && !value.endsWith(' ') ? ' ' : '') + `#${tag} `;
    if (newValue.length <= maxLength) {
      onChange(newValue);
      textareaRef.current?.focus();
    }
  };

  const remainingChars = maxLength - value.length;
  const isNearLimit = remainingChars < 100;
  const isAtLimit = remainingChars <= 0;

  return (
    <div className="caption-editor">
      <div className="caption-editor-header">
        <label className="caption-editor-label">Caption</label>
        <div className={`caption-counter ${isNearLimit ? 'warning' : ''} ${isAtLimit ? 'error' : ''}`}>
          {remainingChars}
        </div>
      </div>

      <div className="caption-editor-input-wrapper">
        <textarea
          ref={textareaRef}
          className="caption-editor-textarea"
          placeholder="Write a caption..."
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          rows={6}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="caption-suggestions">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="caption-suggestion-item"
                onClick={() => insertSuggestion(suggestion)}
              >
                {suggestion.type === 'user' ? (
                  <>
                    <img 
                      src={suggestion.avatar} 
                      alt={suggestion.name}
                      className="caption-suggestion-avatar"
                    />
                    <div className="caption-suggestion-info">
                      <div className="caption-suggestion-name">{suggestion.name}</div>
                      <div className="caption-suggestion-username">@{suggestion.value}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="caption-suggestion-icon">#</span>
                    <div className="caption-suggestion-info">
                      <div className="caption-suggestion-name">#{suggestion.value}</div>
                      <div className="caption-suggestion-count">
                        {suggestion.count.toLocaleString()} posts
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="caption-editor-toolbar">
        <button
          type="button"
          className="caption-tool-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          aria-label="Add emoji"
        >
          😊
        </button>
        <button
          type="button"
          className="caption-tool-button"
          onClick={() => {
            const pos = textareaRef.current?.selectionStart || value.length;
            onChange(value.substring(0, pos) + '#' + value.substring(pos));
            setTimeout(() => {
              textareaRef.current?.focus();
              if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos + 1;
              }
            }, 0);
          }}
          aria-label="Add hashtag"
        >
          #
        </button>
        <button
          type="button"
          className="caption-tool-button"
          onClick={() => {
            const pos = textareaRef.current?.selectionStart || value.length;
            onChange(value.substring(0, pos) + '@' + value.substring(pos));
            setTimeout(() => {
              textareaRef.current?.focus();
              if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos + 1;
              }
            }, 0);
          }}
          aria-label="Mention someone"
        >
          @
        </button>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-picker">
          <div className="emoji-picker-header">
            <span>Pick an emoji</span>
            <button
              className="emoji-picker-close"
              onClick={() => setShowEmojiPicker(false)}
              aria-label="Close emoji picker"
            >
              ✕
            </button>
          </div>
          <div className="emoji-grid">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                type="button"
                className="emoji-button"
                onClick={() => insertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Hashtags */}
      <div className="popular-hashtags">
        <div className="popular-hashtags-label">Popular:</div>
        <div className="popular-hashtags-list">
          {['love', 'instagood', 'photooftheday', 'fashion', 'beautiful', 'happy'].map(tag => (
            <button
              key={tag}
              type="button"
              className="popular-hashtag"
              onClick={() => addHashtag(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaptionEditor;
