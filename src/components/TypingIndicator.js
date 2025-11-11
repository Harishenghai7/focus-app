import React from 'react';
import './TypingIndicator.css';

export default function TypingIndicator({ username }) {
  return (
    <div className="typing-indicator">
      <span className="typing-username">{username} is typing</span>
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
