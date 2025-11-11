/**
 * Validation utilities for Focus application
 * Provides comprehensive validation for user inputs
 */

/**
 * Password strength requirements
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '@$!%*?&#^()_+=[]{}|;:,.<>/-'
};

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
};

/**
 * Validates password strength according to requirements
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid flag and details
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      strength: 0,
      score: 0,
      feedback: ['Password is required'],
      requirements: {
        minLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecialChar: false
      }
    };
  }

  const requirements = {
    minLength: password.length >= PASSWORD_REQUIREMENTS.minLength,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: new RegExp(`[${PASSWORD_REQUIREMENTS.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(password)
  };

  const feedback = [];
  if (!requirements.minLength) {
    feedback.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }
  if (!requirements.hasUppercase) {
    feedback.push('One uppercase letter (A-Z)');
  }
  if (!requirements.hasLowercase) {
    feedback.push('One lowercase letter (a-z)');
  }
  if (!requirements.hasNumber) {
    feedback.push('One number (0-9)');
  }
  if (!requirements.hasSpecialChar) {
    feedback.push('One special character (@$!%*?&...)');
  }

  // Calculate strength score (0-5)
  let score = 0;
  if (requirements.minLength) score++;
  if (password.length >= 12) score++; // Bonus for longer passwords
  if (requirements.hasUppercase && requirements.hasLowercase) score++;
  if (requirements.hasNumber) score++;
  if (requirements.hasSpecialChar) score++;

  // Determine strength level
  let strength = 'weak';
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';

  const isValid = Object.values(requirements).every(req => req === true);

  return {
    isValid,
    strength,
    score,
    feedback,
    requirements
  };
};

/**
 * Gets password strength color for UI display
 * @param {string} strength - Strength level ('weak', 'medium', 'strong')
 * @returns {string} Color code
 */
export const getPasswordStrengthColor = (strength) => {
  const colors = {
    weak: '#ef4444',
    medium: '#f59e0b',
    strong: '#10b981'
  };
  return colors[strength] || colors.weak;
};

/**
 * Gets password strength label for UI display
 * @param {string} strength - Strength level
 * @returns {string} Display label
 */
export const getPasswordStrengthLabel = (strength) => {
  const labels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong'
  };
  return labels[strength] || 'Weak';
};

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return {
      isValid: false,
      feedback: 'Username is required'
    };
  }

  const trimmed = username.trim();
  
  // 3-30 chars, alphanumeric and underscore only
  const regex = /^[a-zA-Z0-9_]{3,30}$/;
  
  if (trimmed.length < 3) {
    return {
      isValid: false,
      feedback: 'Username must be at least 3 characters'
    };
  }
  
  if (trimmed.length > 30) {
    return {
      isValid: false,
      feedback: 'Username must be 30 characters or less'
    };
  }
  
  if (!regex.test(trimmed)) {
    return {
      isValid: false,
      feedback: 'Username can only contain letters, numbers, and underscores'
    };
  }

  return {
    isValid: true,
    feedback: ''
  };
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param {string} value - HTML string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeHtml = (value) => {
  if (!value || typeof value !== 'string') return '';
  
  return value
    // Remove script tags (both complete and incomplete)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<script[^>]*>/gi, '')
    .replace(/<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+="[^"]*"/g, '')
    .replace(/on\w+='[^']*'/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<iframe[^>]*>/gi, '')
    // Remove object and embed tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    // Remove style tags (can contain javascript)
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove link tags
    .replace(/<link\b[^<]*>/gi, '');
};

/**
 * Sanitizes user input for SQL injection prevention
 * @param {string} value - Input string to sanitize
 * @returns {string} Sanitized string
 */
export const sanitizeSqlInput = (value) => {
  if (!value || typeof value !== 'string') return '';
  
  // Remove SQL keywords and dangerous characters
  return value
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, '') // Remove multi-line comment end
    .replace(/xp_/gi, '') // Remove extended stored procedures
    .replace(/sp_/gi, '') // Remove stored procedures
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TABLE)\b/gi, '') // Remove SQL keywords
    .trim();
};

/**
 * Validates and sanitizes caption/bio text
 * @param {string} text - Text to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {Object} Validation result
 */
export const validateText = (text, maxLength = 500) => {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      feedback: 'Text is required'
    };
  }

  const trimmed = text.trim();
  
  if (trimmed.length === 0) {
    return {
      isValid: false,
      sanitized: '',
      feedback: 'Text cannot be empty'
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      sanitized: trimmed.substring(0, maxLength),
      feedback: `Text must be ${maxLength} characters or less`
    };
  }

  // Sanitize the text
  const sanitized = sanitizeHtml(trimmed);

  return {
    isValid: true,
    sanitized,
    feedback: '',
    length: sanitized.length
  };
};

