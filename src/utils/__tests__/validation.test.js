/**
 * Unit Tests for Validation Utilities
 */

import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateText,
  validateUrl,
  validatePhone,
  validateHashtag,
  validateFileUpload,
  validateMultipleFiles,
  validateAge,
  sanitizeHtml,
  sanitizeSqlInput,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  PASSWORD_REQUIREMENTS
} from '../validation';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.co.uk')).toBe(true);
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('should handle null and undefined', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
    expect(validateEmail('')).toBe(false);
  });

  it('should trim whitespace', () => {
    expect(validateEmail('  user@example.com  ')).toBe(true);
  });
});

describe('validatePassword', () => {
  it('should validate strong passwords', () => {
    const result = validatePassword('Test123!@#');
    expect(result.isValid).toBe(true);
    expect(result.strength).toBe('strong');
    expect(result.requirements.minLength).toBe(true);
    expect(result.requirements.hasUppercase).toBe(true);
    expect(result.requirements.hasLowercase).toBe(true);
    expect(result.requirements.hasNumber).toBe(true);
    expect(result.requirements.hasSpecialChar).toBe(true);
  });

  it('should reject weak passwords', () => {
    const result = validatePassword('weak');
    expect(result.isValid).toBe(false);
    expect(result.strength).toBe('weak');
    expect(result.feedback.length).toBeGreaterThan(0);
  });

  it('should require minimum length', () => {
    const result = validatePassword('Test1!');
    expect(result.isValid).toBe(false);
    expect(result.requirements.minLength).toBe(false);
  });

  it('should require uppercase letter', () => {
    const result = validatePassword('test123!@#');
    expect(result.isValid).toBe(false);
    expect(result.requirements.hasUppercase).toBe(false);
  });

  it('should require lowercase letter', () => {
    const result = validatePassword('TEST123!@#');
    expect(result.isValid).toBe(false);
    expect(result.requirements.hasLowercase).toBe(false);
  });

  it('should require number', () => {
    const result = validatePassword('TestTest!@#');
    expect(result.isValid).toBe(false);
    expect(result.requirements.hasNumber).toBe(false);
  });

  it('should require special character', () => {
    const result = validatePassword('TestTest123');
    expect(result.isValid).toBe(false);
    expect(result.requirements.hasSpecialChar).toBe(false);
  });

  it('should handle null and undefined', () => {
    const result = validatePassword(null);
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('Password is required');
  });

  it('should calculate strength score correctly', () => {
    const weak = validatePassword('test');
    const medium = validatePassword('Test1234');
    const strong = validatePassword('Test123!@#');
    
    expect(weak.score).toBeLessThan(medium.score);
    expect(medium.score).toBeLessThan(strong.score);
  });
});

describe('validateUsername', () => {
  it('should accept valid usernames', () => {
    expect(validateUsername('user123').isValid).toBe(true);
    expect(validateUsername('test_user').isValid).toBe(true);
    expect(validateUsername('User_Name_123').isValid).toBe(true);
  });

  it('should reject usernames that are too short', () => {
    const result = validateUsername('ab');
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('at least 3 characters');
  });

  it('should reject usernames that are too long', () => {
    const result = validateUsername('a'.repeat(31));
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('30 characters or less');
  });

  it('should reject usernames with special characters', () => {
    const result = validateUsername('user@name');
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('letters, numbers, and underscores');
  });

  it('should handle null and undefined', () => {
    expect(validateUsername(null).isValid).toBe(false);
    expect(validateUsername(undefined).isValid).toBe(false);
  });
});

describe('validateText', () => {
  it('should accept valid text', () => {
    const result = validateText('This is a valid caption');
    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBe('This is a valid caption');
  });

  it('should enforce maximum length', () => {
    const longText = 'a'.repeat(501);
    const result = validateText(longText, 500);
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('500 characters or less');
  });

  it('should sanitize HTML', () => {
    const result = validateText('<script>alert("xss")</script>Hello');
    expect(result.sanitized).not.toContain('<script>');
    expect(result.sanitized).toContain('Hello');
  });

  it('should reject empty text', () => {
    const result = validateText('   ');
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('cannot be empty');
  });
});

