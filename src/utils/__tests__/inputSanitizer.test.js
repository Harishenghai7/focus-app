/**
 * Unit Tests for Input Sanitizer Utilities
 */

import {
  sanitizeObject,
  sanitizeFormData,
  sanitizeFilename,
  sanitizeSearchQuery,
  sanitizeEmail,
  sanitizeCaption,
  sanitizeBio,
  sanitizeUsername,
  escapeRegex,
  detectXSS,
  detectSQLInjection
} from '../inputSanitizer';

describe('sanitizeObject', () => {
  it('should sanitize string values', () => {
    const obj = { name: '<script>alert(1)</script>test' };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.name).not.toContain('<script>');
  });

  it('should sanitize nested objects', () => {
    const obj = {
      user: {
        name: '<script>test</script>',
        bio: 'Hello'
      }
    };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.user.name).not.toContain('<script>');
    expect(sanitized.user.bio).toBe('Hello');
  });

  it('should sanitize arrays', () => {
    const obj = { tags: ['<script>test</script>', 'valid'] };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.tags[0]).not.toContain('<script>');
    expect(sanitized.tags[1]).toBe('valid');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeObject(null)).toBe(null);
    expect(sanitizeObject(undefined)).toBe(undefined);
  });

  it('should preserve numbers and booleans', () => {
    const obj = { count: 42, active: true };
    const sanitized = sanitizeObject(obj);
    expect(sanitized.count).toBe(42);
    expect(sanitized.active).toBe(true);
  });
});

describe('sanitizeFormData', () => {
  it('should sanitize plain objects', () => {
    const formData = {
      username: 'test<script>',
      email: 'test@example.com'
    };
    const sanitized = sanitizeFormData(formData);
    expect(sanitized.username).not.toContain('<script>');
    expect(sanitized.email).toBe('test@example.com');
  });

  it('should preserve File objects', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = { file, name: 'test' };
    const sanitized = sanitizeFormData(formData);
    expect(sanitized.file).toBeInstanceOf(File);
  });
});

describe('sanitizeFilename', () => {
  it('should remove path traversal attempts', () => {
    const result = sanitizeFilename('../../../etc/passwd');
    expect(result).not.toContain('..');
    expect(result).not.toContain('/');
  });

  it('should remove dangerous characters', () => {
    const result = sanitizeFilename('file<>:"|?*.txt');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('|');
  });

  it('should handle null and undefined', () => {
    expect(sanitizeFilename(null)).toBe('unnamed_file');
    expect(sanitizeFilename(undefined)).toBe('unnamed_file');
  });

  it('should limit filename length', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.length).toBeLessThanOrEqual(255);
  });
});

