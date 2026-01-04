/**
 * Format Relative Time Utility
 * 
 * Provides relative time formatting functionality with dynamic updates
 * Input: Date object or ISO string
 * Output: "2 hours ago", "Just now", "3 days ago", etc.
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
 * Time units in milliseconds
 */
const TIME_UNITS = {
  year: 31536000000,
  month: 2592000000,
  week: 604800000,
  day: 86400000,
  hour: 3600000,
  minute: 60000,
  second: 1000
};

/**
 * Format relative time from now
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.addSuffix - Add "ago" or "in" suffix (default: true)
 * @param {boolean} options.short - Use short format (default: false)
 * @param {number} options.threshold - Threshold in ms to switch to absolute date (default: null)
 * @param {string} options.locale - Locale for formatting (default: 'en-US')
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, options = {}) => {
  const {
    addSuffix = true,
    short = false,
    threshold = null,
    locale = 'en-US'
  } = options;
  
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;
  
  // If threshold is set and difference exceeds it, return absolute date
  if (threshold && absDiffMs > threshold) {
    const formatter = new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return formatter.format(dateObj);
  }
  
  // Handle "just now" case (less than 10 seconds)
  if (absDiffMs < 10000) {
    return 'Just now';
  }
  
  // Find appropriate time unit
  let value;
  let unit;
  
  if (absDiffMs >= TIME_UNITS.year) {
    value = Math.floor(absDiffMs / TIME_UNITS.year);
    unit = 'year';
  } else if (absDiffMs >= TIME_UNITS.month) {
    value = Math.floor(absDiffMs / TIME_UNITS.month);
    unit = 'month';
  } else if (absDiffMs >= TIME_UNITS.week) {
    value = Math.floor(absDiffMs / TIME_UNITS.week);
    unit = 'week';
  } else if (absDiffMs >= TIME_UNITS.day) {
    value = Math.floor(absDiffMs / TIME_UNITS.day);
    unit = 'day';
  } else if (absDiffMs >= TIME_UNITS.hour) {
    value = Math.floor(absDiffMs / TIME_UNITS.hour);
    unit = 'hour';
  } else if (absDiffMs >= TIME_UNITS.minute) {
    value = Math.floor(absDiffMs / TIME_UNITS.minute);
    unit = 'minute';
  } else {
    value = Math.floor(absDiffMs / TIME_UNITS.second);
    unit = 'second';
  }
  
  // Format using short or long form
  if (short) {
    const shortUnits = {
      year: 'y',
      month: 'mo',
      week: 'w',
      day: 'd',
      hour: 'h',
      minute: 'm',
      second: 's'
    };
    return `${value}${shortUnits[unit]}`;
  }
  
  // Build relative time string
  const unitText = value === 1 ? unit : `${unit}s`;
  
  if (addSuffix) {
    return isPast ? `${value} ${unitText} ago` : `in ${value} ${unitText}`;
  }
  
  return `${value} ${unitText}`;
};

/**
 * Format relative time using Intl.RelativeTimeFormat
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.RelativeTimeFormat options
 * @param {string} locale - Locale string
 * @returns {string} Relative time string
 */
export const formatRelativeTimeIntl = (date, options = {}, locale = 'en-US') => {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    return 'Invalid Date';
  }
  
  const now = new Date();
  const diffMs = dateObj.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  
  // Handle "just now" case
  if (absDiffMs < 10000) {
    return 'Just now';
  }
  
  const defaultOptions = {
    numeric: 'auto',
    style: 'long'
  };
  
  const formatter = new Intl.RelativeTimeFormat(locale, { ...defaultOptions, ...options });
  
  // Find appropriate time unit
  let value;
  let unit;
  
  if (absDiffMs >= TIME_UNITS.year) {
    value = Math.round(diffMs / TIME_UNITS.year);
    unit = 'year';
  } else if (absDiffMs >= TIME_UNITS.month) {
    value = Math.round(diffMs / TIME_UNITS.month);
    unit = 'month';
  } else if (absDiffMs >= TIME_UNITS.week) {
    value = Math.round(diffMs / TIME_UNITS.week);
    unit = 'week';
  } else if (absDiffMs >= TIME_UNITS.day) {
    value = Math.round(diffMs / TIME_UNITS.day);
    unit = 'day';
  } else if (absDiffMs >= TIME_UNITS.hour) {
    value = Math.round(diffMs / TIME_UNITS.hour);
    unit = 'hour';
  } else if (absDiffMs >= TIME_UNITS.minute) {
    value = Math.round(diffMs / TIME_UNITS.minute);
    unit = 'minute';
  } else {
    value = Math.round(diffMs / TIME_UNITS.second);
    unit = 'second';
  }
  
  return formatter.format(value, unit);
};

/**
 * Get update interval for relative time
 * Returns appropriate interval (in ms) for updating the relative time display
 * @param {Date|string|number} date - Date to check
 * @returns {number|null} Update interval in milliseconds, or null if no update needed
 */
