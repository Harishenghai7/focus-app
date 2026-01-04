/**
 * Input Sanitization Middleware
 * Provides comprehensive input sanitization to prevent XSS, SQL injection, and other attacks
 */

import { sanitizeHtml, sanitizeSqlInput } from './validation';

/**
 * Sanitize object recursively
 * @param {any} obj - Object to sanitize
 * @param {Object} options - Sanitization options
 * @returns {any} Sanitized object
 */
export const sanitizeObject = (obj, options = {}) => {
  const {
    allowHtml = false,
    maxDepth = 10,
    currentDepth = 0
  } = options;

  // Prevent infinite recursion
  if (currentDepth >= maxDepth) {
    return obj;
  }

  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return sanitizeHtml(obj);
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, { ...options, currentDepth: currentDepth + 1 }));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        // Sanitize the key as well
        const sanitizedKey = sanitizeSqlInput(key);
        sanitized[sanitizedKey] = sanitizeObject(obj[key], { ...options, currentDepth: currentDepth + 1 });
      }
    }
    return sanitized;
  }

  // Return other types as-is (numbers, booleans, etc.)
  return obj;
};

/**
 * Sanitize form data
 * @param {FormData|Object} formData - Form data to sanitize
 * @returns {Object} Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  const sanitized = {};

  if (formData instanceof FormData) {
    for (const [key, value] of formData.entries()) {
      const sanitizedKey = sanitizeHtml(key);
      
      // Don't sanitize file objects
      if (value instanceof File) {
        sanitized[sanitizedKey] = value;
      } else {
        sanitized[sanitizedKey] = typeof value === 'string' ? sanitizeHtml(value) : value;
      }
    }
  } else {
    // Handle plain objects
    for (const key in formData) {
      if (formData.hasOwnProperty(key)) {
        const sanitizedKey = sanitizeHtml(key);
        const value = formData[key];
        
        if (value instanceof File) {
          sanitized[sanitizedKey] = value;
        } else if (typeof value === 'string') {
          sanitized[sanitizedKey] = sanitizeHtml(value);
        } else {
          sanitized[sanitizedKey] = sanitizeObject(value);
        }
      }
    }
  }

  return sanitized;
};

/**
 * Sanitize URL parameters
 * @param {URLSearchParams|Object} params - URL parameters to sanitize
 * @returns {Object} Sanitized parameters
 */
export const sanitizeUrlParams = (params) => {
  const sanitized = {};

  if (params instanceof URLSearchParams) {
    for (const [key, value] of params.entries()) {
      sanitized[sanitizeSqlInput(key)] = sanitizeSqlInput(value);
    }
  } else {
    for (const key in params) {
      if (params.hasOwnProperty(key)) {
        sanitized[sanitizeSqlInput(key)] = sanitizeSqlInput(params[key]);
      }
    }
  }

  return sanitized;
};

/**
 * Sanitize JSON data
 * @param {string} jsonString - JSON string to sanitize
 * @returns {Object} Sanitized parsed JSON
 */
export const sanitizeJson = (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    return sanitizeObject(parsed);
  } catch (error) {
    console.error('Invalid JSON:', error);
    return null;
  }
};

/**
 * Remove dangerous characters from filename
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  return filename
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
    // Remove dangerous characters
    .replace(/[<>:"|?*]/g, '')
    // Limit length
    .substring(0, 255)
    // Ensure it's not empty
    .trim() || 'unnamed_file';
};

/**
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
export const escapeRegex = (string) => {
  if (!string || typeof string !== 'string') return '';
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Sanitize search query
 * @param {string} query - Search query to sanitize
 * @returns {string} Sanitized query
 */
