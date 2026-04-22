/**
 * ErrorBoundary.jsx
 * =================
 * Production-grade error boundary for Focus App
 * Catches React rendering errors and shows user-friendly fallback
 * 
 * H2 Innovative — Bulletproof Error Handling
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ErrorBoundary.module.css';

class ErrorBoundaryInner extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Stack trace:', errorInfo.componentStack);
    
    // Log to monitoring service if available
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error } = this.state;
      const errorMessage = error?.message || 'An unexpected error occurred';
      
      // Check if it's a specific known error
      const isChunkError = errorMessage.includes('Loading chunk') || errorMessage.includes('Failed to fetch dynamically');
      const isAuthError = errorMessage.includes('auth') || errorMessage.includes('session');
      const isNetworkError = errorMessage.includes('network') || errorMessage.includes('fetch');

      let title = 'Something went wrong';
      let description = 'We apologize for the inconvenience. Our team has been notified.';
      let action = 'reload';

      if (isChunkError) {
        title = 'App Update Available';
        description = 'A new version of Focus is available. Please reload to get the latest features.';
        action = 'reload';
      } else if (isAuthError) {
        title = 'Session Expired';
        description = 'Your session has expired. Please sign in again.';
        action = 'login';
      } else if (isNetworkError) {
        title = 'Connection Issue';
        description = 'Please check your internet connection and try again.';
        action = 'retry';
      }

      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorIcon}>⚠️</div>
            <h1 className={styles.errorTitle}>{title}</h1>
            <p className={styles.errorDescription}>{description}</p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className={styles.errorDetails}>
                <summary>Technical Details (Dev Only)</summary>
                <pre className={styles.errorStack}>{errorMessage}</pre>
                <pre className={styles.errorStack}>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}

            <div className={styles.errorActions}>
              {action === 'reload' && (
                <button onClick={this.handleReload} className={styles.primaryButton}>
                  🔄 Reload App
                </button>
              )}
              {action === 'login' && (
                <button onClick={this.handleGoHome} className={styles.primaryButton}>
                  🔐 Go to Login
                </button>
              )}
              {action === 'retry' && (
                <button onClick={this.handleReset} className={styles.primaryButton}>
                  🔄 Try Again
                </button>
              )}
              <button onClick={this.handleGoHome} className={styles.secondaryButton}>
                🏠 Return Home
              </button>
            </div>

            <p className={styles.errorFooter}>
              If this persists, contact <a href="mailto:support@focus.app">support@focus.app</a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper with navigation
export function ErrorBoundary({ children, onReset }) {
  const navigate = useNavigate();
  
  return (
    <ErrorBoundaryInner onReset={onReset || (() => navigate('/'))}>
      {children}
    </ErrorBoundaryInner>
  );
}

export default ErrorBoundary;