export const getRelativeTimeUpdateInterval = (date) => {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    return null;
  }
  
  const now = new Date();
  const absDiffMs = Math.abs(dateObj.getTime() - now.getTime());
  
  // Less than 1 minute: update every 10 seconds
  if (absDiffMs < TIME_UNITS.minute) {
    return 10000;
  }
  
  // Less than 1 hour: update every minute
  if (absDiffMs < TIME_UNITS.hour) {
    return TIME_UNITS.minute;
  }
  
  // Less than 1 day: update every hour
  if (absDiffMs < TIME_UNITS.day) {
    return TIME_UNITS.hour;
  }
  
  // Less than 1 week: update every day
  if (absDiffMs < TIME_UNITS.week) {
    return TIME_UNITS.day;
  }
  
  // Older: no need to update
  return null;
};

/**
 * Create a self-updating relative time formatter
 * @param {Date|string|number} date - Date to format
 * @param {Function} callback - Callback function to receive updated string
 * @param {Object} options - Formatting options (same as formatRelativeTime)
 * @returns {Function} Cleanup function to stop updates
 */
export const createRelativeTimeUpdater = (date, callback, options = {}) => {
  const dateObj = parseDate(date);
  
  if (!dateObj) {
    callback('Invalid Date');
    return () => {};
  }
  
  let intervalId = null;
  
  const update = () => {
    const formatted = formatRelativeTime(dateObj, options);
    callback(formatted);
    
    // Clear existing interval
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    // Set new interval based on current time difference
    const interval = getRelativeTimeUpdateInterval(dateObj);
    
    if (interval) {
      intervalId = setInterval(update, interval);
    }
  };
  
  // Initial update
  update();
  
  // Return cleanup function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  };
};

/**
 * Format time difference between two dates
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date
 * @param {Object} options - Formatting options
 * @returns {string} Time difference string
 */
export const formatTimeDifference = (startDate, endDate, options = {}) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start || !end) {
    return 'Invalid Date';
  }
  
  const { short = false } = options;
  
  const diffMs = Math.abs(end.getTime() - start.getTime());
  
  // Find appropriate time unit
  let value;
  let unit;
  
  if (diffMs >= TIME_UNITS.year) {
    value = Math.floor(diffMs / TIME_UNITS.year);
    unit = 'year';
  } else if (diffMs >= TIME_UNITS.month) {
    value = Math.floor(diffMs / TIME_UNITS.month);
    unit = 'month';
  } else if (diffMs >= TIME_UNITS.week) {
    value = Math.floor(diffMs / TIME_UNITS.week);
    unit = 'week';
  } else if (diffMs >= TIME_UNITS.day) {
    value = Math.floor(diffMs / TIME_UNITS.day);
    unit = 'day';
  } else if (diffMs >= TIME_UNITS.hour) {
    value = Math.floor(diffMs / TIME_UNITS.hour);
    unit = 'hour';
  } else if (diffMs >= TIME_UNITS.minute) {
    value = Math.floor(diffMs / TIME_UNITS.minute);
    unit = 'minute';
  } else {
    value = Math.floor(diffMs / TIME_UNITS.second);
    unit = 'second';
  }
  
  if (short) {
    const shortUnits = {
      year: 'y',
      month: 'mo',
      week: 'w',
      day: 'd',
      hour: 'h',
      minute: 'm',
      second: 's'
    };
    return `${value}${shortUnits[unit]}`;
  }
  
  const unitText = value === 1 ? unit : `${unit}s`;
  return `${value} ${unitText}`;
};

/**
 * Format detailed time difference with multiple units
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date
 * @param {Object} options - Formatting options
 * @returns {string} Detailed time difference string
 */
export const formatDetailedTimeDifference = (startDate, endDate, options = {}) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start || !end) {
    return 'Invalid Date';
  }
  
  const { short = false, maxUnits = 2 } = options;
  
  let diffMs = Math.abs(end.getTime() - start.getTime());
  const parts = [];
  
  const units = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];
  
  for (const unit of units) {
    if (parts.length >= maxUnits) break;
    
    const unitMs = TIME_UNITS[unit];
    if (diffMs >= unitMs) {
      const value = Math.floor(diffMs / unitMs);
      diffMs -= value * unitMs;
      
      if (short) {
        const shortUnits = {
          year: 'y',
          month: 'mo',
          week: 'w',
          day: 'd',
          hour: 'h',
          minute: 'm',
          second: 's'
        };
        parts.push(`${value}${shortUnits[unit]}`);
      } else {
        const unitText = value === 1 ? unit : `${unit}s`;
        parts.push(`${value} ${unitText}`);
      }
    }
  }
  
  if (parts.length === 0) {
    return short ? '0s' : '0 seconds';
  }
  
  return short ? parts.join(' ') : parts.join(', ');
};

/**
 * Check if date is in the past
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPast = (date) => {
  const dateObj = parseDate(date);
  if (!dateObj) return false;
  
  return dateObj.getTime() < Date.now();
};

/**
 * Check if date is in the future
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFuture = (date) => {
  const dateObj = parseDate(date);
  if (!dateObj) return false;
  
  return dateObj.getTime() > Date.now();
};

export default formatRelativeTime;
