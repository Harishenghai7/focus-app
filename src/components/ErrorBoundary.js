/**
 * Error Boundary Component
 * Catches React errors and prevents the whole app from crashing
 */

import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('❌ Error Boundary Caught:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={styles.container}>
                    <div style={styles.card}>
                        <h1 style={styles.title}>😔 Oops! Something went wrong</h1>
                        <p style={styles.message}>
                            Don't worry! This error has been caught and logged.
                        </p>

                        <details style={styles.details}>
                            <summary style={styles.summary}>
                                Click to see error details
                            </summary>
                            <div style={styles.errorBox}>
                                <h3>Error:</h3>
                                <pre style={styles.pre}>
                                    {this.state.error && this.state.error.toString()}
                                </pre>

                                <h3>Component Stack:</h3>
                                <pre style={styles.pre}>
                                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                                </pre>
                            </div>
                        </details>

                        <button
                            style={styles.button}
                            onClick={() => window.location.reload()}
                        >
                            🔄 Reload Page
                        </button>

                        <button
                            style={styles.buttonSecondary}
                            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        >
                            ↩️ Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        padding: '2rem'
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    title: {
        fontSize: '24px',
        marginBottom: '1rem',
        color: '#333'
    },
    message: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '1.5rem',
        lineHeight: '1.6'
    },
    details: {
        marginBottom: '1.5rem',
        backgroundColor: '#f9f9f9',
        padding: '1rem',
        borderRadius: '8px'
    },
    summary: {
        cursor: 'pointer',
        fontWeight: 'bold',
        color: '#0066cc',
        marginBottom: '1rem'
    },
    errorBox: {
        marginTop: '1rem'
    },
    pre: {
        backgroundColor: '#1e1e1e',
        color: '#d4d4d4',
        padding: '1rem',
        borderRadius: '4px',
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxHeight: '200px'
    },
    button: {
        backgroundColor: '#0066cc',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        marginRight: '1rem',
        marginTop: '1rem'
    },
    buttonSecondary: {
        backgroundColor: '#6c757d',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        padding: '12px 24px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '1rem'
    }
};

export default ErrorBoundary;
