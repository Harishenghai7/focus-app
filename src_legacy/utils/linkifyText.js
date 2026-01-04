/**
 * Convert text with @mentions and #hashtags into clickable links
 * @param {string} text - The text to linkify
 * @param {Function} onMentionClick - Callback for mention clicks
 * @param {Function} onHashtagClick - Callback for hashtag clicks
 * @returns {Array} - Array of React elements
 */
export const linkifyText = (text, onMentionClick, onHashtagClick) => {
  if (!text) return [];

  // Regex patterns
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Combined regex to match all patterns
  const combinedRegex = /(@[a-zA-Z0-9_]+)|(#[a-zA-Z0-9_]+)|(https?:\/\/[^\s]+)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      });
    }

    // Determine match type and add appropriate element
    if (match[0].startsWith('@')) {
      const username = match[0].slice(1);
      parts.push({
        type: 'mention',
        content: match[0],
        username,
        onClick: () => onMentionClick && onMentionClick(username)
      });
    } else if (match[0].startsWith('#')) {
      const hashtag = match[0].slice(1);
      parts.push({
        type: 'hashtag',
        content: match[0],
        hashtag,
        onClick: () => onHashtagClick && onHashtagClick(hashtag)
      });
    } else if (match[0].startsWith('http')) {
      parts.push({
        type: 'url',
        content: match[0],
        url: match[0]
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({
      type: 'text',
      content: text.slice(lastIndex)
    });
  }

  return parts;
};

/**
 * Extract all mentions from text
 * @param {string} text - The text to extract mentions from
 * @returns {Array<string>} - Array of usernames (without @)
 */
export const extractMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return [...new Set(mentions)]; // Remove duplicates
};

/**
 * Extract all hashtags from text
 * @param {string} text - The text to extract hashtags from
 * @returns {Array<string>} - Array of hashtags (without #)
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags = [];
  let match;
  
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  
  return [...new Set(hashtags)]; // Remove duplicates
};

export default linkifyText;
