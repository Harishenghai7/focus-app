import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { parseContent, segmentsToReact } from '../utils/contentParser';
import styles from './ParsedContent.module.css';

/**
 * ParsedContent - Renders parsed content with clickable hashtags and mentions.
 * @component
 * @param {string} text - Content text to parse
 * @param {function} [onHashtagClick] - Handler for hashtag click
 * @param {function} [onMentionClick] - Handler for mention click
 * @param {string} [className] - Optional CSS class
 * @returns {React.ReactElement}
 */
const ParsedContent = React.memo(function ParsedContent({ 
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
    hashtagClassName: styles.parsedHashtag,
    mentionClassName: styles.parsedMention
  });

  return (
    <span className={`${styles.parsedContent} ${className}`}>
      {segmentsToReact(segments)}
    </span>
  );
});

ParsedContent.displayName = 'ParsedContent';
ParsedContent.propTypes = {
  text: PropTypes.string.isRequired,
  onHashtagClick: PropTypes.func,
  onMentionClick: PropTypes.func,
  className: PropTypes.string
};

export default ParsedContent;
