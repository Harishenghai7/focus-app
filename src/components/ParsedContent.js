import React from 'react';
import { useNavigate } from 'react-router-dom';
import { parseContent, segmentsToReact } from '../utils/contentParser';
import './ParsedContent.css';

export default function ParsedContent({ 
  text, 
  onHashtagClick, 
  onMentionClick,
  className = '' 
}) {
  const navigate = useNavigate();

  const handleHashtagClick = (tag) => {
    if (onHashtagClick) {
      onHashtagClick(tag);
    } else {
      navigate(`/hashtag/${tag}`);
    }
  };

  const handleMentionClick = (username) => {
    if (onMentionClick) {
      onMentionClick(username);
    } else {
      navigate(`/profile/${username}`);
    }
  };

  const segments = parseContent(text, {
    onHashtagClick: handleHashtagClick,
    onMentionClick: handleMentionClick,
    hashtagClassName: 'parsed-hashtag',
    mentionClassName: 'parsed-mention'
  });

  return (
    <span className={`parsed-content ${className}`}>
      {segmentsToReact(segments)}
    </span>
  );
}
