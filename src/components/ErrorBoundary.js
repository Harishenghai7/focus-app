import React from 'react';
import { logError } from '../utils/errorLogger';

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
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: '#1a1a1a',
          color: 'white'
        }}>
          <div style={{ maxWidth: '600px', width: '100%' }}>
            <h1 style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '2rem' }}>
              ⚠️ Something Went Wrong
            </h1>
            
            <p style={{ marginBottom: '1.5rem', color: '#9ca3af' }}>
              {errorCount > 1 
                ? `The app has encountered ${errorCount} errors. Try clearing your cache.`
                : 'The app encountered an unexpected error. You can try to recover or restart.'}
            </p>
            
            {/* Error message */}
            <div style={{
              background: '#2a2a2a',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              textAlign: 'left',
              maxHeight: '150px',
              overflow: 'auto'
            }}>
              <code style={{ color: '#ef4444', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                {error?.message || 'Unknown error'}
              </code>
            </div>
            
            {/* Recovery options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#059669'}
                onMouseOut={(e) => e.target.style.background = '#10b981'}
              >
                🔄 Try Again
              </button>
              
              <button
                onClick={this.handleClearCache}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#5568d3'}
                onMouseOut={(e) => e.target.style.background = '#667eea'}
              >
                🔧 Clear Cache & Restart
              </button>
              
              <button
                onClick={this.handleReportError}
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.target.style.background = '#4b5563'}
                onMouseOut={(e) => e.target.style.background = '#6b7280'}
              >
                📋 Copy Error Report
              </button>
            </div>
            
            {/* Development details */}
            {isDevelopment && errorInfo && (
              <details style={{
                background: '#2a2a2a',
                padding: '1rem',
                borderRadius: '8px',
                textAlign: 'left',
                marginTop: '1rem'
              }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  color: '#9ca3af',
                  marginBottom: '0.5rem',
                  fontWeight: '600'
                }}>
                  🔍 Error Details (Development)
                </summary>
                <pre style={{ 
                  fontSize: '0.75rem', 
                  color: '#d1d5db',
                  overflow: 'auto',
                  maxHeight: '200px',
                  margin: 0
                }}>
                  {error?.stack}
                  {'\n\n'}
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <a
              href="/force-reset.html"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '0.875rem',
                marginTop: '1rem',
                display: 'inline-block'
              }}
            >
              Need help? Use Force Reset Tool →
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
