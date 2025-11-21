export const parseMentions = (text) => {
  if (!text) return [];
  
  // Match mentions: @ followed by letters, numbers, underscores, dots
  const mentionPattern = /@[\w.]+/g;
  const matches = text.match(mentionPattern);
  
  if (!matches) return [];
  
  // Remove duplicates and @ symbol
  const uniqueMentions = [...new Set(matches.map(mention => mention.slice(1)))];
  
  return uniqueMentions;
};

export const highlightMentions = (text, className = 'mention-highlight') => {
  if (!text) return text;
  
  const mentionPattern = /(@[\w.]+)/g;
  
  return text.split(mentionPattern).map((part, index) => {
    if (part.match(mentionPattern)) {
      return `<span class="${className}" key="${index}">${part}</span>`;
    }
    return part;
  }).join('');
};

export const validateMention = (mention) => {
  // Remove @ if present
  const cleanMention = mention.startsWith('@') ? mention.slice(1) : mention;
  
  // Validation rules
  if (cleanMention.length === 0) return { valid: false, error: 'Mention cannot be empty' };
  if (cleanMention.length > 30) return { valid: false, error: 'Username too long (max 30 characters)' };
  if (!/^[\w.]+$/.test(cleanMention)) {
    return { valid: false, error: 'Username contains invalid characters' };
  }
  
  return { valid: true, mention: cleanMention };
};

export const formatTextWithHighlights = (text) => {
  if (!text) return '';
  
  let formatted = text;
  
  // Highlight hashtags
  formatted = formatted.replace(
    /(#[\w\u0590-\u05ff\u0600-\u06ff\u0900-\u097f\u4e00-\u9fff]+)/g,
    '<span class="text-hashtag">$1</span>'
  );
  
  // Highlight mentions
  formatted = formatted.replace(
    /(@[\w.]+)/g,
    '<span class="text-mention">$1</span>'
  );
  
  return formatted;
};
