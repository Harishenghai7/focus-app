/**
 * Security Event Logger
 * 
 * A centralized logging system for security-related events in the application.
 * Handles logging, rate limiting, and alerting for suspicious activities.
 * 
 * Features:
 * - Structured logging for security events
 * - Rate limiting to prevent log flooding
 * - Integration with monitoring services
 * - Anonymization of sensitive data
 * - Configurable log levels and destinations
 */

import { v4 as uuidv4 } from 'uuid';
import { getFingerprint } from './deviceFingerprint';

// Default configuration
const DEFAULT_CONFIG = {
  // Log levels: 'debug' | 'info' | 'warn' | 'error' | 'critical'
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  
  // Maximum events per minute before rate limiting kicks in
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 100, // Max events per windowMs
  },
  
  // Whether to send logs to remote server
  remoteLogging: process.env.NODE_ENV === 'production',
  
  // Remote logging endpoint
  remoteEndpoint: '/api/security/logs',
  
  // Whether to include device fingerprint in logs
  includeFingerprint: true,
  
  // Whether to include user info in logs
  includeUserInfo: true,
  
  // Whether to include IP address in logs (requires backend support)
  includeIpAddress: true,
  
  // Whether to enable console logging
  consoleLogging: process.env.NODE_ENV !== 'production',
  
  // Sensitive fields to redact from logs
  sensitiveFields: [
    'password',
    'token',
    'access_token',
    'refresh_token',
    'authorization',
    'api_key',
    'apikey',
    'secret',
    'credit_card',
    'ssn',
  ],
};

// Log levels for filtering
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4,
};

// Rate limiting state
const rateLimitState = {
  count: 0,
  resetTime: 0,
  isRateLimited: false,
};

// Cache for device fingerprint
let deviceFingerprint = null;

