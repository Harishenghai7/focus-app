/**
 * Tests for formatDate utility
 */

import {
  formatDate,
  formatDatePresets,
  formatDateIntl,
  isToday,
  isYesterday,
  isThisYear,
  formatSmartDate
} from '../formatDate';

describe('formatDate', () => {
  const testDate = new Date('2025-11-16T14:30:45');
  
  describe('formatDate()', () => {
    it('should format date with default format', () => {
      const result = formatDate(testDate);
      expect(result).toBe('Nov 16, 2025');
    });
    
    it('should format date with custom format', () => {
      expect(formatDate(testDate, 'YYYY-MM-DD')).toBe('2025-11-16');
      expect(formatDate(testDate, 'MM/DD/YYYY')).toBe('11/16/2025');
      expect(formatDate(testDate, 'MMMM DD, YYYY')).toBe('November 16, 2025');
    });
    
    it('should format time correctly', () => {
      expect(formatDate(testDate, 'HH:mm:ss')).toBe('14:30:45');
      expect(formatDate(testDate, 'h:mm A')).toBe('2:30 PM');
      expect(formatDate(testDate, 'hh:mm a')).toBe('02:30 pm');
    });
    
    it('should handle ISO string input', () => {
      const result = formatDate('2025-11-16T14:30:45');
      expect(result).toBe('Nov 16, 2025');
    });
    
    it('should handle timestamp input', () => {
      const timestamp = testDate.getTime();
      const result = formatDate(timestamp);
      expect(result).toBe('Nov 16, 2025');
    });
    
    it('should handle invalid date', () => {
      expect(formatDate(null)).toBe('Invalid Date');
      expect(formatDate('invalid')).toBe('Invalid Date');
      expect(formatDate(undefined)).toBe('Invalid Date');
    });
    
    it('should pad single digits correctly', () => {
      const date = new Date('2025-01-05T08:05:09');
      expect(formatDate(date, 'MM/DD/YYYY')).toBe('01/05/2025');
      expect(formatDate(date, 'M/D/YYYY')).toBe('1/5/2025');
      expect(formatDate(date, 'HH:mm:ss')).toBe('08:05:09');
      expect(formatDate(date, 'H:m:s')).toBe('8:5:9');
    });
    
    it('should handle 12-hour format correctly', () => {
      const midnight = new Date('2025-11-16T00:30:00');
      const noon = new Date('2025-11-16T12:30:00');
      
      expect(formatDate(midnight, 'h:mm A')).toBe('12:30 AM');
      expect(formatDate(noon, 'h:mm A')).toBe('12:30 PM');
    });
  });
  
  describe('formatDatePresets', () => {
    it('should format short date', () => {
      expect(formatDatePresets.short(testDate)).toBe('Nov 16, 2025');
    });
    
    it('should format long date', () => {
      expect(formatDatePresets.long(testDate)).toBe('November 16, 2025');
    });
    
    it('should format numeric date', () => {
      expect(formatDatePresets.numeric(testDate)).toBe('11/16/2025');
    });
    
    it('should format ISO date', () => {
      expect(formatDatePresets.iso(testDate)).toBe('2025-11-16');
    });
    
    it('should format time only', () => {
      expect(formatDatePresets.time(testDate)).toBe('2:30 PM');
    });
    
    it('should format 24h time', () => {
      expect(formatDatePresets.time24(testDate)).toBe('14:30');
    });
    
    it('should format month and year', () => {
      expect(formatDatePresets.monthYear(testDate)).toBe('November 2025');
    });
    
    it('should format day and month', () => {
      expect(formatDatePresets.dayMonth(testDate)).toBe('Nov 16');
    });
  });
  
  describe('formatDateIntl()', () => {
    it('should format date using Intl.DateTimeFormat', () => {
      const result = formatDateIntl(testDate);
      expect(result).toContain('Nov');
      expect(result).toContain('16');
      expect(result).toContain('2025');
    });
    
    it('should accept custom options', () => {
      const result = formatDateIntl(testDate, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      expect(result).toContain('November');
    });
    
    it('should handle invalid date', () => {
      expect(formatDateIntl(null)).toBe('Invalid Date');
    });
  });
  
  describe('isToday()', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isToday(today)).toBe(true);
    });
    
    it('should return false for other dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
    
    it('should handle invalid date', () => {
      expect(isToday(null)).toBe(false);
      expect(isToday('invalid')).toBe(false);
    });
  });
  
  describe('isYesterday()', () => {
    it('should return true for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isYesterday(yesterday)).toBe(true);
    });
    
    it('should return false for other dates', () => {
      const today = new Date();
      expect(isYesterday(today)).toBe(false);
    });
    
    it('should handle invalid date', () => {
      expect(isYesterday(null)).toBe(false);
    });
  });
  
  describe('isThisYear()', () => {
    it('should return true for dates in current year', () => {
      const thisYear = new Date();
      expect(isThisYear(thisYear)).toBe(true);
    });
    
    it('should return false for dates in other years', () => {
      const lastYear = new Date('2024-01-01');
      expect(isThisYear(lastYear)).toBe(false);
    });
    
    it('should handle invalid date', () => {
      expect(isThisYear(null)).toBe(false);
    });
  });
  
  describe('formatSmartDate()', () => {
    it('should show time for today', () => {
      const today = new Date();
      const result = formatSmartDate(today);
      expect(result).toMatch(/\d{1,2}:\d{2} (AM|PM)/);
    });
    
    it('should show "Yesterday" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(formatSmartDate(yesterday)).toBe('Yesterday');
    });
    
    it('should show "MMM DD" for this year', () => {
      const thisYear = new Date('2025-06-15');
      const result = formatSmartDate(thisYear);
      expect(result).toMatch(/[A-Z][a-z]{2} \d{1,2}/);
    });
    
    it('should show full date for other years', () => {
      const lastYear = new Date('2024-06-15');
      const result = formatSmartDate(lastYear);
      expect(result).toContain('2024');
    });
    
    it('should handle invalid date', () => {
      expect(formatSmartDate(null)).toBe('Invalid Date');
    });
  });
});
