/**
 * Unit Tests for Content Parser Utilities
 */

import {
  parseContent,
  extractHashtags,
  extractMentions,
  isValidHashtag,
  isValidMention,
  countContentElements,
  truncateContent
} from '../contentParser';

describe('parseContent', () => {
  it('should parse text with hashtags', () => {
    const segments = parseContent('Hello #world #test');
    expect(segments).toHaveLength(4);
    expect(segments[0].type).toBe('text');
    expect(segments[1].type).toBe('hashtag');
    expect(segments[1].tag).toBe('world');
    expect(segments[3].tag).toBe('test');
  });

  it('should parse text with mentions', () => {
    const segments = parseContent('Hello @user @another');
    expect(segments).toHaveLength(4);
    expect(segments[1].type).toBe('mention');
    expect(segments[1].username).toBe('user');
    expect(segments[3].username).toBe('another');
  });

  it('should parse mixed content', () => {
    const segments = parseContent('Check out @user and #hashtag');
    expect(segments).toHaveLength(4);
    expect(segments[1].type).toBe('mention');
    expect(segments[3].type).toBe('hashtag');
  });

  it('should handle empty text', () => {
    const segments = parseContent('');
    expect(segments).toEqual([]);
  });

  it('should handle text without hashtags or mentions', () => {
    const segments = parseContent('Just plain text');
    expect(segments).toHaveLength(1);
    expect(segments[0].type).toBe('text');
  });

  it('should handle consecutive hashtags', () => {
    const segments = parseContent('#one#two#three');
    expect(segments.filter(s => s.type === 'hashtag')).toHaveLength(3);
  });
});

describe('extractHashtags', () => {
  it('should extract all hashtags from text', () => {
    const hashtags = extractHashtags('Hello #world #test #example');
    expect(hashtags).toEqual(['world', 'test', 'example']);
  });

  it('should return lowercase hashtags', () => {
    const hashtags = extractHashtags('#Test #WORLD');
    expect(hashtags).toEqual(['test', 'world']);
  });

  it('should handle text without hashtags', () => {
    const hashtags = extractHashtags('No hashtags here');
    expect(hashtags).toEqual([]);
  });

  it('should handle null and undefined', () => {
    expect(extractHashtags(null)).toEqual([]);
    expect(extractHashtags(undefined)).toEqual([]);
  });

  it('should handle hashtags with underscores and numbers', () => {
    const hashtags = extractHashtags('#test_123 #hello_world');
    expect(hashtags).toEqual(['test_123', 'hello_world']);
  });
});

describe('extractMentions', () => {
  it('should extract all mentions from text', () => {
    const mentions = extractMentions('Hello @user @another @test');
    expect(mentions).toEqual(['user', 'another', 'test']);
  });

  it('should handle text without mentions', () => {
    const mentions = extractMentions('No mentions here');
    expect(mentions).toEqual([]);
  });

  it('should handle null and undefined', () => {
    expect(extractMentions(null)).toEqual([]);
    expect(extractMentions(undefined)).toEqual([]);
  });

  it('should handle mentions with underscores and numbers', () => {
    const mentions = extractMentions('@user_123 @test_user');
    expect(mentions).toEqual(['user_123', 'test_user']);
  });
});

describe('isValidHashtag', () => {
  it('should validate correct hashtags', () => {
    expect(isValidHashtag('test')).toBe(true);
    expect(isValidHashtag('#test')).toBe(true);
    expect(isValidHashtag('test_123')).toBe(true);
  });

  it('should reject invalid hashtags', () => {
    expect(isValidHashtag('')).toBe(false);
    expect(isValidHashtag('#')).toBe(false);
    expect(isValidHashtag('test@tag')).toBe(false);
    expect(isValidHashtag('test tag')).toBe(false);
  });

  it('should reject hashtags that are too long', () => {
    const longTag = 'a'.repeat(51);
    expect(isValidHashtag(longTag)).toBe(false);
  });
});

describe('isValidMention', () => {
  it('should validate correct mentions', () => {
    expect(isValidMention('user')).toBe(true);
    expect(isValidMention('@user')).toBe(true);
    expect(isValidMention('user_123')).toBe(true);
  });

  it('should reject invalid mentions', () => {
    expect(isValidMention('')).toBe(false);
    expect(isValidMention('@')).toBe(false);
    expect(isValidMention('user@name')).toBe(false);
    expect(isValidMention('user name')).toBe(false);
  });

  it('should reject mentions that are too long', () => {
    const longMention = 'a'.repeat(31);
    expect(isValidMention(longMention)).toBe(false);
  });
});

describe('countContentElements', () => {
  it('should count all elements correctly', () => {
    const text = 'Hello @user check #hashtag and #another';
    const counts = countContentElements(text);
    
    expect(counts.hashtags).toBe(2);
    expect(counts.mentions).toBe(1);
    expect(counts.words).toBe(6);
    expect(counts.characters).toBe(text.length);
  });

  it('should handle empty text', () => {
    const counts = countContentElements('');
    expect(counts.hashtags).toBe(0);
    expect(counts.mentions).toBe(0);
    expect(counts.words).toBe(0);
  });

  it('should count words correctly', () => {
    const counts = countContentElements('one two three');
    expect(counts.words).toBe(3);
  });
});

describe('truncateContent', () => {
  it('should truncate long text', () => {
    const longText = 'a'.repeat(150);
    const truncated = truncateContent(longText, 100);
    expect(truncated.length).toBeLessThanOrEqual(100);
    expect(truncated).toContain('...');
  });

  it('should not truncate short text', () => {
    const shortText = 'Short text';
    const truncated = truncateContent(shortText, 100);
    expect(truncated).toBe(shortText);
  });

  it('should preserve hashtags when truncating', () => {
    const text = 'Hello #world ' + 'a'.repeat(100);
    const truncated = truncateContent(text, 50);
    expect(truncated).toContain('#world');
  });

  it('should handle null and undefined', () => {
    expect(truncateContent(null)).toBe(null);
    expect(truncateContent(undefined)).toBe(undefined);
  });
});