export const sanitizeSearchQuery = (query) => {
  if (!query || typeof query !== 'string') return '';

  return query
    // Remove SQL injection attempts
    .replace(/['";\\]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    // Remove XSS attempts
    .replace(/<script/gi, '')
    .replace(/<\/script>/gi, '')
    // Trim and limit length
    .trim()
    .substring(0, 200);
};

/**
 * Validate and sanitize email
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';

  return email
    .toLowerCase()
    .trim()
    // Remove dangerous characters
    .replace(/[<>'"]/g, '')
    // Limit length
    .substring(0, 254); // RFC 5321
};

/**
 * Sanitize caption with hashtags and mentions
 * @param {string} caption - Caption to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {Object} Sanitized caption with extracted hashtags and mentions
 */
export const sanitizeCaption = (caption, maxLength = 500) => {
  if (!caption || typeof caption !== 'string') {
    return {
      sanitized: '',
      hashtags: [],
      mentions: []
    };
  }

  // Sanitize HTML but preserve hashtags and mentions
  let sanitized = caption
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .substring(0, maxLength);

  // Extract hashtags
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  const hashtags = [];
  let match;
  while ((match = hashtagRegex.exec(sanitized)) !== null) {
    hashtags.push(match[1].toLowerCase());
  }

  // Extract mentions
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  const mentions = [];
  while ((match = mentionRegex.exec(sanitized)) !== null) {
    mentions.push(match[1].toLowerCase());
  }

  return {
    sanitized,
    hashtags: [...new Set(hashtags)], // Remove duplicates
    mentions: [...new Set(mentions)]
  };
};

/**
 * Sanitize user bio
 * @param {string} bio - Bio to sanitize
 * @returns {string} Sanitized bio
 */
export const sanitizeBio = (bio) => {
  if (!bio || typeof bio !== 'string') return '';

  return sanitizeHtml(bio)
    .trim()
    .substring(0, 150); // Bio character limit
};

/**
 * Sanitize username
 * @param {string} username - Username to sanitize
 * @returns {string} Sanitized username
 */
export const sanitizeUsername = (username) => {
  if (!username || typeof username !== 'string') return '';

  return username
    .toLowerCase()
    .trim()
    // Only allow alphanumeric and underscore
    .replace(/[^a-z0-9_]/g, '')
    // Limit length
    .substring(0, 30);
};

/**
 * Create a sanitization middleware for API requests
 * @param {Object} options - Middleware options
 * @returns {Function} Middleware function
 */
export const createSanitizationMiddleware = (options = {}) => {
  return (data) => {
    const {
      sanitizeBody = true,
      sanitizeParams = true,
      sanitizeQuery = true,
      allowHtml = false
    } = options;

    const sanitized = { ...data };

    if (sanitizeBody && data.body) {
      sanitized.body = sanitizeObject(data.body, { allowHtml });
    }

    if (sanitizeParams && data.params) {
      sanitized.params = sanitizeUrlParams(data.params);
    }

    if (sanitizeQuery && data.query) {
      sanitized.query = sanitizeUrlParams(data.query);
    }

    return sanitized;
  };
};

/**
 * Detect potential XSS attempts
 * @param {string} input - Input to check
 * @returns {boolean} True if potential XSS detected
 */
export const detectXSS = (input) => {
  if (!input || typeof input !== 'string') return false;

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];

  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Detect potential SQL injection attempts
 * @param {string} input - Input to check
 * @returns {boolean} True if potential SQL injection detected
 */
export const detectSQLInjection = (input) => {
  if (!input || typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bOR\b.*=.*)/i,
    /('|")\s*(OR|AND)\s*('|")/i,
    /--/,
    /\/\*/,
    /xp_/i,
    /sp_/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Log security violations
 * @param {string} type - Type of violation
 * @param {string} input - Input that triggered violation
 * @param {Object} context - Additional context
 */
export const logSecurityViolation = (type, input, context = {}) => {
  const violation = {
    type,
    input: input?.substring(0, 100), // Limit logged input
    timestamp: new Date().toISOString(),
    ...context
  };

  console.warn('🚨 Security Violation Detected:', violation);

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production' && window.analytics) {
    window.analytics.track('security_violation', violation);
  }
};

export default {
  sanitizeObject,
  sanitizeFormData,
  sanitizeUrlParams,
  sanitizeJson,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeEmail,
  sanitizeCaption,
  sanitizeBio,
  sanitizeUsername,
  escapeRegex,
  createSanitizationMiddleware,
  detectXSS,
  detectSQLInjection,
  logSecurityViolation
};
