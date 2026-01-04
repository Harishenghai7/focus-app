import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize user input to prevent XSS attacks
 * Uses DOMPurify for robust HTML sanitization with configurable options
 * 
 * @module sanitizeInput
 */

/**
 * Configuration for different sanitization levels
 */
const SANITIZE_CONFIGS = {
  // Strict: Strip all HTML tags
  strict: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  
  // Basic: Allow safe formatting tags
  basic: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  
  // Standard: Allow safe tags with limited attributes
  standard: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  },
  
  // Rich: Allow more formatting for rich text editors
  rich: {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'a', 'ul', 'ol', 'li', 
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
  }
};

/**
 * URL protocols that are considered safe
 */
const SAFE_URL_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:'];

/**
 * Patterns for detecting potentially dangerous content
 */
const DANGEROUS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  /<object[^>]*>[\s\S]*?<\/object>/gi,
  /<embed[^>]*>/gi,
  /<applet[^>]*>[\s\S]*?<\/applet>/gi,
];

/**
 * Main sanitization function with DOMPurify
 * 
 * @param {string} input - The input string to sanitize
 * @param {Object} options - Sanitization options
 * @param {string} options.level - Sanitization level: 'strict', 'basic', 'standard', 'rich'
 * @param {boolean} options.allowLinks - Whether to allow anchor tags (overrides level)
 * @param {Object} options.customConfig - Custom DOMPurify configuration
 * @returns {string} Sanitized string
 * 
 * @example
 * // Strict sanitization (removes all HTML)
 * sanitizeInput('<script>alert("xss")</script>Hello'); // Returns: 'Hello'
 * 
 * @example
 * // Basic sanitization (allows safe formatting)
 * sanitizeInput('<b>Bold</b> <script>bad</script>', { level: 'basic' }); // Returns: '<b>Bold</b> '
 * 
 * @example
 * // Standard with links
 * sanitizeInput('<a href="https://example.com">Link</a>', { level: 'standard' }); 
 * // Returns: '<a href="https://example.com">Link</a>'
 */
export default function sanitizeInput(input, options = {}) {
  // Handle non-string inputs
  if (typeof input !== 'string') {
    return '';
  }

  // Return empty string for null/undefined/empty
  if (!input || input.trim() === '') {
    return '';
  }

  const {
    level = 'standard',
    allowLinks = true,
    customConfig = null,
  } = options;

  // Get base configuration
  let config = customConfig || SANITIZE_CONFIGS[level] || SANITIZE_CONFIGS.standard;

  // Override link allowance if specified
  if (!allowLinks && config.ALLOWED_TAGS) {
    config = {
      ...config,
      ALLOWED_TAGS: config.ALLOWED_TAGS.filter(tag => tag !== 'a'),
    };
  }

  // Add security hooks to DOMPurify
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Ensure all links have safe attributes
    if (node.tagName === 'A') {
      // Add rel="noopener noreferrer" for security
      if (node.hasAttribute('target') && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
      
      // Validate href
      if (node.hasAttribute('href')) {
        const href = node.getAttribute('href');
        if (!isValidURL(href)) {
          node.removeAttribute('href');
        }
      }
    }

    // Remove data attributes unless explicitly allowed
    if (!config.ALLOW_DATA_ATTR) {
      [...node.attributes].forEach(attr => {
        if (attr.name.startsWith('data-')) {
          node.removeAttribute(attr.name);
        }
      });
    }
  });

  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(input, config);

  // Remove hooks after use
  DOMPurify.removeAllHooks();

  return sanitized;
}

/**
 * Sanitize plain text input (escape HTML entities)
 * Use this for inputs that should never contain HTML
 * 
 * @param {string} input - Input string
 * @returns {string} Escaped string
 * 
 * @example
 * sanitizePlainText('<script>alert("xss")</script>'); 
 * // Returns: '&lt;script&gt;alert("xss")&lt;/script&gt;'
 */
export function sanitizePlainText(input) {
  if (typeof input !== 'string') return '';
  
  return input.replace(/[<>&"']/g, (char) => {
    const entities = {
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return entities[char];
  });
}

/**
 * Sanitize and validate a URL
 * 
 * @param {string} url - URL to sanitize
 * @param {Object} options - Options
 * @param {Array<string>} options.allowedProtocols - Allowed URL protocols
 * @returns {string|null} Sanitized URL or null if invalid
 * 
 * @example
 * sanitizeURL('javascript:alert(1)'); // Returns: null
 * sanitizeURL('https://example.com'); // Returns: 'https://example.com'
 */
export function sanitizeURL(url, options = {}) {
  if (typeof url !== 'string' || !url.trim()) {
    return null;
  }

  const { allowedProtocols = SAFE_URL_PROTOCOLS } = options;

  try {
    // Handle relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }

    // Parse URL
    const parsed = new URL(url);

    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }

    // Remove javascript: and data: protocols
    if (parsed.protocol === 'javascript:' || parsed.protocol === 'data:') {
      return null;
    }

    return parsed.toString();
  } catch (error) {
    // Invalid URL
    return null;
  }
}