describe('validateUrl', () => {
  it('should accept valid URLs', () => {
    expect(validateUrl('https://example.com').isValid).toBe(true);
    expect(validateUrl('http://test.com/path').isValid).toBe(true);
  });

  it('should reject invalid protocols', () => {
    const result = validateUrl('javascript:alert(1)');
    expect(result.isValid).toBe(false);
  });

  it('should reject malformed URLs', () => {
    const result = validateUrl('not a url');
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('Invalid URL format');
  });
});

describe('validatePhone', () => {
  it('should accept valid phone numbers', () => {
    expect(validatePhone('1234567890').isValid).toBe(true);
    expect(validatePhone('+1 (234) 567-8900').isValid).toBe(true);
  });

  it('should reject phone numbers that are too short', () => {
    const result = validatePhone('12345');
    expect(result.isValid).toBe(false);
  });

  it('should reject phone numbers that are too long', () => {
    const result = validatePhone('1234567890123456');
    expect(result.isValid).toBe(false);
  });

  it('should format phone numbers', () => {
    const result = validatePhone('+1 (234) 567-8900');
    expect(result.formatted).toBe('12345678900');
  });
});

describe('validateHashtag', () => {
  it('should accept valid hashtags', () => {
    expect(validateHashtag('test').isValid).toBe(true);
    expect(validateHashtag('#test').isValid).toBe(true);
    expect(validateHashtag('test_123').isValid).toBe(true);
  });

  it('should normalize hashtags', () => {
    const result = validateHashtag('#Test');
    expect(result.normalized).toBe('test');
  });

  it('should reject hashtags with special characters', () => {
    const result = validateHashtag('test@tag');
    expect(result.isValid).toBe(false);
  });
});

describe('validateFileUpload', () => {
  it('should accept valid files', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = validateFileUpload(file);
    expect(result.isValid).toBe(true);
  });

  it('should reject files that are too large', () => {
    const largeFile = new File(['x'.repeat(101 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const result = validateFileUpload(largeFile);
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('File size');
  });

  it('should reject invalid file types', () => {
    const file = new File(['content'], 'test.exe', { type: 'application/exe' });
    const result = validateFileUpload(file);
    expect(result.isValid).toBe(false);
  });
});

describe('validateAge', () => {
  it('should accept valid ages', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 20);
    const result = validateAge(birthDate.toISOString().split('T')[0]);
    expect(result.isValid).toBe(true);
    expect(result.age).toBe(20);
  });

  it('should reject ages under 12', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 10);
    const result = validateAge(birthDate.toISOString().split('T')[0]);
    expect(result.isValid).toBe(false);
    expect(result.feedback).toContain('at least 12 years old');
  });

  it('should flag minors for guardian requirement', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 15);
    const result = validateAge(birthDate.toISOString().split('T')[0]);
    expect(result.requiresGuardian).toBe(true);
  });
});

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const result = sanitizeHtml('<script>alert("xss")</script>Hello');
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should remove event handlers', () => {
    const result = sanitizeHtml('<div onclick="alert(1)">Test</div>');
    expect(result).not.toContain('onclick');
  });

  it('should remove javascript: protocol', () => {
    const result = sanitizeHtml('<a href="javascript:alert(1)">Link</a>');
    expect(result).not.toContain('javascript:');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });
});

describe('sanitizeSqlInput', () => {
  it('should remove SQL injection attempts', () => {
    const result = sanitizeSqlInput("'; DROP TABLE users; --");
    expect(result).not.toContain("'");
    expect(result).not.toContain('--');
    expect(result).not.toContain('DROP');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeSqlInput(null)).toBe('');
    expect(sanitizeSqlInput(undefined)).toBe('');
  });
});

describe('getPasswordStrengthColor', () => {
  it('should return correct colors', () => {
    expect(getPasswordStrengthColor('weak')).toBe('#ef4444');
    expect(getPasswordStrengthColor('medium')).toBe('#f59e0b');
    expect(getPasswordStrengthColor('strong')).toBe('#10b981');
  });
});

describe('getPasswordStrengthLabel', () => {
  it('should return correct labels', () => {
    expect(getPasswordStrengthLabel('weak')).toBe('Weak');
    expect(getPasswordStrengthLabel('medium')).toBe('Medium');
    expect(getPasswordStrengthLabel('strong')).toBe('Strong');
  });
});
