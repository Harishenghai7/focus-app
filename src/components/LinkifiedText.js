import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LinkifiedText.css';

export default function LinkifiedText({ text, className = '' }) {
  const navigate = useNavigate();

  if (!text) return null;

  const parseText = (text) => {
    // Regex patterns
    const mentionRegex = /@(\w+)/g;
    const hashtagRegex = /#(\w+)/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Split text by all patterns
    const parts = [];
    let lastIndex = 0;
    
    // Combined regex to find all matches
    const combinedRegex = /(@\w+)|(#\w+)|(https?:\/\/[^\s]+)/g;
    let match;

    while ((match = combinedRegex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index)
        });
      }

      // Add matched element
      if (match[1]) {
        // Mention
        parts.push({
          type: 'mention',
          content: match[1],
          username: match[1].substring(1)
        });
      } else if (match[2]) {
        // Hashtag
        parts.push({
          type: 'hashtag',
          content: match[2],
          tag: match[2].substring(1)
        });
      } else if (match[3]) {
        // URL
        parts.push({
          type: 'url',
          content: match[3]
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex)
      });
    }

    return parts;
  };

  const handleMentionClick = (e, username) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/profile/${username}`);
  };

  const handleHashtagClick = (e, tag) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/hashtag/${tag}`);
  };

  const handleUrlClick = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const parts = parseText(text);

  return (
    <span className={`linkified-text ${className}`}>
      {parts.map((part, index) => {
        switch (part.type) {
          case 'mention':
            return (
              <span
                key={index}
                className="linkified-mention"
                onClick={(e) => handleMentionClick(e, part.username)}
              >
                {part.content}
              </span>
            );
          case 'hashtag':
            return (
              <span
                key={index}
                className="linkified-hashtag"
                onClick={(e) => handleHashtagClick(e, part.tag)}
              >
                {part.content}
              </span>
            );
          case 'url':
            return (
              <span
                key={index}
                className="linkified-url"
                onClick={(e) => handleUrlClick(e, part.content)}
              >
                {part.content}
              </span>
            );
          default:
            return <span key={index}>{part.content}</span>;
        }
      })}
    </span>
  );
}