/**
 * Validates URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result
 */
export const validateUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      feedback: 'URL is required'
    };
  }

  try {
    const urlObj = new URL(url);
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        feedback: 'Only HTTP and HTTPS URLs are allowed'
      };
    }

    return {
      isValid: true,
      feedback: '',
      protocol: urlObj.protocol,
      hostname: urlObj.hostname
    };
  } catch (error) {
    return {
      isValid: false,
      feedback: 'Invalid URL format'
    };
  }
};

/**
 * Validates phone number format
 * @param {string} phone - Phone number to validate
 * @returns {Object} Validation result
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      feedback: 'Phone number is required'
    };
  }

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it's a valid length (10-15 digits)
  if (digits.length < 10 || digits.length > 15) {
    return {
      isValid: false,
      feedback: 'Phone number must be 10-15 digits'
    };
  }

  return {
    isValid: true,
    feedback: '',
    formatted: digits
  };
};

/**
 * Validates hashtag format
 * @param {string} hashtag - Hashtag to validate (with or without #)
 * @returns {Object} Validation result
 */
export const validateHashtag = (hashtag) => {
  if (!hashtag || typeof hashtag !== 'string') {
    return {
      isValid: false,
      feedback: 'Hashtag is required'
    };
  }

  // Remove # if present
  const tag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;

  // Hashtag rules: 1-100 chars, alphanumeric and underscore only
  const regex = /^[a-zA-Z0-9_]{1,100}$/;

  if (!regex.test(tag)) {
    return {
      isValid: false,
      feedback: 'Hashtag can only contain letters, numbers, and underscores'
    };
  }

  return {
    isValid: true,
    feedback: '',
    normalized: tag.toLowerCase()
  };
};

/**
 * Validates file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 100 * 1024 * 1024, // 100MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.mov']
  } = options;

  if (!file) {
    return {
      isValid: false,
      feedback: 'No file provided'
    };
  }

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      feedback: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      feedback: `File type ${file.type} is not allowed`
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      feedback: `File extension ${extension} is not allowed`
    };
  }

  return {
    isValid: true,
    feedback: '',
    size: file.size,
    type: file.type,
    extension
  };
};

/**
 * Validates array of files for multi-upload
 * @param {FileList|Array} files - Files to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateMultipleFiles = (files, options = {}) => {
  const {
    maxFiles = 10,
    maxTotalSize = 200 * 1024 * 1024, // 200MB total
    ...fileOptions
  } = options;

  if (!files || files.length === 0) {
    return {
      isValid: false,
      feedback: 'No files provided'
    };
  }

  if (files.length > maxFiles) {
    return {
      isValid: false,
      feedback: `Maximum ${maxFiles} files allowed`
    };
  }

  let totalSize = 0;
  const validationResults = [];

  for (let i = 0; i < files.length; i++) {
    const result = validateFileUpload(files[i], fileOptions);
    validationResults.push(result);
    
    if (!result.isValid) {
      return {
        isValid: false,
        feedback: `File ${i + 1}: ${result.feedback}`,
        results: validationResults
      };
    }

    totalSize += files[i].size;
  }

  if (totalSize > maxTotalSize) {
    return {
      isValid: false,
      feedback: `Total file size must be less than ${Math.round(maxTotalSize / 1024 / 1024)}MB`
    };
  }

  return {
    isValid: true,
    feedback: '',
    totalSize,
    fileCount: files.length,
    results: validationResults
  };
};

/**
 * Validates age based on birth date
 * @param {string} birthDate - Birth date in YYYY-MM-DD format
 * @returns {Object} Validation result with age
 */
export const validateAge = (birthDate) => {
  if (!birthDate) {
    return {
      isValid: false,
      age: null,
      feedback: 'Birth date is required'
    };
  }

  const today = new Date();
  const birth = new Date(birthDate);
  
  if (isNaN(birth.getTime())) {
    return {
      isValid: false,
      age: null,
      feedback: 'Invalid birth date'
    };
  }

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < 12) {
    return {
      isValid: false,
      age,
      feedback: 'You must be at least 12 years old to use Focus'
    };
  }

  return {
    isValid: true,
    age,
    feedback: '',
    requiresGuardian: age < 18
  };
};

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validateAge,
  validateText,
  validateUrl,
  validatePhone,
  validateHashtag,
  validateFileUpload,
  validateMultipleFiles,
  sanitizeHtml,
  sanitizeSqlInput,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  PASSWORD_REQUIREMENTS
};
