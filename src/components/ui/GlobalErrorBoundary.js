import React from 'react';

class GlobalErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("UI Crash Caught by ErrorBoundary:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#fff',
                    background: '#1a0f2e',
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Sorry, something went wrong</h2>
                    <p style={{ color: '#a78bfa', marginBottom: '32px' }}>
                        The application encountered an unexpected error while trying to display this page.
                    </p>
                    {this.state.errorInfo && (
                        <div style={{ 
                            background: 'rgba(0,0,0,0.3)', 
                            padding: '16px', 
                            borderRadius: '8px',
                            maxWidth: '600px',
                            textAlign: 'left',
                            overflowX: 'auto',
                            marginBottom: '32px',
                            fontSize: '12px',
                            color: '#e2e8f0',
                            fontFamily: 'monospace'
                        }}>
                            {this.state.errorInfo.componentStack}
                        </div>
                    )}
                    <button 
                        onClick={() => window.location.href = '/home'}
                        style={{
                            padding: '12px 24px',
                            background: '#8b5cf6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                        }}
                    >
                        Return Home
                    </button>
                    
                    <button 
                         onClick={() => window.location.reload()}
                         style={{
                             padding: '12px 24px',
                             background: 'transparent',
                             color: '#8b5cf6',
                             border: '1px solid #8b5cf6',
                             borderRadius: '8px',
                             fontWeight: 'bold',
                             cursor: 'pointer',
                             marginTop: '16px',
                             transition: 'all 0.2s'
                         }}
                     >
                         Refresh Page
                     </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default GlobalErrorBoundary;
