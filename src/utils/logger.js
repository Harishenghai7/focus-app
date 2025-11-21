/**
 * Centralized logging utility for the application
 * Provides consistent logging with different log levels and environment-based filtering
 */

// Log levels in order of importance
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Current log level based on environment
const CURRENT_LEVEL = (() => {
  const env = process.env.NODE_ENV || 'development';
  switch (env) {
    case 'production':
      return LOG_LEVELS.warn;
    case 'test':
      return LOG_LEVELS.error;
    default:
      return LOG_LEVELS.debug;
  }
})();

/**
 * Base logger function that handles all log messages
 * @private
 */
function log(level, message, data = {}) {
  // Skip if current log level is lower than message level
  if (LOG_LEVELS[level] > CURRENT_LEVEL) return;

  const timestamp = new Date().toISOString();
  const logEntry = { timestamp, level, message };

  // Add data if provided
  if (data && Object.keys(data).length > 0) {
    logEntry.data = data;
  }

  // Get the calling function name for better debugging
  try {
    const error = new Error();
    const stack = error.stack.split('\n');
    // The 4th line in the stack trace is the caller of our log function
    if (stack.length > 3) {
      const caller = stack[3].trim().match(/at\s+(\S+)/);
      if (caller && caller[1]) {
        logEntry.source = caller[1];
      }
    }
  } catch (e) {
    // Ignore errors in stack trace parsing
  }

  // Log to console with appropriate level
  const consoleMethod = console[level] || console.log;
  
  // In non-production, include the source in the console message
  const consoleMessage = process.env.NODE_ENV !== 'production' && logEntry.source
    ? `[${level.toUpperCase()}] [${logEntry.source}] ${message}`
    : `[${level.toUpperCase()}] ${message}`;

  // Log to console with appropriate level
  if (level === 'error') {
    console.error(consoleMessage, logEntry.data || '');
  } else if (level === 'warn') {
    console.warn(consoleMessage, logEntry.data || '');
  } else if (level === 'info') {
    console.info(consoleMessage, logEntry.data || '');
  } else {
    console.log(consoleMessage, logEntry.data || '');
  }

  // In production, you might want to send errors to a logging service
  if (process.env.NODE_ENV === 'production' && level === 'error') {
    // Example: Send error to logging service
    // sendToLoggingService(logEntry);
  }
}

// Public API
export const logger = {
  /**
   * Log an error message
   * @param {string} message - The message to log
   * @param {Object} [data] - Additional data to include in the log
   */
  error: (message, data) => log('error', message, data),
  
  /**
   * Log a warning message
   * @param {string} message - The message to log
   * @param {Object} [data] - Additional data to include in the log
   */
  warn: (message, data) => log('warn', message, data),
  
  /**
   * Log an informational message
   * @param {string} message - The message to log
   * @param {Object} [data] - Additional data to include in the log
   */
  info: (message, data) => log('info', message, data),
  
  /**
   * Log a debug message (only in development)
   * @param {string} message - The message to log
   * @param {Object} [data] - Additional data to include in the log
   */
  debug: (message, data) => log('debug', message, data),
};

// Export individual functions for direct import
export const logError = logger.error;
export const logWarn = logger.warn;
export const logInfo = logger.info;
export const logDebug = logger.debug;

export default logger;
