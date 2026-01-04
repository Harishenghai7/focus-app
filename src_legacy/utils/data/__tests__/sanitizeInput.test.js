/**
 * @jest-environment jsdom
 */

// Mock DOMPurify before importing
jest.mock('dompurify', () => {
  const originalModule = jest.requireActual('dompurify');
  return originalModule;
});

import sanitizeInput, {
  sanitizePlainText,
  sanitizeURL,
  isValidURL,
  stripHTML,
  sanitizeRichText,
  sanitizeBio,
  sanitizeUsername,
  sanitizeSearchQuery,
  containsDangerousContent,
  sanitizeObject,
  sanitizeArray,
  batchSanitize,
} from '../sanitizeInput';

describe('sanitizeInput', () => {
  describe('Main sanitizeInput function', () => {
    test('removes script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    test('removes inline event handlers', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('onclick');
    });

    test('removes javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('javascript:');
    });

    test('allows safe HTML tags with basic level', () => {
      const input = '<b>Bold</b> <i>Italic</i> <u>Underline</u>';
      const result = sanitizeInput(input, { level: 'basic' });
      expect(result).toContain('<b>Bold</b>');
      expect(result).toContain('<i>Italic</i>');
      expect(result).toContain('<u>Underline</u>');
    });

    test('allows links with standard level', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeInput(input, { level: 'standard' });
      expect(result).toContain('<a');
      expect(result).toContain('href="https://example.com"');
    });

    test('removes links when allowLinks is false', () => {
      const input = '<a href="https://example.com">Link</a>';
      const result = sanitizeInput(input, { level: 'standard', allowLinks: false });
      expect(result).not.toContain('<a');
      expect(result).toContain('Link'); // Content should remain
    });

    test('strips all HTML with strict level', () => {
      const input = '<p>Hello <b>World</b></p>';
      const result = sanitizeInput(input, { level: 'strict' });
      expect(result).toBe('Hello World');
    });

    test('handles empty input', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    test('handles non-string input', () => {
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput({})).toBe('');
      expect(sanitizeInput([])).toBe('');
    });

    test('removes iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = sanitizeInput(input);
      expect(result).not.toContain('iframe');
    });

    test('removes object and embed tags', () => {
      const input = '<object data="evil.swf"></object><embed src="evil.swf">';
      const result = sanitizeInput(input);
      expect(result).not.toContain('object');
      expect(result).not.toContain('embed');
    });

    test('adds rel=noopener noreferrer to target=_blank links', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeInput(input, { level: 'standard' });
      expect(result).toContain('rel="noopener noreferrer"');
    });
  });

  describe('sanitizePlainText', () => {
    test('escapes HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizePlainText(input);
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;');
    });

    test('escapes all special characters', () => {
      const input = '<>&"\'';
      const result = sanitizePlainText(input);
      expect(result).toBe('&lt;&gt;&amp;&quot;&#39;');
    });

    test('handles empty input', () => {
      expect(sanitizePlainText('')).toBe('');
      expect(sanitizePlainText(null)).toBe('');
    });

    test('handles non-string input', () => {
      expect(sanitizePlainText(123)).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    test('allows valid HTTP URLs', () => {
      const url = 'http://example.com';
      expect(sanitizeURL(url)).toBe('http://example.com/');
    });

    test('allows valid HTTPS URLs', () => {
      const url = 'https://example.com/path';
      expect(sanitizeURL(url)).toBe('https://example.com/path');
    });

    test('allows mailto URLs', () => {
      const url = 'mailto:user@example.com';
      expect(sanitizeURL(url)).toBe('mailto:user@example.com');
    });

    test('allows tel URLs', () => {
      const url = 'tel:+1234567890';
      expect(sanitizeURL(url)).toBe('tel:+1234567890');
    });

    test('blocks javascript: protocol', () => {
      const url = 'javascript:alert(1)';
      expect(sanitizeURL(url)).toBeNull();
    });

    test('blocks data: protocol', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      expect(sanitizeURL(url)).toBeNull();
    });

    test('allows relative URLs', () => {
      expect(sanitizeURL('/path/to/page')).toBe('/path/to/page');
      expect(sanitizeURL('./relative')).toBe('./relative');
      expect(sanitizeURL('../parent')).toBe('../parent');
    });

    test('handles invalid URLs', () => {
      expect(sanitizeURL('not a url')).toBeNull();
      expect(sanitizeURL('')).toBeNull();
    });

    test('respects custom allowed protocols', () => {
      const url = 'ftp://example.com';
      expect(sanitizeURL(url)).toBeNull(); // Not in default list
      expect(sanitizeURL(url, { allowedProtocols: ['ftp:'] })).toBe('ftp://example.com/');
    });
  });

  describe('isValidURL', () => {
    test('validates safe URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://example.com')).toBe(true);
      expect(isValidURL('/relative/path')).toBe(true);
    });

    test('rejects dangerous URLs', () => {
      expect(isValidURL('javascript:alert(1)')).toBe(false);
      expect(isValidURL('data:text/html,<script>')).toBe(false);
      expect(isValidURL('not a url')).toBe(false);
    });
  });

  describe('stripHTML', () => {
    test('removes all HTML tags', () => {
      const input = '<p>Hello <b>World</b></p>';
      expect(stripHTML(input)).toBe('Hello World');
    });

    test('removes script tags and content', () => {
      const input = '<script>alert(1)</script>Hello';
      expect(stripHTML(input)).not.toContain('script');
      expect(stripHTML(input)).not.toContain('alert');
    });

    test('preserves text content', () => {
      const input = '<div>Keep this text</div>';
      expect(stripHTML(input)).toBe('Keep this text');
    });
  });

  describe('sanitizeRichText', () => {
    test('allows rich formatting tags', () => {
      const input = '<h1>Title</h1><p>Paragraph</p><ul><li>Item</li></ul>';
      const result = sanitizeRichText(input);
      expect(result).toContain('<h1>');
      expect(result).toContain('<p>');
      expect(result).toContain('<ul>');
    });

    test('removes dangerous content', () => {
      const input = '<p>Safe</p><script>alert(1)</script>';
      const result = sanitizeRichText(input);
      expect(result).toContain('<p>Safe</p>');
      expect(result).not.toContain('script');
    });

    test('allows images with safe attributes', () => {
      const input = '<img src="https://example.com/image.jpg" alt="Image">';
      const result = sanitizeRichText(input);
      expect(result).toContain('img');
      expect(result).toContain('src');
      expect(result).toContain('alt');
    });
  });

  describe('sanitizeBio', () => {
    test('allows basic formatting', () => {
      const input = '<b>Developer</b> working on <i>cool projects</i>';
      const result = sanitizeBio(input);
      expect(result).toContain('<b>');
      expect(result).toContain('<i>');
    });

    test('allows links', () => {
      const input = 'Check out <a href="https://example.com">my site</a>';
      const result = sanitizeBio(input);
      // Bio now uses standard level which includes links
      expect(result).toContain('<a');
      expect(result).toContain('href');
      expect(result).toContain('my site');
    });

    test('removes scripts', () => {
      const input = 'Bio <script>alert(1)</script>';
      const result = sanitizeBio(input);
      expect(result).not.toContain('script');
    });
  });

  describe('sanitizeUsername', () => {
    test('removes all HTML tags', () => {
      const input = '<b>John</b>';
      expect(sanitizeUsername(input)).toBe('John');
    });

    test('removes special characters', () => {
      const input = 'John<script>';
      // sanitizeUsername removes HTML tags completely
      expect(sanitizeUsername(input)).toBe('John');
    });

    test('trims whitespace', () => {
      const input = '  John Doe  ';
      expect(sanitizeUsername(input)).toBe('John Doe');
    });

    test('limits length to 50 characters', () => {
      const input = 'a'.repeat(100);
      expect(sanitizeUsername(input).length).toBe(50);
    });

    test('handles empty input', () => {
      expect(sanitizeUsername('')).toBe('');
      expect(sanitizeUsername(null)).toBe('');
    });
  });

  describe('sanitizeSearchQuery', () => {
    test('removes HTML tags', () => {
      const input = 'search <b>term</b>';
      expect(sanitizeSearchQuery(input)).toBe('search term');
    });

    test('removes special characters', () => {
      const input = 'search<>&"\'';
      expect(sanitizeSearchQuery(input)).toBe('search');
    });

    test('limits length to 200 characters', () => {
      const input = 'a'.repeat(300);
      expect(sanitizeSearchQuery(input).length).toBe(200);
    });

    test('trims whitespace', () => {
      const input = '  search query  ';
      expect(sanitizeSearchQuery(input)).toBe('search query');
    });
  });

  describe('containsDangerousContent', () => {
    test('detects script tags', () => {
      expect(containsDangerousContent('<script>alert(1)</script>')).toBe(true);
    });

    test('detects iframe tags', () => {
      expect(containsDangerousContent('<iframe src="evil"></iframe>')).toBe(true);
    });

    test('detects javascript: protocol', () => {
      expect(containsDangerousContent('javascript:alert(1)')).toBe(true);
    });

    test('detects event handlers', () => {
      expect(containsDangerousContent('<div onclick="alert(1)">')).toBe(true);
      // Note: The regex pattern matches on\w+= which requires the equals sign
      expect(containsDangerousContent('<img onload="alert(1)">')).toBe(true);
    });

    test('detects object and embed tags', () => {
      expect(containsDangerousContent('<object data="evil"></object>')).toBe(true);
      expect(containsDangerousContent('<embed src="evil">')).toBe(true);
    });

    test('returns false for safe content', () => {
      expect(containsDangerousContent('<p>Safe content</p>')).toBe(false);
      expect(containsDangerousContent('Plain text')).toBe(false);
    });

    test('handles non-string input', () => {
      expect(containsDangerousContent(null)).toBe(false);
      expect(containsDangerousContent(123)).toBe(false);
    });
  });

  describe('sanitizeObject', () => {
    test('sanitizes all string fields', () => {
      const obj = {
        title: '<b>Title</b>',
        content: '<script>bad</script>Content',
      };
      const result = sanitizeObject(obj);
      expect(result.title).toContain('<b>');
      expect(result.content).not.toContain('script');
    });

    test('applies field-specific configurations', () => {
      const obj = {
        title: '<b>Title</b>',
        content: '<script>bad</script>',
      };
      const config = {
        title: { level: 'basic' },
        content: { level: 'strict' },
      };
      const result = sanitizeObject(obj, config);
      expect(result.title).toContain('<b>');
      expect(result.content).toBe('');
    });

    test('preserves non-string values', () => {
      const obj = {
        id: 123,
        active: true,
        data: null,
      };
      const result = sanitizeObject(obj);
      expect(result.id).toBe(123);
      expect(result.active).toBe(true);
      expect(result.data).toBeNull();
    });

    test('handles nested objects', () => {
      const obj = {
        user: {
          name: '<b>John</b>',
          bio: '<script>bad</script>',
        },
      };
      const result = sanitizeObject(obj);
      expect(result.user.name).toContain('<b>');
      expect(result.user.bio).not.toContain('script');
    });

    test('handles empty object', () => {
      expect(sanitizeObject({})).toEqual({});
      expect(sanitizeObject(null)).toEqual({});
    });
  });

  describe('sanitizeArray', () => {
    test('sanitizes all strings in array', () => {
      const arr = ['<b>Item 1</b>', '<script>bad</script>Item 2'];
      const result = sanitizeArray(arr);
      expect(result[0]).toContain('<b>');
      expect(result[1]).not.toContain('script');
    });

    test('filters out non-string items', () => {
      const arr = ['string', 123, null, '<b>text</b>'];
      const result = sanitizeArray(arr);
      expect(result).toHaveLength(2);
      expect(result).toContain('string');
    });

    test('applies sanitization options', () => {
      const arr = ['<b>Bold</b>', '<i>Italic</i>'];
      const result = sanitizeArray(arr, { level: 'strict' });
      expect(result[0]).toBe('Bold');
      expect(result[1]).toBe('Italic');
    });

    test('handles empty array', () => {
      expect(sanitizeArray([])).toEqual([]);
      expect(sanitizeArray(null)).toEqual([]);
    });
  });

  describe('batchSanitize', () => {
    test('sanitizes multiple inputs with different types', () => {
      const inputs = {
        username: { value: '<b>John</b>', type: 'username' },
        bio: { value: '<p>Developer</p>', type: 'bio' },
        content: { value: '<script>bad</script>Post', type: 'richText' },
      };
      const result = batchSanitize(inputs);
      expect(result.username).toBe('John');
      expect(result.bio).toContain('<p>');
      expect(result.content).not.toContain('script');
    });

    test('handles plainText type', () => {
      const inputs = {
        text: { value: '<b>Text</b>', type: 'plainText' },
      };
      const result = batchSanitize(inputs);
      expect(result.text).toContain('&lt;b&gt;');
    });

    test('handles url type', () => {
      const inputs = {
        website: { value: 'https://example.com', type: 'url' },
        badUrl: { value: 'javascript:alert(1)', type: 'url' },
      };
      const result = batchSanitize(inputs);
      expect(result.website).toBe('https://example.com/');
      expect(result.badUrl).toBeNull();
    });

    test('handles search type', () => {
      const inputs = {
        query: { value: '<script>search</script>', type: 'search' },
      };
      const result = batchSanitize(inputs);
      expect(result.query).toBe('search');
    });

    test('uses default standard level when type not specified', () => {
      const inputs = {
        content: { value: '<b>Content</b>' },
      };
      const result = batchSanitize(inputs);
      expect(result.content).toContain('<b>');
    });
  });

  describe('XSS Attack Vectors', () => {
    test('blocks common XSS vectors', () => {
      const vectors = [
        '<script>alert(1)</script>',
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<iframe src=javascript:alert(1)>',
        '<object data=javascript:alert(1)>',
        '<embed src=javascript:alert(1)>',
        '<a href="javascript:alert(1)">click</a>',
        '<form action=javascript:alert(1)>',
        '<input onfocus=alert(1) autofocus>',
        '<select onfocus=alert(1) autofocus>',
        '<textarea onfocus=alert(1) autofocus>',
        '<body onload=alert(1)>',
        '<video><source onerror=alert(1)>',
        '<audio src=x onerror=alert(1)>',
      ];

      vectors.forEach(vector => {
        const result = sanitizeInput(vector);
        expect(result).not.toContain('alert');
        expect(result).not.toContain('javascript:');
      });
    });

    test('handles encoded XSS attempts', () => {
      const encoded = '&lt;script&gt;alert(1)&lt;/script&gt;';
      const result = sanitizeInput(encoded);
      // Should not execute, already encoded
      expect(result).not.toContain('<script>');
    });
  });
});