class SecurityLogger {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = uuidv4();
    this.initialize();
  }

  /**
   * Initialize the logger
   */
  async initialize() {
    // Initialize device fingerprint
    if (this.config.includeFingerprint) {
      try {
        deviceFingerprint = await getFingerprint();
      } catch (error) {
        console.error('Failed to initialize device fingerprint:', error);
      }
    }

    // Setup rate limit reset
    setInterval(() => {
      rateLimitState.count = 0;
      rateLimitState.isRateLimited = false;
      rateLimitState.resetTime = Date.now() + this.config.rateLimit.windowMs;
    }, this.config.rateLimit.windowMs);

    // Log initialization
    this.info('Security logger initialized', {
      logLevel: this.config.logLevel,
      sessionId: this.sessionId,
    });
  }

  /**
   * Check if logging is enabled for the given level
   */
  isLevelEnabled(level) {
    const currentLevel = LOG_LEVELS[this.config.logLevel.toLowerCase()] || 0;
    const messageLevel = LOG_LEVELS[level.toLowerCase()] || 0;
    return messageLevel >= currentLevel;
  }

  /**
   * Check if rate limited
   */
  isRateLimited() {
    if (rateLimitState.isRateLimited) {
      if (Date.now() > rateLimitState.resetTime) {
        rateLimitState.isRateLimited = false;
        rateLimitState.count = 0;
        return false;
      }
      return true;
    }

    if (rateLimitState.count >= this.config.rateLimit.max) {
      rateLimitState.isRateLimited = true;
      rateLimitState.resetTime = Date.now() + this.config.rateLimit.windowMs;
      return true;
    }

    return false;
  }

  /**
   * Sanitize data by removing or redacting sensitive information
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      // Check if key matches any sensitive fields (case insensitive)
      const isSensitive = this.config.sensitiveFields.some(
        field => field.toLowerCase() === key.toLowerCase()
      );
      
      if (isSensitive) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        result[key] = this.sanitizeData(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Create a log entry
   */
  async createLogEntry(level, message, data = {}) {
    // Check log level
    if (!this.isLevelEnabled(level)) {
      return null;
    }

    // Check rate limiting
    if (this.isRateLimited()) {
      if (this.config.consoleLogging) {
        console.warn(`[SecurityLogger] Rate limited: ${message}`);
      }
      return null;
    }

    // Increment rate limit counter
    rateLimitState.count++;

    // Create log entry
    const timestamp = new Date().toISOString();
    const logEntry = {
      id: uuidv4(),
      timestamp,
      level: level.toLowerCase(),
      message,
      sessionId: this.sessionId,
      ...(deviceFingerprint && { deviceFingerprint }),
      ...(this.config.includeUserInfo && {
        // This would be populated with actual user info when available
        userId: data.userId || 'anonymous',
      }),
      data: this.sanitizeData(data),
    };

    // Remove the userId from data to avoid duplication
    if (data.userId) {
      delete data.userId;
    }

    return logEntry;
  }

  /**
   * Send log to remote server
   */
  async sendToRemote(logEntry) {
    if (!this.config.remoteLogging || !this.config.remoteEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Security-Event': 'true',
        },
        body: JSON.stringify(logEntry),
      });

      if (!response.ok) {
        console.error('Failed to send security log to server:', await response.text());
      }
    } catch (error) {
      console.error('Error sending security log:', error);
    }
  }

  /**
   * Log a debug message
   */
  async debug(message, data = {}) {
    const logEntry = await this.createLogEntry('debug', message, data);
    if (!logEntry) return;

    if (this.config.consoleLogging) {
      console.debug(`[Security][DEBUG] ${message}`, logEntry);
    }

    await this.sendToRemote(logEntry);
  }

  /**
   * Log an info message
   */
  async info(message, data = {}) {
    const logEntry = await this.createLogEntry('info', message, data);
    if (!logEntry) return;

    if (this.config.consoleLogging) {
      console.info(`[Security][INFO] ${message}`, logEntry);
    }

    await this.sendToRemote(logEntry);
  }

  /**
   * Log a warning
   */
  async warn(message, data = {}) {
    const logEntry = await this.createLogEntry('warn', message, data);
    if (!logEntry) return;

    if (this.config.consoleLogging) {
      console.warn(`[Security][WARN] ${message}`, logEntry);
    }

    await this.sendToRemote(logEntry);
  }

  /**
   * Log an error
   */
  async error(message, data = {}) {
    const logEntry = await this.createLogEntry('error', message, data);
    if (!logEntry) return;

    if (this.config.consoleLogging) {
      console.error(`[Security][ERROR] ${message}`, logEntry);
    }

    await this.sendToRemote(logEntry);
  }

  /**
   * Log a critical security event
   */
  async critical(message, data = {}) {
    const logEntry = await this.createLogEntry('critical', message, data);
    if (!logEntry) return;

    if (this.config.consoleLogging) {
      console.error(`[Security][CRITICAL] ${message}`, logEntry);
    }

    // For critical events, we might want to take additional actions
    // like sending an alert to the security team
    await this.sendToRemote({
      ...logEntry,
      priority: 'high',
      requiresAttention: true,
    });
  }

  /**
   * Log a security event with custom level
   */
  async log(level, message, data = {}) {
    const method = this[level.toLowerCase()];
    if (typeof method === 'function') {
      return method.call(this, message, data);
    }
    return this.info(message, { ...data, originalLevel: level });
  }
}

// Create a default instance
export const securityLogger = new SecurityLogger();

// Export for direct usage
export const logSecurityEvent = securityLogger.log.bind(securityLogger);
export const logSecurityDebug = securityLogger.debug.bind(securityLogger);
export const logSecurityInfo = securityLogger.info.bind(securityLogger);
export const logSecurityWarn = securityLogger.warn.bind(securityLogger);
export const logSecurityError = securityLogger.error.bind(securityLogger);
export const logSecurityCritical = securityLogger.critical.bind(securityLogger);

// Export the class for custom instances
export default SecurityLogger;
