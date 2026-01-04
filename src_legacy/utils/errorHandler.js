// Global error handler with user-friendly messages and retry logic
import { logError } from './errorLogger';
import { captureException, addBreadcrumb } from './errorTracking';

// Error types
export const ErrorTypes = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  PERMISSION: 'PERMISSION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT: 'RATE_LIMIT',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

// Custom error class
export class AppError extends Error {
  constructor(message, code = ErrorTypes.UNKNOWN, statusCode = 500, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// User-friendly error messages
const errorMessages = {
  [ErrorTypes.NETWORK]: 'Unable to connect. Please check your internet connection and try again.',
  [ErrorTypes.AUTH]: 'Authentication failed. Please log in again.',
  [ErrorTypes.VALIDATION]: 'Please check your input and try again.',
  [ErrorTypes.PERMISSION]: "You don't have permission to perform this action.",
  [ErrorTypes.NOT_FOUND]: 'The requested content was not found.',
  [ErrorTypes.RATE_LIMIT]: 'Too many requests. Please slow down and try again in a moment.',
  [ErrorTypes.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorTypes.TIMEOUT]: 'Request timed out. Please check your connection and try again.',
  [ErrorTypes.UNKNOWN]: 'An unexpected error occurred. Please try again.'
};

// Classify error type
export const classifyError = (error) => {
  if (!error) return ErrorTypes.UNKNOWN;
  
  // Network errors
  if (
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('Network') ||
    error.message?.includes('NetworkError') ||
    !navigator.onLine
  ) {
    return ErrorTypes.NETWORK;
  }
  
  // Auth errors
  if (
    error.status === 401 ||
    error.status === 403 ||
    error.message?.includes('JWT') ||
    error.message?.includes('auth') ||
    error.message?.includes('unauthorized')
  ) {
    return ErrorTypes.AUTH;
  }
  
  // Validation errors
  if (
    error.status === 400 ||
    error.message?.includes('validation') ||
    error.message?.includes('invalid')
  ) {
    return ErrorTypes.VALIDATION;
  }
  
  // Permission errors
  if (error.status === 403) {
    return ErrorTypes.PERMISSION;
  }
  
  // Not found errors
  if (error.status === 404) {
    return ErrorTypes.NOT_FOUND;
  }
  
  // Rate limit errors
  if (error.status === 429) {
    return ErrorTypes.RATE_LIMIT;
  }
  
  // Timeout errors
  if (
    error.message?.includes('timeout') ||
    error.message?.includes('ETIMEDOUT')
  ) {
    return ErrorTypes.TIMEOUT;
  }
  
  // Server errors
  if (error.status >= 500) {
    return ErrorTypes.SERVER;
  }
  
  return ErrorTypes.UNKNOWN;
};

// Get user-friendly message
export const getUserFriendlyMessage = (error) => {
  const errorType = classifyError(error);
  return errorMessages[errorType] || errorMessages[ErrorTypes.UNKNOWN];
};

// Handle error with logging and user notification
export const handleError = (error, context = {}) => {
  const errorType = classifyError(error);
  const userMessage = getUserFriendlyMessage(error);
  
  // Log error
  logError(error, {
    ...context,
    errorType,
    isOperational: error?.isOperational !== false
  });
  
  // Send to error tracking service
  captureException(error, {
    ...context,
    errorType,
    userMessage
  });
  
  // Return structured error info
  return {
    type: errorType,
    message: userMessage,
    originalError: error,
    shouldRetry: shouldRetryError(errorType),
    retryDelay: getRetryDelay(errorType)
  };
};

// Determine if error should be retried
const shouldRetryError = (errorType) => {
  const retryableErrors = [
    ErrorTypes.NETWORK,
    ErrorTypes.TIMEOUT,
    ErrorTypes.SERVER
  ];
  
  return retryableErrors.includes(errorType);
};

// Get retry delay based on error type
const getRetryDelay = (errorType) => {
  const delays = {
    [ErrorTypes.NETWORK]: 1000,
    [ErrorTypes.TIMEOUT]: 2000,
    [ErrorTypes.SERVER]: 3000,
    [ErrorTypes.RATE_LIMIT]: 5000
  };
  
  return delays[errorType] || 1000;
};

// Retry logic with exponential backoff
export const retryWithBackoff = async (
  fn,
  maxRetries = 3,
  baseDelay = 1000,
  maxDelay = 10000
) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      const errorInfo = handleError(error, { attempt, maxRetries });
      
      // Don't retry if error is not retryable
      if (!errorInfo.shouldRetry || attempt === maxRetries) {
        throw new AppError(
          errorInfo.message,
          errorInfo.type,
          error.status,
          true
        );
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt),
        maxDelay
      );
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  throw lastError;
};

// Timeout wrapper
export const withTimeout = (promise, timeoutMs = 30000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new AppError('Request timed out', ErrorTypes.TIMEOUT, 408)),
        timeoutMs
      )
    )
  ]);
};

// Safe async wrapper
export const safeAsync = async (fn, fallback = null, context = {}) => {
  try {
    return await fn();
  } catch (error) {
    const errorInfo = handleError(error, context);
    return fallback;
  }
};

// Batch error handler for multiple operations
export const handleBatchErrors = (results) => {
  const errors = results.filter(r => r.status === 'rejected');
  const successes = results.filter(r => r.status === 'fulfilled');
  
  if (errors.length > 0) {
    errors.forEach((error, index) => {
      handleError(error.reason, { batchIndex: index });
    });
  }
  
  return {
    successes: successes.map(r => r.value),
    errors: errors.map(r => r.reason),
    successCount: successes.length,
    errorCount: errors.length
  };
};

// Show error notification to user
export const showErrorNotification = (error, duration = 5000) => {
  const errorInfo = handleError(error);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.innerHTML = `
    <div class="error-notification-content">
      <span class="error-notification-icon">⚠️</span>
      <div class="error-notification-text">
        <strong>Error</strong>
        <p>${errorInfo.message}</p>
      </div>
      <button class="error-notification-close">✕</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    max-width: 400px;
    animation: slideInRight 0.3s ease-out;
  `;
  
  // Close button handler
  const closeBtn = notification.querySelector('.error-notification-close');
  closeBtn.onclick = () => notification.remove();
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    padding: 0;
    margin-left: 12px;
  `;
  
  document.body.appendChild(notification);
  
  // Auto remove
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }
  
  return notification;
};

// Global error handlers
if (typeof window !== 'undefined') {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    addBreadcrumb({
      category: 'error',
      message: 'Uncaught error',
      level: 'error',
      data: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    });
    
    handleError(event.error, {
      type: 'uncaught',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    addBreadcrumb({
      category: 'error',
      message: 'Unhandled promise rejection',
      level: 'error'
    });
    
    handleError(event.reason, {
      type: 'unhandled_promise'
    });
    event.preventDefault(); // Prevent console error
  });
}

export default {
  AppError,
  ErrorTypes,
  handleError,
  getUserFriendlyMessage,
  retryWithBackoff,
  withTimeout,
  safeAsync,
  handleBatchErrors,
  showErrorNotification
};