/**
 * Validate if a URL is safe
 * 
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe
 */
export function isValidURL(url) {
  return sanitizeURL(url) !== null;
}

/**
 * Remove all HTML tags from a string
 * 
 * @param {string} input - Input string
 * @returns {string} String without HTML tags
 * 
 * @example
 * stripHTML('<p>Hello <b>World</b></p>'); // Returns: 'Hello World'
 */
export function stripHTML(input) {
  return sanitizeInput(input, { level: 'strict' });
}

/**
 * Sanitize HTML for rich text content (posts, comments)
 * 
 * @param {string} html - HTML content
 * @returns {string} Sanitized HTML
 * 
 * @example
 * sanitizeRichText('<p>Hello</p><script>alert("xss")</script>'); 
 * // Returns: '<p>Hello</p>'
 */
export function sanitizeRichText(html) {
  return sanitizeInput(html, { level: 'rich' });
}

/**
 * Sanitize user bio or description
 * 
 * @param {string} text - Bio text
 * @returns {string} Sanitized bio
 */
export function sanitizeBio(text) {
  return sanitizeInput(text, { level: 'standard', allowLinks: true });
}

/**
 * Sanitize username or display name
 * Should contain no HTML
 * 
 * @param {string} name - Username
 * @returns {string} Sanitized username
 */
export function sanitizeUsername(name) {
  if (typeof name !== 'string') return '';
  
  // Remove all HTML and special characters except basic punctuation
  return name
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, '') // Remove HTML entities
    .trim()
    .substring(0, 50); // Limit length
}

/**
 * Sanitize search query
 * 
 * @param {string} query - Search query
 * @returns {string} Sanitized query
 */
export function sanitizeSearchQuery(query) {
  if (typeof query !== 'string') return '';
  
  return query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, '') // Remove special chars
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Check if input contains potentially dangerous patterns
 * 
 * @param {string} input - Input to check
 * @returns {boolean} True if dangerous patterns detected
 */
export function containsDangerousContent(input) {
  if (typeof input !== 'string') return false;
  
  return DANGEROUS_PATTERNS.some(pattern => {
    // Reset regex lastIndex to avoid state issues with global flag
    pattern.lastIndex = 0;
    return pattern.test(input);
  });
}

/**
 * Sanitize object with multiple string fields
 * 
 * @param {Object} obj - Object to sanitize
 * @param {Object} fieldConfig - Configuration for each field
 * @returns {Object} Sanitized object
 * 
 * @example
 * sanitizeObject(
 *   { title: '<b>Title</b>', content: '<script>bad</script>' },
 *   { title: { level: 'basic' }, content: { level: 'standard' } }
 * );
 */
export function sanitizeObject(obj, fieldConfig = {}) {
  if (!obj || typeof obj !== 'object') return {};
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const config = fieldConfig[key] || { level: 'standard' };
      sanitized[key] = sanitizeInput(value, config);
    } else if (value !== null && typeof value === 'object') {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value, fieldConfig[key] || {});
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize array of strings
 * 
 * @param {Array<string>} arr - Array to sanitize
 * @param {Object} options - Sanitization options
 * @returns {Array<string>} Sanitized array
 */
export function sanitizeArray(arr, options = {}) {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .filter(item => typeof item === 'string')
    .map(item => sanitizeInput(item, options));
}

/**
 * Batch sanitize multiple inputs with different configs
 * 
 * @param {Object} inputs - Object with inputs to sanitize
 * @returns {Object} Object with sanitized values
 * 
 * @example
 * batchSanitize({
 *   username: { value: '<b>John</b>', type: 'username' },
 *   bio: { value: '<p>Hello</p>', type: 'bio' },
 *   content: { value: '<b>Post</b>', type: 'richText' }
 * });
 */
export function batchSanitize(inputs) {
  const sanitized = {};
  
  for (const [key, config] of Object.entries(inputs)) {
    const { value, type = 'standard' } = config;
    
    switch (type) {
      case 'username':
        sanitized[key] = sanitizeUsername(value);
        break;
      case 'bio':
        sanitized[key] = sanitizeBio(value);
        break;
      case 'richText':
        sanitized[key] = sanitizeRichText(value);
        break;
      case 'plainText':
        sanitized[key] = sanitizePlainText(value);
        break;
      case 'url':
        sanitized[key] = sanitizeURL(value);
        break;
      case 'search':
        sanitized[key] = sanitizeSearchQuery(value);
        break;
      default:
        sanitized[key] = sanitizeInput(value, { level: type });
    }
  }
  
  return sanitized;
}

// Re-export default with named export for flexibility
export { sanitizeInput };
