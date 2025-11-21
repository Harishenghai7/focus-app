/**
 * Format Date Utility
 * 
 * Provides date formatting functionality with localization support
 * Input: Date object or ISO string
 * Output: Formatted date string (e.g., "Nov 16, 2025")
 */

/**
 * Parse input to Date object
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @returns {Date|null} Date object or null if invalid
 */
const parseDate = (date) => {
  if (!date) return null;
  
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Format date with custom format string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (default: 'MMM DD, YYYY')
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted date string
 * 
 * Supported format tokens:
 * - YYYY: 4-digit year (2025)
 * - YY: 2-digit year (25)
 * - MMMM: Full month name (November)
 * - MMM: Short month name (Nov)
 * - MM: 2-digit month (11)
 * - M: Month (11)
 * - DD: 2-digit day (16)
 * - D: Day (16)
 * - HH: 2-digit 24-hour (14)
 * - H: 24-hour (14)
 * - hh: 2-digit 12-hour (02)
 * - h: 12-hour (2)
 * - mm: 2-digit minutes (05)
 * - m: Minutes (5)
 * - ss: 2-digit seconds (09)
 * - s: Seconds (9)
 * - A: AM/PM
 * - a: am/pm
 */
export const formatDate = (date, format = 'MMM DD, YYYY', locale = 'en-US') => {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    return 'Invalid Date';
  }
  
  const pad = (num, size = 2) => String(num).padStart(size, '0');
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const seconds = dateObj.getSeconds();
  
  // Get localized month names
  const monthNames = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2000, i, 1);
    return {
      full: date.toLocaleDateString(locale, { month: 'long' }),
      short: date.toLocaleDateString(locale, { month: 'short' })
    };
  });
  
  const tokens = {
    YYYY: year,
    YY: String(year).slice(-2),
    MMMM: monthNames[month].full,
    MMM: monthNames[month].short,
    MM: pad(month + 1),
    M: month + 1,
    DD: pad(day),
    D: day,
    HH: pad(hours),
    H: hours,
    hh: pad(hours % 12 || 12),
    h: hours % 12 || 12,
    mm: pad(minutes),
    m: minutes,
    ss: pad(seconds),
    s: seconds,
    A: hours >= 12 ? 'PM' : 'AM',
    a: hours >= 12 ? 'pm' : 'am'
  };
  
  // Replace tokens in format string (longer tokens first to avoid conflicts)
  let formatted = format;
  const tokenKeys = Object.keys(tokens).sort((a, b) => b.length - a.length);
  
  tokenKeys.forEach(token => {
    formatted = formatted.replace(new RegExp(token, 'g'), tokens[token]);
  });
  
  return formatted;
};

/**
 * Format date with common presets
 */
export const formatDatePresets = {
  /**
   * Short date: "Nov 16, 2025"
   */
  short: (date, locale) => formatDate(date, 'MMM DD, YYYY', locale),
  
  /**
   * Long date: "November 16, 2025"
   */
  long: (date, locale) => formatDate(date, 'MMMM DD, YYYY', locale),
  
  /**
   * Full date with time: "Nov 16, 2025 at 2:30 PM"
   */
  full: (date, locale) => formatDate(date, 'MMM DD, YYYY [at] h:mm A', locale),
  
  /**
   * Numeric: "11/16/2025"
   */
  numeric: (date) => formatDate(date, 'MM/DD/YYYY'),
  
  /**
   * ISO date: "2025-11-16"
   */
  iso: (date) => formatDate(date, 'YYYY-MM-DD'),
  
  /**
   * Time only: "2:30 PM"
   */
  time: (date) => formatDate(date, 'h:mm A'),
  
  /**
   * Time 24h: "14:30"
   */
  time24: (date) => formatDate(date, 'HH:mm'),
  
  /**
   * Month and year: "November 2025"
   */
  monthYear: (date, locale) => formatDate(date, 'MMMM YYYY', locale),
  
  /**
   * Day and month: "Nov 16"
   */
  dayMonth: (date, locale) => formatDate(date, 'MMM DD', locale)
};

/**
 * Format date using Intl.DateTimeFormat (alternative approach)
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @param {string} locale - Locale string
 * @returns {string} Formatted date string
 */
export const formatDateIntl = (date, options = {}, locale = 'en-US') => {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    return 'Invalid Date';
  }
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  
  const formatter = new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options });
  return formatter.format(dateObj);
};

/**
 * Check if date is today
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  const dateObj = parseDate(date);
  if (!dateObj) return false;
  
  const today = new Date();
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear();
};

/**
 * Check if date is yesterday
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
export const isYesterday = (date) => {
  const dateObj = parseDate(date);
  if (!dateObj) return false;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.getDate() === yesterday.getDate() &&
         dateObj.getMonth() === yesterday.getMonth() &&
         dateObj.getFullYear() === yesterday.getFullYear();
};

/**
 * Check if date is in current year
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in current year
 */
export const isThisYear = (date) => {
  const dateObj = parseDate(date);
  if (!dateObj) return false;
  
  return dateObj.getFullYear() === new Date().getFullYear();
};

/**
 * Get smart date format based on recency
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale string
 * @returns {string} Formatted date string
 * 
 * Returns:
 * - "h:mm A" for today
 * - "Yesterday" for yesterday
 * - "MMM DD" for this year
 * - "MMM DD, YYYY" for other years
 */
export const formatSmartDate = (date, locale = 'en-US') => {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    return 'Invalid Date';
  }
  
  if (isToday(dateObj)) {
    return formatDate(dateObj, 'h:mm A', locale);
  }
  
  if (isYesterday(dateObj)) {
    return 'Yesterday';
  }
  
  if (isThisYear(dateObj)) {
    return formatDate(dateObj, 'MMM DD', locale);
  }
  
  return formatDate(dateObj, 'MMM DD, YYYY', locale);
};

/**
 * Format date as relative time ago (e.g., "2 hours ago", "3 days ago")
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted relative time string
 */
export const formatTimeAgo = (date) => {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const seconds = Math.floor((now - dateObj) / 1000);
  
  if (seconds < 0) {
    return 'just now';
  }
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  // Less than a minute
  if (seconds < 60) {
    return 'just now';
  }
  
  // Find the appropriate interval
  for (const [name, secondsInInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInInterval);
    
    if (interval >= 1) {
      return interval === 1 ? `1 ${name} ago` : `${interval} ${name}s ago`;
    }
  }
  
  return 'just now';
};

export default formatDate;
