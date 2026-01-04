const MAX_CAPTION_LENGTH = 2200;
const FORBIDDEN_WORDS = [
  // Add any forbidden words/phrases here
];

export const validateCaption = (caption) => {
  const errors = [];
  
  if (!caption || caption.trim().length === 0) {
    return { valid: true, errors: [], warnings: ['Caption is empty'] };
  }

  // Length validation
  if (caption.length > MAX_CAPTION_LENGTH) {
    errors.push(`Caption must be ${MAX_CAPTION_LENGTH} characters or less (currently ${caption.length})`);
  }

  // Forbidden words check
  const lowerCaption = caption.toLowerCase();
  const foundForbidden = FORBIDDEN_WORDS.filter(word => 
    lowerCaption.includes(word.toLowerCase())
  );

  if (foundForbidden.length > 0) {
    errors.push(`Caption contains forbidden words: ${foundForbidden.join(', ')}`);
  }

  // URL spam check (more than 3 URLs)
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = caption.match(urlPattern) || [];
  if (urls.length > 3) {
    errors.push('Caption contains too many URLs (max 3)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: [],
    length: caption.length,
    maxLength: MAX_CAPTION_LENGTH
  };
};

export const getCaptionCharCount = (caption) => {
  return {
    current: caption.length,
    max: MAX_CAPTION_LENGTH,
    remaining: MAX_CAPTION_LENGTH - caption.length,
    percentage: (caption.length / MAX_CAPTION_LENGTH) * 100
  };
};
