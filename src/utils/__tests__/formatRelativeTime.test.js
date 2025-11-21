/**
 * Tests for formatRelativeTime utility
 */

import {
  formatRelativeTime,
  formatRelativeTimeIntl,
  getRelativeTimeUpdateInterval,
  createRelativeTimeUpdater,
  formatTimeDifference,
  formatDetailedTimeDifference,
  isPast,
  isFuture
} from '../formatRelativeTime';

describe('formatRelativeTime', () => {
  describe('formatRelativeTime()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-16T12:00:00'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should return "Just now" for very recent times', () => {
      const date = new Date('2025-11-16T11:59:55'); // 5 seconds ago
      expect(formatRelativeTime(date)).toBe('Just now');
    });
    
    it('should format seconds ago', () => {
      const date = new Date('2025-11-16T11:59:30'); // 30 seconds ago
      expect(formatRelativeTime(date)).toBe('30 seconds ago');
    });
    
    it('should format minutes ago', () => {
      const date = new Date('2025-11-16T11:55:00'); // 5 minutes ago
      expect(formatRelativeTime(date)).toBe('5 minutes ago');
      
      const oneMinuteAgo = new Date('2025-11-16T11:59:00'); // 1 minute ago
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');
    });
    
    it('should format hours ago', () => {
      const date = new Date('2025-11-16T10:00:00'); // 2 hours ago
      expect(formatRelativeTime(date)).toBe('2 hours ago');
      
      const oneHourAgo = new Date('2025-11-16T11:00:00'); // 1 hour ago
      expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');
    });
    
    it('should format days ago', () => {
      const date = new Date('2025-11-14T12:00:00'); // 2 days ago
      expect(formatRelativeTime(date)).toBe('2 days ago');
      
      const oneDayAgo = new Date('2025-11-15T12:00:00'); // 1 day ago
      expect(formatRelativeTime(oneDayAgo)).toBe('1 day ago');
    });
    
    it('should format weeks ago', () => {
      const date = new Date('2025-11-02T12:00:00'); // 2 weeks ago
      expect(formatRelativeTime(date)).toBe('2 weeks ago');
    });
    
    it('should format months ago', () => {
      const date = new Date('2025-09-16T12:00:00'); // 2 months ago
      expect(formatRelativeTime(date)).toBe('2 months ago');
    });
    
    it('should format years ago', () => {
      const date = new Date('2023-11-16T12:00:00'); // 2 years ago
      expect(formatRelativeTime(date)).toBe('2 years ago');
    });
    
    it('should format future times', () => {
      const date = new Date('2025-11-16T14:00:00'); // 2 hours from now
      expect(formatRelativeTime(date)).toBe('in 2 hours');
    });
    
    it('should handle short format', () => {
      const date = new Date('2025-11-16T10:00:00'); // 2 hours ago
      expect(formatRelativeTime(date, { short: true })).toBe('2h');
      
      const days = new Date('2025-11-14T12:00:00'); // 2 days ago
      expect(formatRelativeTime(days, { short: true })).toBe('2d');
    });
    
    it('should handle addSuffix option', () => {
      const date = new Date('2025-11-16T10:00:00'); // 2 hours ago
      expect(formatRelativeTime(date, { addSuffix: false })).toBe('2 hours');
    });
    
    it('should handle threshold option', () => {
      const date = new Date('2025-11-14T12:00:00'); // 2 days ago
      const result = formatRelativeTime(date, { threshold: 86400000 }); // 1 day threshold
      expect(result).toContain('Nov');
      expect(result).toContain('14');
    });
    
    it('should handle invalid date', () => {
      expect(formatRelativeTime(null)).toBe('Invalid Date');
      expect(formatRelativeTime('invalid')).toBe('Invalid Date');
    });
    
    it('should handle ISO string input', () => {
      const result = formatRelativeTime('2025-11-16T10:00:00');
      expect(result).toBe('2 hours ago');
    });
    
    it('should handle timestamp input', () => {
      const timestamp = new Date('2025-11-16T10:00:00').getTime();
      const result = formatRelativeTime(timestamp);
      expect(result).toBe('2 hours ago');
    });
  });
  
  describe('formatRelativeTimeIntl()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-16T12:00:00'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should format using Intl.RelativeTimeFormat', () => {
      const date = new Date('2025-11-16T10:00:00'); // 2 hours ago
      const result = formatRelativeTimeIntl(date);
      expect(result).toContain('2');
      expect(result).toContain('hour');
    });
    
    it('should return "Just now" for very recent times', () => {
      const date = new Date('2025-11-16T11:59:55');
      expect(formatRelativeTimeIntl(date)).toBe('Just now');
    });
    
    it('should handle style option', () => {
      const date = new Date('2025-11-16T10:00:00');
      const result = formatRelativeTimeIntl(date, { style: 'short' });
      expect(result).toBeTruthy();
    });
    
    it('should handle invalid date', () => {
      expect(formatRelativeTimeIntl(null)).toBe('Invalid Date');
    });
  });
  
  describe('getRelativeTimeUpdateInterval()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-16T12:00:00'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should return 10 seconds for very recent times', () => {
      const date = new Date('2025-11-16T11:59:30'); // 30 seconds ago
      expect(getRelativeTimeUpdateInterval(date)).toBe(10000);
    });
    
    it('should return 1 minute for times less than 1 hour', () => {
      const date = new Date('2025-11-16T11:30:00'); // 30 minutes ago
      expect(getRelativeTimeUpdateInterval(date)).toBe(60000);
    });
    
    it('should return 1 hour for times less than 1 day', () => {
      const date = new Date('2025-11-16T06:00:00'); // 6 hours ago
      expect(getRelativeTimeUpdateInterval(date)).toBe(3600000);
    });
    
    it('should return 1 day for times less than 1 week', () => {
      const date = new Date('2025-11-13T12:00:00'); // 3 days ago
      expect(getRelativeTimeUpdateInterval(date)).toBe(86400000);
    });
    
    it('should return null for times more than 1 week', () => {
      const date = new Date('2025-11-01T12:00:00'); // 15 days ago
      expect(getRelativeTimeUpdateInterval(date)).toBeNull();
    });
    
    it('should handle invalid date', () => {
      expect(getRelativeTimeUpdateInterval(null)).toBeNull();
    });
  });
  
  describe('createRelativeTimeUpdater()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-16T12:00:00'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should call callback with initial value', () => {
      const callback = jest.fn();
      const date = new Date('2025-11-16T10:00:00');
      
      createRelativeTimeUpdater(date, callback);
      
      expect(callback).toHaveBeenCalledWith('2 hours ago');
    });
    
    it('should update callback at appropriate intervals', () => {
      const callback = jest.fn();
      const date = new Date('2025-11-16T11:59:00'); // 1 minute ago
      
      createRelativeTimeUpdater(date, callback);
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('1 minute ago');
      
      // Advance time by 1 minute
      jest.advanceTimersByTime(60000);
      
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('2 minutes ago');
    });
    
    it('should return cleanup function', () => {
      const callback = jest.fn();
      const date = new Date('2025-11-16T11:59:00');
      
      const cleanup = createRelativeTimeUpdater(date, callback);
      
      expect(typeof cleanup).toBe('function');
      
      cleanup();
      
      // Advance time and ensure no more updates
      const callCount = callback.mock.calls.length;
      jest.advanceTimersByTime(60000);
      
      expect(callback).toHaveBeenCalledTimes(callCount);
    });
    
    it('should handle invalid date', () => {
      const callback = jest.fn();
      
      createRelativeTimeUpdater(null, callback);
      
      expect(callback).toHaveBeenCalledWith('Invalid Date');
    });
  });
  
  describe('formatTimeDifference()', () => {
    it('should format time difference', () => {
      const start = new Date('2025-11-16T10:00:00');
      const end = new Date('2025-11-16T12:00:00');
      
      expect(formatTimeDifference(start, end)).toBe('2 hours');
    });
    
    it('should handle short format', () => {
      const start = new Date('2025-11-16T10:00:00');
      const end = new Date('2025-11-16T12:00:00');
      
      expect(formatTimeDifference(start, end, { short: true })).toBe('2h');
    });
    
    it('should handle reversed dates', () => {
      const start = new Date('2025-11-16T12:00:00');
      const end = new Date('2025-11-16T10:00:00');
      
      expect(formatTimeDifference(start, end)).toBe('2 hours');
    });
    
    it('should handle invalid dates', () => {
      expect(formatTimeDifference(null, new Date())).toBe('Invalid Date');
      expect(formatTimeDifference(new Date(), null)).toBe('Invalid Date');
    });
  });
  
  describe('formatDetailedTimeDifference()', () => {
    it('should format detailed time difference', () => {
      const start = new Date('2025-11-16T10:30:00');
      const end = new Date('2025-11-16T13:45:00');
      
      const result = formatDetailedTimeDifference(start, end);
      expect(result).toContain('3 hours');
      expect(result).toContain('15 minutes');
    });
    
    it('should respect maxUnits option', () => {
      const start = new Date('2025-11-16T10:30:15');
      const end = new Date('2025-11-16T13:45:30');
      
      const result = formatDetailedTimeDifference(start, end, { maxUnits: 1 });
      expect(result).toBe('3 hours');
    });
    
    it('should handle short format', () => {
      const start = new Date('2025-11-16T10:30:00');
      const end = new Date('2025-11-16T13:45:00');
      
      const result = formatDetailedTimeDifference(start, end, { short: true });
      expect(result).toContain('3h');
      expect(result).toContain('15m');
    });
    
    it('should handle zero difference', () => {
      const date = new Date('2025-11-16T12:00:00');
      
      const result = formatDetailedTimeDifference(date, date);
      expect(result).toBe('0 seconds');
    });
    
    it('should handle invalid dates', () => {
      expect(formatDetailedTimeDifference(null, new Date())).toBe('Invalid Date');
    });
  });
  
  describe('isPast()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-16T12:00:00'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should return true for past dates', () => {
      const date = new Date('2025-11-16T10:00:00');
      expect(isPast(date)).toBe(true);
    });
    
    it('should return false for future dates', () => {
      const date = new Date('2025-11-16T14:00:00');
      expect(isPast(date)).toBe(false);
    });
    
    it('should handle invalid date', () => {
      expect(isPast(null)).toBe(false);
    });
  });
  
  describe('isFuture()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-11-16T12:00:00'));
    });
    
    afterEach(() => {
      jest.useRealTimers();
    });
    
    it('should return true for future dates', () => {
      const date = new Date('2025-11-16T14:00:00');
      expect(isFuture(date)).toBe(true);
    });
    
    it('should return false for past dates', () => {
      const date = new Date('2025-11-16T10:00:00');
      expect(isFuture(date)).toBe(false);
    });
    
    it('should handle invalid date', () => {
      expect(isFuture(null)).toBe(false);
    });
  });
});