describe('sanitizeSearchQuery', () => {
  it('should remove SQL injection attempts', () => {
    const result = sanitizeSearchQuery("'; DROP TABLE users; --");
    expect(result).not.toContain("'");
    expect(result).not.toContain('--');
  });

  it('should remove XSS attempts', () => {
    const result = sanitizeSearchQuery('<script>alert(1)</script>');
    expect(result).not.toContain('<script>');
  });

  it('should limit query length', () => {
    const longQuery = 'a'.repeat(300);
    const result = sanitizeSearchQuery(longQuery);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('should handle null and undefined', () => {
    expect(sanitizeSearchQuery(null)).toBe('');
    expect(sanitizeSearchQuery(undefined)).toBe('');
  });
});

describe('sanitizeEmail', () => {
  it('should convert to lowercase', () => {
    const result = sanitizeEmail('TEST@EXAMPLE.COM');
    expect(result).toBe('test@example.com');
  });

  it('should remove dangerous characters', () => {
    const result = sanitizeEmail('test<script>@example.com');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should trim whitespace', () => {
    const result = sanitizeEmail('  test@example.com  ');
    expect(result).toBe('test@example.com');
  });

  it('should limit length', () => {
    const longEmail = 'a'.repeat(300) + '@example.com';
    const result = sanitizeEmail(longEmail);
    expect(result.length).toBeLessThanOrEqual(254);
  });
});

describe('sanitizeCaption', () => {
  it('should extract hashtags', () => {
    const result = sanitizeCaption('Hello #world #test');
    expect(result.hashtags).toEqual(['world', 'test']);
  });

  it('should extract mentions', () => {
    const result = sanitizeCaption('Hello @user @another');
    expect(result.mentions).toEqual(['user', 'another']);
  });

  it('should remove script tags', () => {
    const result = sanitizeCaption('<script>alert(1)</script>Hello');
    expect(result.sanitized).not.toContain('<script>');
    expect(result.sanitized).toContain('Hello');
  });

  it('should limit caption length', () => {
    const longCaption = 'a'.repeat(600);
    const result = sanitizeCaption(longCaption, 500);
    expect(result.sanitized.length).toBeLessThanOrEqual(500);
  });

  it('should remove duplicate hashtags', () => {
    const result = sanitizeCaption('#test #test #test');
    expect(result.hashtags).toEqual(['test']);
  });
});

describe('sanitizeBio', () => {
  it('should remove HTML tags', () => {
    const result = sanitizeBio('<script>alert(1)</script>My bio');
    expect(result).not.toContain('<script>');
    expect(result).toContain('My bio');
  });

  it('should limit bio length', () => {
    const longBio = 'a'.repeat(200);
    const result = sanitizeBio(longBio);
    expect(result.length).toBeLessThanOrEqual(150);
  });

  it('should handle null and undefined', () => {
    expect(sanitizeBio(null)).toBe('');
    expect(sanitizeBio(undefined)).toBe('');
  });
});

describe('sanitizeUsername', () => {
  it('should convert to lowercase', () => {
    const result = sanitizeUsername('TestUser');
    expect(result).toBe('testuser');
  });

  it('should remove special characters', () => {
    const result = sanitizeUsername('test@user!');
    expect(result).toBe('testuser');
  });

  it('should allow underscores and numbers', () => {
    const result = sanitizeUsername('test_user_123');
    expect(result).toBe('test_user_123');
  });

  it('should limit length', () => {
    const longUsername = 'a'.repeat(50);
    const result = sanitizeUsername(longUsername);
    expect(result.length).toBeLessThanOrEqual(30);
  });
});

describe('escapeRegex', () => {
  it('should escape special regex characters', () => {
    const result = escapeRegex('test.*+?^${}()|[]\\');
    expect(result).toContain('\\.');
    expect(result).toContain('\\*');
    expect(result).toContain('\\+');
  });

  it('should handle null and undefined', () => {
    expect(escapeRegex(null)).toBe('');
    expect(escapeRegex(undefined)).toBe('');
  });
});

describe('detectXSS', () => {
  it('should detect script tags', () => {
    expect(detectXSS('<script>alert(1)</script>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(detectXSS('javascript:alert(1)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(detectXSS('<div onclick="alert(1)">')).toBe(true);
  });

  it('should detect iframe tags', () => {
    expect(detectXSS('<iframe src="evil.com"></iframe>')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(detectXSS('Hello world')).toBe(false);
  });

  it('should handle null and undefined', () => {
    expect(detectXSS(null)).toBe(false);
    expect(detectXSS(undefined)).toBe(false);
  });
});

describe('detectSQLInjection', () => {
  it('should detect SQL keywords', () => {
    expect(detectSQLInjection('SELECT * FROM users')).toBe(true);
    expect(detectSQLInjection('DROP TABLE users')).toBe(true);
  });

  it('should detect UNION attacks', () => {
    expect(detectSQLInjection('UNION SELECT password')).toBe(true);
  });

  it('should detect OR attacks', () => {
    expect(detectSQLInjection("' OR '1'='1")).toBe(true);
  });

  it('should detect SQL comments', () => {
    expect(detectSQLInjection('test --')).toBe(true);
    expect(detectSQLInjection('test /* comment */')).toBe(true);
  });

  it('should return false for safe content', () => {
    expect(detectSQLInjection('Hello world')).toBe(false);
  });

  it('should handle null and undefined', () => {
    expect(detectSQLInjection(null)).toBe(false);
    expect(detectSQLInjection(undefined)).toBe(false);
  });
});
