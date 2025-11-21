// Error logging and monitoring utility

class ErrorLogger {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.listeners = [];
  }

  // Log error with context
  log(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: context.userId || null
    };

    // Add to local storage
    this.errors.unshift(errorEntry);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // Save to localStorage
    try {
      localStorage.setItem('focus_errors', JSON.stringify(this.errors.slice(0, 50)));
    } catch (e) {
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(errorEntry));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
    }

    // Send to monitoring service (if configured)
    this.sendToMonitoring(errorEntry);
  }

  // Send error to monitoring service (Sentry, LogRocket, etc.)
  sendToMonitoring(errorEntry) {
    // Production monitoring integration
    if (process.env.NODE_ENV === 'production' && window.Sentry) {
      window.Sentry.captureException(new Error(errorEntry.message), {
        extra: errorEntry.context,
        tags: { component: errorEntry.context.component || 'unknown' }
      });
    }
  }

  // Get all logged errors
  getErrors() {
    return this.errors;
  }

  // Clear all errors
  clearErrors() {
    this.errors = [];
    try {
      localStorage.removeItem('focus_errors');
    } catch (e) {
    }
  }

  // Subscribe to error events
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Load errors from localStorage
  loadErrors() {
    try {
      const stored = localStorage.getItem('focus_errors');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
    }
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();
errorLogger.loadErrors();

// Global error handler
window.addEventListener('error', (event) => {
  errorLogger.log(event.error, {
    type: 'uncaught',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.log(event.reason, {
    type: 'unhandled_promise',
    promise: event.promise
  });
});

// Export functions
export const logError = (error, context) => errorLogger.log(error, context);
export const getErrors = () => errorLogger.getErrors();
export const clearErrors = () => errorLogger.clearErrors();
export const subscribeToErrors = (listener) => errorLogger.subscribe(listener);

// Specific error loggers
export const logApiError = (error, endpoint, method = 'GET') => {
  logError(error, {
    type: 'api',
    endpoint,
    method,
    status: error?.status,
    statusText: error?.statusText
  });
};

export const logRealtimeError = (error, channel) => {
  logError(error, {
    type: 'realtime',
    channel
  });
};

export const logUploadError = (error, file) => {
  logError(error, {
    type: 'upload',
    fileName: file?.name,
    fileSize: file?.size,
    fileType: file?.type
  });
};

export const logAuthError = (error, action) => {
  logError(error, {
    type: 'auth',
    action
  });
};

export const logNavigationError = (error, route) => {
  logError(error, {
    type: 'navigation',
    route
  });
};

// Performance monitoring
export const logPerformance = (metric, value) => {
  if (process.env.NODE_ENV === 'development') {
    // Development logging handled elsewhere
  }
  
  // Send to monitoring service
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', 'performance_metric', {
      metric_name: metric,
      metric_value: value,
      custom_parameter: true
    });
  }
};

// User action tracking (for debugging)
export const logUserAction = (action, data = {}) => {
  if (process.env.NODE_ENV === 'development') {
    // Development logging handled elsewhere
  }
  
  // Send to analytics
  if (process.env.NODE_ENV === 'production' && window.gtag) {
    window.gtag('event', action, {
      event_category: 'user_action',
      event_label: data.label || action,
      value: data.value || 1
    });
  }
};

export default errorLogger;
