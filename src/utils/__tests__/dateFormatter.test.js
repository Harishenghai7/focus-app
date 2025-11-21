/**
 * Unit Tests for Date Formatter Utilities
 */

import {
  formatRelativeTime,
  formatDate,
  formatTime,
  formatDateTime,
  formatMessageTime,
  formatExpiry,
  formatDuration,
  isToday,
  isYesterday,
  isThisWeek,
  getTimeAgoFull,
  formatCalendar,
  parseDate
} from '../dateFormatter';

describe('formatRelativeTime', () => {
  it('should format recent times correctly', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('Just now');
    
    const fiveSecondsAgo = new Date(now.getTime() - 5000);
    expect(formatRelativeTime(fiveSecondsAgo)).toBe('5s ago');
    
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1m ago');
    
    const oneHourAgo = new Date(now.getTime() - 3600000);
    expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
  });

  it('should format days correctly', () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 3600000);
    expect(formatRelativeTime(oneDayAgo)).toBe('1d ago');
    
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 3600000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });

  it('should format weeks correctly', () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 3600000);
    expect(formatRelativeTime(oneWeekAgo)).toBe('1w ago');
  });

  it('should format months correctly', () => {
    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 3600000);
    expect(formatRelativeTime(oneMonthAgo)).toBe('1mo ago');
  });

  it('should format years correctly', () => {
    const now = new Date();
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 3600000);
    expect(formatRelativeTime(oneYearAgo)).toBe('1y ago');
  });
});

describe('formatDate', () => {
  it('should format dates correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toContain('Jan');
    expect(formatted).toContain('15');
    expect(formatted).toContain('2024');
  });

  it('should accept custom options', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date, { month: 'long' });
    expect(formatted).toContain('January');
  });
});

describe('formatTime', () => {
  it('should format time correctly', () => {
    const date = new Date('2024-01-15T15:30:00');
    const formatted = formatTime(date);
    expect(formatted).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('formatDateTime', () => {
  it('should format date and time together', () => {
    const date = new Date('2024-01-15T15:30:00');
    const formatted = formatDateTime(date);
    expect(formatted).toContain('at');
    expect(formatted).toContain('Jan');
  });
});

describe('formatDuration', () => {
  it('should format seconds correctly', () => {
    expect(formatDuration(30)).toBe('0:30');
    expect(formatDuration(90)).toBe('1:30');
  });

  it('should format minutes correctly', () => {
    expect(formatDuration(300)).toBe('5:00');
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('should handle zero and negative values', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(-10)).toBe('0:00');
  });

  it('should pad seconds with zero', () => {
    expect(formatDuration(65)).toBe('1:05');
  });
});

describe('formatExpiry', () => {
  it('should format future expiry times', () => {
    const now = new Date();
    const in30Minutes = new Date(now.getTime() + 30 * 60000);
    expect(formatExpiry(in30Minutes)).toBe('30m left');
    
    const in2Hours = new Date(now.getTime() + 2 * 3600000);
    expect(formatExpiry(in2Hours)).toBe('2h left');
  });

  it('should show expired for past dates', () => {
    const past = new Date(Date.now() - 1000);
    expect(formatExpiry(past)).toBe('Expired');
  });
});

describe('isToday', () => {
  it('should return true for today', () => {
    const now = new Date();
    expect(isToday(now)).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});

describe('isYesterday', () => {
  it('should return true for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isYesterday(yesterday)).toBe(true);
  });

  it('should return false for today', () => {
    const now = new Date();
    expect(isYesterday(now)).toBe(false);
  });
});

describe('isThisWeek', () => {
  it('should return true for dates within the last 7 days', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    expect(isThisWeek(threeDaysAgo)).toBe(true);
  });

  it('should return false for dates older than 7 days', () => {
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);
    expect(isThisWeek(eightDaysAgo)).toBe(false);
  });
});

describe('getTimeAgoFull', () => {
  it('should return full text for time ago', () => {
    const now = new Date();
    expect(getTimeAgoFull(now)).toBe('Just now');
    
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    expect(getTimeAgoFull(oneMinuteAgo)).toBe('1 minute ago');
    
    const twoMinutesAgo = new Date(now.getTime() - 120000);
    expect(getTimeAgoFull(twoMinutesAgo)).toBe('2 minutes ago');
  });

  it('should handle yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(getTimeAgoFull(yesterday)).toBe('Yesterday');
  });
});

describe('parseDate', () => {
  it('should parse valid date strings', () => {
    const result = parseDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
  });

  it('should return current date for invalid strings', () => {
    const result = parseDate('invalid');
    expect(result).toBeInstanceOf(Date);
  });

  it('should handle ISO date strings', () => {
    const isoString = '2024-01-15T15:30:00.000Z';
    const result = parseDate(isoString);
    expect(result).toBeInstanceOf(Date);
  });
});

describe('formatCalendar', () => {
  it('should format today with "Today"', () => {
    const now = new Date();
    const result = formatCalendar(now);
    expect(result).toContain('Today');
  });

  it('should format yesterday with "Yesterday"', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const result = formatCalendar(yesterday);
    expect(result).toContain('Yesterday');
  });

  it('should format this week with day name', () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const result = formatCalendar(threeDaysAgo);
    expect(result).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
  });
});
