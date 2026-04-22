/**
 * GlobalErrorBoundary.js
 * ======================
 * Production-grade error boundary with God-Level UI/UX
 * Glassmorphism theme matching Focus App design
 * 
 * H2 Innovative — Bulletproof Error Handling
 */

import React from 'react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[GlobalErrorBoundary] UI Crash:", error);
        console.error("[GlobalErrorBoundary] Stack:", errorInfo.componentStack);
        
        // Log to Sentry if available
        if (window.Sentry) {
            window.Sentry.captureException(error, { 
                extra: { componentStack: errorInfo.componentStack }
            });
        }
        
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            const { error } = this.state;
            const errorMessage = error?.message || 'An unexpected error occurred';
            
            // Detect error type for better UX
            const isChunkError = errorMessage.includes('Loading chunk') || 
                                errorMessage.includes('Failed to fetch dynamically') ||
                                errorMessage.includes('importScripts');
            const isAuthError = errorMessage.includes('auth') || 
                               errorMessage.includes('session') ||
                               errorMessage.includes('JWT');
            const isNetworkError = errorMessage.includes('network') || 
                                  errorMessage.includes('fetch') ||
                                  errorMessage.includes('Failed to load');

            let icon = '⚠️';
            let title = 'Something went wrong';
            let description = 'We apologize for the inconvenience. Our team has been notified.';
            let primaryAction = 'reload';

            if (isChunkError) {
                icon = '🔄';
                title = 'App Update Available';
                description = 'A new version of Focus has been deployed. Please reload to get the latest features and improvements.';
                primaryAction = 'reload';
            } else if (isAuthError) {
                icon = '🔐';
                title = 'Session Expired';
                description = 'Your session has expired for security reasons. Please sign in again to continue.';
                primaryAction = 'login';
            } else if (isNetworkError) {
                icon = '📡';
                title = 'Connection Issue';
                description = 'Unable to connect to Focus servers. Please check your internet connection and try again.';
                primaryAction = 'retry';
            }

            return (
                <div style={styles.container}>
                    <div style={styles.backgroundGradient} />
                    <div style={styles.card}>
                        <div style={styles.icon}>{icon}</div>
                        <h1 style={styles.title}>{title}</h1>
                        <p style={styles.description}>{description}</p>
                        
                        {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                            <details style={styles.details}>
                                <summary style={styles.summary}>🔧 Developer Details</summary>
                                <div style={styles.stackTrace}>
                                    <strong>Error:</strong> {errorMessage}
                                    <pre style={styles.pre}>{this.state.errorInfo.componentStack}</pre>
                                </div>
                            </details>
                        )}

                        <div style={styles.buttonContainer}>
                            {primaryAction === 'reload' && (
                                <button onClick={this.handleReload} style={styles.primaryButton}>
                                    🔄 Reload App
                                </button>
                            )}
                            {primaryAction === 'login' && (
                                <button onClick={this.handleGoHome} style={styles.primaryButton}>
                                    🔐 Sign In Again
                                </button>
                            )}
                            {primaryAction === 'retry' && (
                                <button onClick={this.handleReset} style={styles.primaryButton}>
                                    🔄 Try Again
                                </button>
                            )}
                            <button onClick={this.handleGoHome} style={styles.secondaryButton}>
                                🏠 Go to Home
                            </button>
                        </div>

                        <p style={styles.footer}>
                            Still having issues? Contact{' '}
                            <a href="mailto:support@focus.app" style={styles.link}>support@focus.app</a>
                        </p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// God-Level Glassmorphism Styles
const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        position: 'relative',
        overflow: 'hidden',
    },
    backgroundGradient: {
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 60%)',
        animation: 'pulse 8s ease-in-out infinite',
    },
    card: {
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.05)
        `,
    },
    icon: {
        fontSize: '64px',
        marginBottom: '24px',
        animation: 'shake 0.5s ease-in-out',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
    },
    title: {
        fontSize: '28px',
        fontWeight: 700,
        color: '#ffffff',
        marginBottom: '16px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
    },
    description: {
        fontSize: '16px',
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 1.6,
        marginBottom: '32px',
    },
    details: {
        margin: '24px 0',
        padding: '16px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'left',
    },
    summary: {
        color: '#fbbf24',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: '14px',
        userSelect: 'none',
    },
    stackTrace: {
        marginTop: '12px',
        fontSize: '12px',
        color: '#e2e8f0',
    },
    pre: {
        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '12px',
        borderRadius: '8px',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color: '#ef4444',
        marginTop: '8px',
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '24px',
    },
    primaryButton: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        padding: '16px 28px',
        borderRadius: '14px',
        fontSize: '16px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 24px rgba(102, 126, 234, 0.6)',
        },
    },
    secondaryButton: {
        background: 'transparent',
        color: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '14px 24px',
        borderRadius: '14px',
        fontSize: '15px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    footer: {
        fontSize: '14px',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: '8px',
    },
    link: {
        color: '#667eea',
        textDecoration: 'none',
        fontWeight: 500,
    },
};

// Add keyframes via inline styles don't work, so we inject them
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px) rotate(-5deg); }
            75% { transform: translateX(10px) rotate(5deg); }
        }
    `;
    document.head.appendChild(styleSheet);
}

export default GlobalErrorBoundary;
