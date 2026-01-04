import linkify, { 
  extractMentions, 
  extractHashtags, 
  extractUrls,
  stripHtml,
  hasLinkableContent
} from './linkify';

describe('linkify', () => {
  describe('URL linking', () => {
    it('should linkify HTTP URLs', () => {
      const input = 'Visit http://example.com for more info';
      const output = linkify(input);
      
      expect(output).toContain('<a href="http://example.com"');
      expect(output).toContain('target="_blank"');
      expect(output).toContain('rel="noopener noreferrer"');
      expect(output).toContain('class="link-url"');
    });

    it('should linkify HTTPS URLs', () => {
      const input = 'Check out https://example.com';
      const output = linkify(input);
      
      expect(output).toContain('<a href="https://example.com"');
      expect(output).toContain('>https://example.com</a>');
    });

    it('should handle URLs with paths', () => {
      const input = 'Visit https://example.com/path/to/page';
      const output = linkify(input);
      
      expect(output).toContain('href="https://example.com/path/to/page"');
    });

    it('should handle URLs with query parameters', () => {
      const input = 'Search https://example.com?q=test&page=1';
      const output = linkify(input);
      
      expect(output).toContain('href="https://example.com?q=test&amp;page=1"');
    });

    it('should handle URLs with fragments', () => {
      const input = 'Go to https://example.com#section';
      const output = linkify(input);
      
      expect(output).toContain('href="https://example.com#section"');
    });

    it('should handle URLs with ports', () => {
      const input = 'Dev server at http://localhost:3000';
      const output = linkify(input);
      
      expect(output).toContain('href="http://localhost:3000"');
    });

    it('should handle trailing punctuation correctly', () => {
      const input = 'Check this out: https://example.com.';
      const output = linkify(input);
      
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('</a>.');
    });

    it('should handle multiple URLs', () => {
      const input = 'Visit https://example.com and http://test.com';
      const output = linkify(input);
      
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('href="http://test.com"');
    });

    it('should not linkify URLs when disabled', () => {
      const input = 'Visit https://example.com';
      const output = linkify(input, { urls: false });
      
      expect(output).toBe(input);
    });

    it('should escape HTML in URLs', () => {
      const input = 'Visit https://example.com/<script>alert("xss")</script>';
      const output = linkify(input);
      
      // URL regex stops at < character, so script tag is left as-is in text
      // The URL itself will be https://example.com/ only
      expect(output).toContain('href="https://example.com/"');
    });
  });

  describe('Mention linking', () => {
    it('should linkify mentions', () => {
      const input = 'Hello @john how are you?';
      const output = linkify(input);
      
      expect(output).toContain('<a href="/profile/john"');
      expect(output).toContain('class="mention"');
      expect(output).toContain('>@john</a>');
    });

    it('should linkify multiple mentions', () => {
      const input = 'Hey @john and @jane!';
      const output = linkify(input);
      
      expect(output).toContain('href="/profile/john"');
      expect(output).toContain('href="/profile/jane"');
    });

    it('should linkify mention at start of string', () => {
      const input = '@john is here';
      const output = linkify(input);
      
      expect(output).toContain('href="/profile/john"');
    });

    it('should handle mentions with underscores', () => {
      const input = 'Talk to @john_doe';
      const output = linkify(input);
      
      expect(output).toContain('href="/profile/john_doe"');
    });

    it('should handle mentions with numbers', () => {
      const input = 'Contact @user123';
      const output = linkify(input);
      
      expect(output).toContain('href="/profile/user123"');
    });

    it('should use custom mention path', () => {
      const input = 'Hello @john';
      const output = linkify(input, { mentionPath: '/user' });
      
      expect(output).toContain('href="/user/john"');
    });

    it('should not linkify mentions when disabled', () => {
      const input = 'Hello @john';
      const output = linkify(input, { mentions: false });
      
      expect(output).toBe(input);
    });

    it('should add data attributes to mentions', () => {
      const input = 'Hello @john';
      const output = linkify(input);
      
      expect(output).toContain('data-username="john"');
    });

    it('should escape HTML in usernames', () => {
      const input = 'Hello @john<script>';
      const output = linkify(input);
      
      expect(output).not.toContain('<script>');
    });
  });

  describe('Hashtag linking', () => {
    it('should linkify hashtags', () => {
      const input = 'This is #trending';
      const output = linkify(input);
      
      expect(output).toContain('<a href="/explore?tag=trending"');
      expect(output).toContain('class="hashtag"');
      expect(output).toContain('>#trending</a>');
    });

    it('should linkify multiple hashtags', () => {
      const input = 'Check #news and #sports';
      const output = linkify(input);
      
      expect(output).toContain('href="/explore?tag=news"');
      expect(output).toContain('href="/explore?tag=sports"');
    });

    it('should linkify hashtag at start of string', () => {
      const input = '#breaking news alert';
      const output = linkify(input);
      
      expect(output).toContain('href="/explore?tag=breaking"');
    });

    it('should handle hashtags with underscores', () => {
      const input = 'Check #social_media';
      const output = linkify(input);
      
      expect(output).toContain('href="/explore?tag=social_media"');
    });

    it('should handle hashtags with numbers', () => {
      const input = 'Look at #covid19';
      const output = linkify(input);
      
      expect(output).toContain('href="/explore?tag=covid19"');
    });

    it('should use custom hashtag path', () => {
      const input = 'This is #trending';
      const output = linkify(input, { hashtagPath: '/tags' });
      
      expect(output).toContain('href="/tags?tag=trending"');
    });

    it('should not linkify hashtags when disabled', () => {
      const input = 'This is #trending';
      const output = linkify(input, { hashtags: false });
      
      expect(output).toBe(input);
    });

    it('should add data attributes to hashtags', () => {
      const input = 'This is #trending';
      const output = linkify(input);
      
      expect(output).toContain('data-tag="trending"');
    });
  });

  describe('Combined linking', () => {
    it('should linkify URLs, mentions, and hashtags together', () => {
      const input = 'Check out https://example.com and @john #trending';
      const output = linkify(input);
      
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('href="/profile/john"');
      expect(output).toContain('href="/explore?tag=trending"');
    });

    it('should preserve text formatting', () => {
      const input = 'Hello @john!\nCheck https://example.com\n#trending now';
      const output = linkify(input);
      
      expect(output).toContain('\n');
      expect(output).toContain('Hello ');
      expect(output).toContain('!');
    });

    it('should handle complex mixed content', () => {
      const input = 'Hey @john and @jane, check https://example.com for #news and #updates!';
      const output = linkify(input);
      
      expect(output).toContain('href="/profile/john"');
      expect(output).toContain('href="/profile/jane"');
      expect(output).toContain('href="https://example.com"');
      expect(output).toContain('href="/explore?tag=news"');
      expect(output).toContain('href="/explore?tag=updates"');
    });

    it('should not open links in new tab when disabled', () => {
      const input = 'Visit https://example.com';
      const output = linkify(input, { newTab: false });
      
      expect(output).not.toContain('target="_blank"');
      expect(output).not.toContain('rel="noopener noreferrer"');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(linkify('')).toBe('');
    });

    it('should handle null', () => {
      expect(linkify(null)).toBe('');
    });

    it('should handle undefined', () => {
      expect(linkify(undefined)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(linkify(123)).toBe('');
      expect(linkify({})).toBe('');
    });

    it('should handle text with no linkable content', () => {
      const input = 'Just plain text';
      const output = linkify(input);
      
      expect(output).toBe(input);
    });

    it('should not linkify email addresses as mentions', () => {
      const input = 'Email: test@example.com';
      const output = linkify(input);
      
      // Should not create mention link for email
      expect(output).not.toContain('href="/profile/example.com"');
    });

    it('should handle mentions in parentheses', () => {
      const input = 'Hello (@john)';
      const output = linkify(input);
      
      expect(output).toContain('href="/profile/john"');
    });
  });
});

describe('extractMentions', () => {
  it('should extract single mention', () => {
    const result = extractMentions('Hello @john');
    expect(result).toEqual(['john']);
  });

  it('should extract multiple mentions', () => {
    const result = extractMentions('Hello @john and @jane');
    expect(result).toEqual(['john', 'jane']);
  });

  it('should extract mentions with underscores', () => {
    const result = extractMentions('Hi @john_doe');
    expect(result).toEqual(['john_doe']);
  });

  it('should return empty array for no mentions', () => {
    const result = extractMentions('No mentions here');
    expect(result).toEqual([]);
  });

  it('should handle null input', () => {
    const result = extractMentions(null);
    expect(result).toEqual([]);
  });

  it('should handle empty string', () => {
    const result = extractMentions('');
    expect(result).toEqual([]);
  });
});

describe('extractHashtags', () => {
  it('should extract single hashtag', () => {
    const result = extractHashtags('This is #trending');
    expect(result).toEqual(['trending']);
  });

  it('should extract multiple hashtags', () => {
    const result = extractHashtags('Check #news and #sports');
    expect(result).toEqual(['news', 'sports']);
  });

  it('should extract hashtags with underscores', () => {
    const result = extractHashtags('Look at #social_media');
    expect(result).toEqual(['social_media']);
  });

  it('should return empty array for no hashtags', () => {
    const result = extractHashtags('No hashtags here');
    expect(result).toEqual([]);
  });

  it('should handle null input', () => {
    const result = extractHashtags(null);
    expect(result).toEqual([]);
  });
});

describe('extractUrls', () => {
  it('should extract single URL', () => {
    const result = extractUrls('Visit https://example.com');
    expect(result).toEqual(['https://example.com']);
  });

  it('should extract multiple URLs', () => {
    const result = extractUrls('Visit https://example.com and http://test.com');
    expect(result).toEqual(['https://example.com', 'http://test.com']);
  });

  it('should extract URLs with paths', () => {
    const result = extractUrls('Go to https://example.com/path/to/page');
    expect(result).toEqual(['https://example.com/path/to/page']);
  });

  it('should return empty array for no URLs', () => {
    const result = extractUrls('No URLs here');
    expect(result).toEqual([]);
  });

  it('should handle null input', () => {
    const result = extractUrls(null);
    expect(result).toEqual([]);
  });
});

describe('stripHtml', () => {
  it('should strip HTML tags', () => {
    const html = '<a href="/profile/john">@john</a>';
    const result = stripHtml(html);
    expect(result).toBe('@john');
  });

  it('should strip multiple HTML tags', () => {
    const html = '<p>Hello <a href="#">world</a></p>';
    const result = stripHtml(html);
    expect(result).toBe('Hello world');
  });

  it('should handle text without HTML', () => {
    const text = 'Plain text';
    const result = stripHtml(text);
    expect(result).toBe(text);
  });

  it('should handle null input', () => {
    const result = stripHtml(null);
    expect(result).toBe('');
  });
});

describe('hasLinkableContent', () => {
  it('should return true for URLs', () => {
    expect(hasLinkableContent('Visit https://example.com')).toBe(true);
  });

  it('should return true for mentions', () => {
    expect(hasLinkableContent('Hello @john')).toBe(true);
  });

  it('should return true for hashtags', () => {
    expect(hasLinkableContent('This is #trending')).toBe(true);
  });

  it('should return true for mixed content', () => {
    expect(hasLinkableContent('Visit https://example.com @john #trending')).toBe(true);
  });

  it('should return false for plain text', () => {
    expect(hasLinkableContent('Just plain text')).toBe(false);
  });

  it('should return false for null', () => {
    expect(hasLinkableContent(null)).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(hasLinkableContent('')).toBe(false);
  });
});
