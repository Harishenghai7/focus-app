export const parseHashtags = (text) => {
  if (!text) return [];
  
  // Match hashtags: # followed by letters, numbers, underscores
  const hashtagPattern = /#[\w\u0590-\u05ff\u0600-\u06ff\u0900-\u097f\u4e00-\u9fff]+/g;
  const matches = text.match(hashtagPattern);
  
  if (!matches) return [];
  
  // Remove duplicates and # symbol
  const uniqueTags = [...new Set(matches.map(tag => tag.slice(1)))];
  
  return uniqueTags;
};

export const highlightHashtags = (text, className = 'hashtag-highlight') => {
  if (!text) return text;
  
  const hashtagPattern = /(#[\w\u0590-\u05ff\u0600-\u06ff\u0900-\u097f\u4e00-\u9fff]+)/g;
  
  return text.split(hashtagPattern).map((part, index) => {
    if (part.match(hashtagPattern)) {
      return `<span class="${className}" key="${index}">${part}</span>`;
    }
    return part;
  }).join('');
};

export const validateHashtag = (tag) => {
  // Remove # if present
  const cleanTag = tag.startsWith('#') ? tag.slice(1) : tag;
  
  // Validation rules
  if (cleanTag.length === 0) return { valid: false, error: 'Hashtag cannot be empty' };
  if (cleanTag.length > 50) return { valid: false, error: 'Hashtag too long (max 50 characters)' };
  if (!/^[\w\u0590-\u05ff\u0600-\u06ff\u0900-\u097f\u4e00-\u9fff]+$/.test(cleanTag)) {
    return { valid: false, error: 'Hashtag contains invalid characters' };
  }
  
  return { valid: true, tag: cleanTag };
};
