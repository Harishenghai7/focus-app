/**
 * Linkify - Convert URLs, mentions, and hashtags to clickable links
 * 
 * Converts plain text into HTML with clickable links for:
 * - URLs (http/https)
 * - Mentions (@username)
 * - Hashtags (#tag)
 * 
 * @param {string} text - Input text to linkify
 * @param {Object} options - Configuration options
 * @param {boolean} options.urls - Enable URL linking (default: true)
 * @param {boolean} options.mentions - Enable mention linking (default: true)
 * @param {boolean} options.hashtags - Enable hashtag linking (default: true)
 * @param {string} options.mentionPath - Base path for mentions (default: '/profile')
 * @param {string} options.hashtagPath - Base path for hashtags (default: '/explore')
 * @param {boolean} options.newTab - Open URLs in new tab (default: true)
 * @returns {string} HTML string with clickable links
 * 
 * @example
 * linkify("Check out https://example.com and @john #trending")
 * // Returns: 'Check out <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a> and <a href="/profile/john" class="mention">@john</a> <a href="/explore?tag=trending" class="hashtag">#trending</a>'
 */
export default function linkify(text, options = {}) {
  // Validate input
  if (typeof text !== 'string') {
    return '';
  }
  
  if (!text) {
    return '';
  }

  // Default options
  const config = {
    urls: true,
    mentions: true,
    hashtags: true,
    mentionPath: '/profile',
    hashtagPath: '/explore',
    newTab: true,
    ...options
  };

  let result = text;

  // Process in order: URLs first (to avoid conflicts), then mentions, then hashtags
  // Each function will handle HTML escaping for its respective parts
  
  // 1. Linkify URLs (http:// and https://)
  if (config.urls) {
    result = linkifyUrls(result, config.newTab);
  }

  // 2. Linkify Mentions (@username)
  if (config.mentions) {
    result = linkifyMentions(result, config.mentionPath);
  }

  // 3. Linkify Hashtags (#tag)
  if (config.hashtags) {
    result = linkifyHashtags(result, config.hashtagPath);
  }

  // 4. Finally, escape any remaining HTML that wasn't linkified
  result = escapeUnlinkedHtml(result);

  return result;
}

/**
 * Convert URLs to clickable links
 * Matches: http://, https://
 * Handles: query params, fragments, ports
 * @private
 */
function linkifyUrls(text, newTab = true) {
  // Enhanced URL regex that handles:
  // - http:// and https://
  // - domains with subdomains
  // - ports
  // - paths, query strings, and fragments
  // - Stops at spaces, quotes, angle brackets, and script tags
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  
  const target = newTab ? ' target="_blank" rel="noopener noreferrer"' : '';
  
  return text.replace(urlRegex, (url) => {
    // Clean up trailing punctuation that's not part of URL
    let cleanUrl = url;
    let trailingPunct = '';
    
    // Remove trailing punctuation (but keep it in the text)
    const punctMatch = cleanUrl.match(/([.,;:!?)\]]+)$/);
    if (punctMatch) {
      trailingPunct = punctMatch[1];
      cleanUrl = cleanUrl.slice(0, -trailingPunct.length);
    }
    
    // Escape special HTML characters in URL for safe href attribute
    const escapedUrl = escapeHtmlInUrl(cleanUrl);
    
    return `<a href="${escapedUrl}" class="link-url"${target}>${escapedUrl}</a>${trailingPunct}`;
  });
}

/**
 * Convert @mentions to clickable links
 * Matches: @username (alphanumeric and underscore)
 * Must be preceded by whitespace, punctuation, or start of string
 * @private
 */
function linkifyMentions(text, basePath = '/profile') {
  // Match @mentions that:
  // - Start with @
  // - Followed by alphanumeric characters or underscore
  // - Must be at start, preceded by whitespace, or certain punctuation
  // - Minimum 1 character after @
  const mentionRegex = /(^|[\s(])@(\w+)/g;
  
  return text.replace(mentionRegex, (match, prefix, username) => {
    // Encode username for URL
    const escapedUsername = encodeURIComponent(username);
    // Escape for HTML attributes
    const escapedUsernameHtml = escapeHtml(username);
    
    return `${prefix}<a href="${basePath}/${escapedUsername}" class="mention" data-username="${escapedUsernameHtml}">@${escapedUsernameHtml}</a>`;
  });
}

/**
 * Convert #hashtags to clickable links
 * Matches: #tag (alphanumeric and underscore)
 * Must be preceded by whitespace or start of string
 * @private
 */
function linkifyHashtags(text, basePath = '/explore') {
  // Match #hashtags that:
  // - Start with #
  // - Followed by alphanumeric characters or underscore
  // - Must be at start or preceded by whitespace
  // - Minimum 1 character after #
  const hashtagRegex = /(^|\s)#(\w+)/g;
  
  return text.replace(hashtagRegex, (match, prefix, tag) => {
    // Encode tag for URL
    const escapedTag = encodeURIComponent(tag);
    // Escape for HTML attributes
    const escapedTagHtml = escapeHtml(tag);
    
    return `${prefix}<a href="${basePath}?tag=${escapedTag}" class="hashtag" data-tag="${escapedTagHtml}">#${escapedTagHtml}</a>`;
  });
}

/**
 * Escape HTML special characters in URLs to prevent XSS
 * Note: Forward slashes are NOT escaped as they're part of valid URLs
 * @private
 */
function escapeHtmlInUrl(text) {
  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

/**
 * Escape HTML special characters to prevent XSS
 * @private
 */
function escapeHtml(text) {
  const htmlEscapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;'
  };
  
  return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

/**
 * Escape HTML in text that's outside of anchor tags
 * This is used after linkification to escape any remaining HTML
 * @private
 */
function escapeUnlinkedHtml(text) {
  // Split by anchor tags and escape only the non-anchor parts
  const parts = text.split(/(<a\b[^>]*>.*?<\/a>)/gi);
  
  return parts.map((part, index) => {
    // Keep anchor tags as-is (odd indices after split)
    if (part.match(/^<a\b[^>]*>.*?<\/a>$/i)) {
      return part;
    }
    // Escape HTML in other parts
    return escapeHtml(part);
  }).join('');
}

/**
 * Extract all mentions from text
 * Helper function that returns array of mentioned usernames
 */
export function extractMentions(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  
  return matches ? matches.map(m => m.slice(1)) : [];
}

/**
 * Extract all hashtags from text
 * Helper function that returns array of hashtag values
 */
export function extractHashtags(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const hashtagRegex = /#(\w+)/g;
  const matches = text.match(hashtagRegex);
  
  return matches ? matches.map(m => m.slice(1)) : [];
}

/**
 * Extract all URLs from text
 * Helper function that returns array of URLs
 */
export function extractUrls(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const matches = text.match(urlRegex);
  
  return matches || [];
}

/**
 * Strip all HTML tags from text
 * Useful for cleaning linkified text
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') {
    return html || '';
  }
  
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Check if text contains any linkable content
 */
export function hasLinkableContent(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
  const mentionRegex = /@(\w+)/g;
  const hashtagRegex = /#(\w+)/g;
  
  return urlRegex.test(text) || mentionRegex.test(text) || hashtagRegex.test(text);
}
