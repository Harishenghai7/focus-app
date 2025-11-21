/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in child component tree, logs them, and displays a fallback UI.
 * Provides recovery options and error reporting for users.
 *
 * @component
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @param {React.ReactNode} children - Child components to render
 * @returns {React.ReactElement} Error boundary wrapper
 */

import React from 'react';
import PropTypes from 'prop-types';
import { logError } from '../utils/errorLogger';
import styles from './ErrorBoundary.module.css';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const now = Date.now();
    const { lastErrorTime, errorCount } = this.state;
    
    // Track error frequency
    const timeSinceLastError = lastErrorTime ? now - lastErrorTime : Infinity;
    const newErrorCount = timeSinceLastError < 5000 ? errorCount + 1 : 1;
    
    this.setState({
      errorInfo,
      errorCount: newErrorCount,
      lastErrorTime: now
    });
    
    // Log error with context
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorCount: newErrorCount,
      url: window.location.href,
      userAgent: navigator.userAgent
    });
    
    // If too many errors in short time, force reload
    if (newErrorCount >= 3) {
      console.error('Multiple errors detected, forcing reload...');
      setTimeout(() => {
        this.handleHardReset();
      }, 2000);
    }
  }

  handleReset = () => {
    // Soft reset - just reset error state
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  handleClearCache = () => {
    // Clear cache and reload
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
      }
    } catch (e) {
      console.error('Failed to clear cache:', e);
    }
    
    window.location.href = '/';
  };

  handleHardReset = () => {
    // Nuclear option - clear everything and reload
    this.handleClearCache();
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => alert('Error report copied to clipboard'))
      .catch(() => alert('Failed to copy error report'));
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      const { error, errorInfo, errorCount } = this.state;
      return (
        <div 
          className={styles.errorBoundary} 
          role="alert" 
          aria-live="assertive"
          data-testid="error-message"
          id="error-boundary"
        >
          <div className={styles.errorContent}>
            <h1 className={styles.errorTitle}>⚠️ Something Went Wrong</h1>
            <p className={styles.errorMessage}>
              {errorCount > 1
                ? `The app has encountered ${errorCount} errors. Try clearing your cache.`
                : 'The app encountered an unexpected error. You can try to recover or restart.'}
            </p>
            <div className={styles.errorDetails}>
              <code>{error?.message || 'Unknown error'}</code>
            </div>
            <div className={styles.errorActions}>
              <button onClick={this.handleReset} className={styles.tryAgainBtn} aria-label="Try again">🔄 Try Again</button>
              <button onClick={this.handleClearCache} className={styles.clearCacheBtn} aria-label="Clear cache and restart">🔧 Clear Cache & Restart</button>
              <button onClick={this.handleReportError} className={styles.copyReportBtn} aria-label="Copy error report">📋 Copy Error Report</button>
            </div>
            {isDevelopment && errorInfo && (
              <details className={styles.devDetails}>
                <summary>🔍 Error Details (Development)</summary>
                <pre>{error?.stack}{'\n\n'}{errorInfo.componentStack}</pre>
              </details>
            )}
            <a href="/force-reset.html" className={styles.forceResetLink}>Need help? Use Force Reset Tool →</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

ErrorBoundary.displayName = 'ErrorBoundary';

export default ErrorBoundary;
