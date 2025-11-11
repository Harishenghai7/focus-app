/**
 * Content Parser - Parse and linkify hashtags and mentions in text
 */

/**
 * Parse text and convert hashtags and mentions to clickable links
 * @param {string} text - Text to parse
 * @param {Object} options - Parsing options
 * @returns {Array} - Array of text segments and link objects
 */
export const parseContent = (text, options = {}) => {
  if (!text) return [];

  const {
    onHashtagClick = null,
    onMentionClick = null,
    hashtagClassName = 'hashtag-link',
    mentionClassName = 'mention-link'
  } = options;

  const segments = [];
  let lastIndex = 0;

  // Combined regex for hashtags and mentions
  const regex = /(#[\w]+)|(@[\w]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match (including spaces)
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      if (textBefore) {
        segments.push({
          type: 'text',
          content: textBefore
        });
      }
    }

    // Add the hashtag or mention
    const fullMatch = match[0];
    if (fullMatch.startsWith('#')) {
      segments.push({
        type: 'hashtag',
        content: fullMatch,
        tag: fullMatch.slice(1),
        className: hashtagClassName,
        onClick: onHashtagClick
      });
    } else if (fullMatch.startsWith('@')) {
      segments.push({
        type: 'mention',
        content: fullMatch,
        username: fullMatch.slice(1),
        className: mentionClassName,
        onClick: onMentionClick
      });
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    const remaining = text.slice(lastIndex);
    if (remaining) {
      segments.push({
        type: 'text',
        content: remaining
      });
    }
  }

  return segments;
};

/**
 * Convert parsed segments to React elements
 * @param {Array} segments - Parsed segments
 * @returns {Array} - Array of React elements
 */
export const segmentsToReact = (segments) => {
  return segments.map((segment, index) => {
    if (segment.type === 'text') {
      return segment.content;
    } else if (segment.type === 'hashtag') {
      return (
        <span
          key={index}
          className={segment.className}
          onClick={() => segment.onClick && segment.onClick(segment.tag)}
          style={{ cursor: segment.onClick ? 'pointer' : 'default' }}
        >
          {segment.content}
        </span>
      );
    } else if (segment.type === 'mention') {
      return (
        <span
          key={index}
          className={segment.className}
          onClick={() => segment.onClick && segment.onClick(segment.username)}
          style={{ cursor: segment.onClick ? 'pointer' : 'default' }}
        >
          {segment.content}
        </span>
      );
    }
    return null;
  });
};

/**
 * Extract all hashtags from text
 * @param {string} text - Text to extract from
 * @returns {Array<string>} - Array of hashtag names (without #)
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  const matches = text.match(/#[\w]+/g);
  return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
};

/**
 * Extract all mentions from text
 * @param {string} text - Text to extract from
 * @returns {Array<string>} - Array of usernames (without @)
 */
export const extractMentions = (text) => {
  if (!text) return [];
  const matches = text.match(/@[\w]+/g);
  return matches ? matches.map(mention => mention.slice(1)) : [];
};

/**
 * Highlight hashtags and mentions in text with HTML
 * @param {string} text - Text to highlight
 * @returns {string} - HTML string with highlighted content
 */
export const highlightContent = (text) => {
  if (!text) return '';

  return text
    .replace(/#([\w]+)/g, '<span class="hashtag-highlight">#$1</span>')
    .replace(/@([\w]+)/g, '<span class="mention-highlight">@$1</span>');
};

/**
 * Validate hashtag format
 * @param {string} hashtag - Hashtag to validate (with or without #)
 * @returns {boolean} - Whether hashtag is valid
 */
export const isValidHashtag = (hashtag) => {
  const tag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
  return /^[\w]+$/.test(tag) && tag.length > 0 && tag.length <= 50;
};

/**
 * Validate mention format
 * @param {string} mention - Mention to validate (with or without @)
 * @returns {boolean} - Whether mention is valid
 */
export const isValidMention = (mention) => {
  const username = mention.startsWith('@') ? mention.slice(1) : mention;
  return /^[\w]+$/.test(username) && username.length > 0 && username.length <= 30;
};

/**
 * Count hashtags and mentions in text
 * @param {string} text - Text to count from
 * @returns {Object} - Object with counts
 */
export const countContentElements = (text) => {
  return {
    hashtags: extractHashtags(text).length,
    mentions: extractMentions(text).length,
    characters: text.length,
    words: text.trim().split(/\s+/).filter(Boolean).length
  };
};

/**
 * Truncate text while preserving hashtags and mentions
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateContent = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;

  const segments = parseContent(text);
  let result = '';
  let length = 0;

  for (const segment of segments) {
    if (length + segment.content.length <= maxLength) {
      result += segment.content;
      length += segment.content.length;
    } else {
      const remaining = maxLength - length;
      if (remaining > 3) {
        result += segment.content.slice(0, remaining - 3) + '...';
      } else {
        result += '...';
      }
      break;
    }
  }

  return result;
};
