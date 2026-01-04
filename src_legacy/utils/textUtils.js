/**
 * linkifyText - Parse text and convert @mentions, #hashtags, and URLs to clickable links
 * @param {string} text - Text to linkify
 * @returns {React.Element[]} Array of text and link elements
 */
export const linkifyText = (text) => {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const mentionRegex = /(@\w+)/g;
  const hashtagRegex = /(#\w+)/g;

  // Combine all patterns
  const combinedRegex = new RegExp(
    `${urlRegex.source}|${mentionRegex.source}|${hashtagRegex.source}`,
    'g'
  );

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedText = match[0];

    if (matchedText.startsWith('http')) {
      // URL
      parts.push(
        <a
          key={match.index}
          href={matchedText}
          target="_blank"
          rel="noopener noreferrer"
          className="link-url"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
        </a>
      );
    } else if (matchedText.startsWith('@')) {
      // Mention
      parts.push(
        <a
          key={match.index}
          href={`/profile/${matchedText.slice(1)}`}
          className="link-mention"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/profile/${matchedText.slice(1)}`;
          }}
        >
          {matchedText}
        </a>
      );
    } else if (matchedText.startsWith('#')) {
      // Hashtag
      parts.push(
        <a
          key={match.index}
          href={`/explore?tag=${matchedText.slice(1)}`}
          className="link-hashtag"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = `/explore?tag=${matchedText.slice(1)}`;
          }}
        >
          {matchedText}
        </a>
      );
    }

    lastIndex = match.index + matchedText.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

/**
 * truncateText - Truncate text to specified length with ellipsis
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * formatMention - Format a username as a mention
 */
export const formatMention = (username) => {
  return `@${username.replace(/^@/, '')}`;
};

/**
 * formatHashtag - Format text as a hashtag
 */
export const formatHashtag = (tag) => {
  return `#${tag.replace(/^#/, '')}`;
};

/**
 * extractMentions - Extract all mentions from text
 */
export const extractMentions = (text) => {
  if (!text) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

/**
 * extractHashtags - Extract all hashtags from text
 */
export const extractHashtags = (text) => {
  if (!text) return [];
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    hashtags.push(match[1]);
  }
  return hashtags;
};
