/**
 * SovereignErrorBoundary.jsx
 * ===========================
 * 🏛️ SOVEREIGN ERROR BOUNDARY - God-Level Glassmorphism Error Handling
 * 
 * Replaces the generic "Something went wrong" with a vault-door experience
 * that maintains the Sovereign Identity theme even in error states.
 * 
 * PILLAR 1: No more generic error screens
 * PILLAR 2: Glassmorphism satin-finish UI
 * PILLAR 3: Focusly AI integration for recovery guidance
 * PILLAR 4: Automatic retry with exponential backoff
 * 
 * H2 Innovative — Error Recovery as a Sovereign Experience
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusly } from '../../context/FocuslyContext';
import styles from './SovereignErrorBoundary.module.css';

// Error severity levels
const ERROR_SEVERITY = {
  RECOVERABLE: 'recoverable',
  CRITICAL: 'critical',
  CHUNK: 'chunk',
  AUTH: 'auth',
  NETWORK: 'network',
};

// Vault door animation variants
const vaultDoorVariants = {
  closed: { 
    rotateY: 0,
    opacity: 1,
    scale: 1
  },
  opening: {
    rotateY: -15,
    opacity: 0.9,
    scale: 0.98,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  open: {
    rotateY: -45,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      delay: 0.2,
      duration: 0.5,
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 }
  }
};

class SovereignErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      severity: ERROR_SEVERITY.RECOVERABLE,
      retryCount: 0,
      isRecovering: false,
      showDetails: false
    };
    this.retryTimer = null;
  }

  static getDerivedStateFromError(error) {
    const severity = SovereignErrorBoundary.classifyError(error);
    return { hasError: true, error, severity };
  }

  static classifyError(error) {
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('loading chunk') || 
        message.includes('failed to fetch dynamically') ||
        message.includes('importscripts') ||
        message.includes('cannot access') ||
        message.includes('before initialization')) {
      return ERROR_SEVERITY.CHUNK;
    }
    
    if (message.includes('auth') || 
        message.includes('session') ||
        message.includes('jwt') ||
        message.includes('unauthorized')) {
      return ERROR_SEVERITY.AUTH;
    }
    
    if (message.includes('network') || 
        message.includes('fetch') ||
        message.includes('failed to load') ||
        message.includes('connection') ||
        message.includes('timeout')) {
      return ERROR_SEVERITY.NETWORK;
    }
    
    if (message.includes('cannot access') && message.includes('before initialization')) {
      return ERROR_SEVERITY.CRITICAL;
    }
    
    return ERROR_SEVERITY.RECOVERABLE;
  }

  componentDidCatch(error, errorInfo) {
    console.error("[SovereignErrorBoundary] 🔱 Sovereign System Alert:", error);
    console.error("[SovereignErrorBoundary] Component Stack:", errorInfo.componentStack);
    
    // Log to Sentry if available
    if (window.Sentry) {
      window.Sentry.captureException(error, { 
        extra: { 
          componentStack: errorInfo.componentStack,
          severity: this.state.severity,
          sovereignContext: 'trust_shield_verification'
        }
      });
    }

    this.setState({ errorInfo });
    
    // Trigger Focusly AI disappointment for critical errors
    if (this.state.severity === ERROR_SEVERITY.CRITICAL || 
        this.state.severity === ERROR_SEVERITY.CHUNK) {
      try {
        const focusly = this.props.focusly;
        if (focusly?.disappoint) {
          focusly.disappoint("Macha, the vault has encountered a disturbance. Stand by for restoration.");
        }
      } catch (_) {}
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }

  handleReload = () => {
    this.setState({ isRecovering: true });
    
    // 🏛️ SOVEREIGN CLEAR: Wipe all caches before reload
    try {
      // Clear browser caches
      if (window.caches) {
        window.caches.keys().then(names => {
          names.forEach(name => window.caches.delete(name));
        });
      }
      
      // Clear service worker caches
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(reg => reg.unregister());
        });
      }
      
      // Clear storage
      sessionStorage.clear();
      
      // Clear chunk error tracking
      localStorage.removeItem('chunk_error_count');
      localStorage.removeItem('chunk_error_timestamp');
    } catch (_) {}
    
    // Add a dramatic delay for the vault animation, then HARD reload with cache-bust
    setTimeout(() => {
      // Force hard reload with cache-busting query param
      const separator = window.location.href.indexOf('?') > -1 ? '&' : '?';
      window.location.href = window.location.href + separator + '_sovereign=' + Date.now();
    }, 800);
  };

  handleGoHome = () => {
    this.setState({ isRecovering: true });
    
    setTimeout(() => {
      window.location.href = '/';
    }, 600);
  };

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState({ 
        isRecovering: true,
        retryCount: retryCount + 1 
      });
      
      // Exponential backoff
      const delay = Math.pow(2, retryCount) * 1000;
      
      this.retryTimer = setTimeout(() => {
        this.setState({ 
          hasError: false, 
          error: null, 
          errorInfo: null,
          isRecovering: false
        });
      }, delay);
    } else {
      // Max retries reached, force reload
      this.handleReload();
    }
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    });
  };

  toggleDetails = () => {
    this.setState({ showDetails: !this.state.showDetails });
  };

  getErrorConfig = () => {
    const { severity, retryCount } = this.state;
    
    const configs = {
      [ERROR_SEVERITY.CHUNK]: {
        icon: '🔄',
        title: 'Vault Update Required',
        subtitle: 'A new Sovereign protocol is available',
        description: 'The verification vault has been upgraded with enhanced security measures. A reload will activate the new protocols.',
        primaryAction: 'reload',
        secondaryAction: 'home',
        showRetry: false,
        accentColor: '#00c3ff'
      },
      [ERROR_SEVERITY.AUTH]: {
        icon: '🔐',
        title: 'Session Expired',
        subtitle: 'Your Sovereign credentials have lapsed',
        description: 'For your security, your session has expired. Please authenticate again to access the vault.',
        primaryAction: 'login',
        secondaryAction: 'home',
        showRetry: false,
        accentColor: '#ff5050'
      },
      [ERROR_SEVERITY.NETWORK]: {
        icon: '📡',
        title: 'Connection Disrupted',
        subtitle: 'Unable to reach the Sovereign Network',
        description: 'The vault cannot establish a secure connection. Please verify your network and try again.',
        primaryAction: 'retry',
        secondaryAction: 'home',
        showRetry: true,
        accentColor: '#ffdc00'
      },
      [ERROR_SEVERITY.CRITICAL]: {
        icon: '⚠️',
        title: 'Sovereign System Alert',
        subtitle: 'Critical vault disturbance detected',
        description: 'A fundamental system error has occurred. The vault will restore itself automatically.',
        primaryAction: 'reload',
        secondaryAction: 'support',
        showRetry: false,
        accentColor: '#ff5050'
      },
      [ERROR_SEVERITY.RECOVERABLE]: {
        icon: '🛡️',
        title: 'Vault Temporarily Sealed',
        subtitle: 'A minor disturbance has been contained',
        description: 'The system encountered an unexpected condition but can be safely restored.',
        primaryAction: 'retry',
        secondaryAction: 'home',
        showRetry: true,
        accentColor: '#9678ff'
      }
    };
    
    return configs[severity] || configs[ERROR_SEVERITY.RECOVERABLE];
  };

  render() {
    const { hasError, error, errorInfo, isRecovering, showDetails, retryCount } = this.state;
    const { children } = this.props;
    
    if (!hasError) {
      return children;
    }

    const config = this.getErrorConfig();
    const errorMessage = error?.message || 'An unexpected error occurred';
    
    return (
      <div className={styles.sovereignErrorBoundary}>
        {/* Background Sovereign Pulse */}
        <div className={styles.backgroundPulse} />
        
        {/* Grid Pattern Overlay */}
        <div className={styles.gridOverlay} />
        
        <AnimatePresence mode="wait">
          {!isRecovering ? (
            <motion.div 
              key="error-screen"
              className={styles.vaultContainer}
              variants={vaultDoorVariants}
              initial="closed"
              animate="closed"
              exit="opening"
            >
              <motion.div 
                className={styles.vaultContent}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Status Ring */}
                <motion.div 
                  className={styles.statusRing}
                  style={{ '--accent-color': config.accentColor }}
                  animate={{ 
                    boxShadow: [
                      `0 0 20px ${config.accentColor}30`,
                      `0 0 40px ${config.accentColor}50`,
                      `0 0 20px ${config.accentColor}30`
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className={styles.statusIcon}>{config.icon}</span>
                </motion.div>

                {/* Title */}
                <div className={styles.titleSection}>
                  <motion.h1 
                    className={styles.title}
                    style={{ color: config.accentColor }}
                  >
                    {config.title}
                  </motion.h1>
                  <p className={styles.subtitle}>{config.subtitle}</p>
                </div>

                {/* Description */}
                <p className={styles.description}>{config.description}</p>

                {/* Developer Details (collapsible) */}
                {process.env.NODE_ENV === 'development' && errorInfo && (
                  <div className={styles.detailsSection}>
                    <button 
                      className={styles.detailsToggle}
                      onClick={this.toggleDetails}
                    >
                      {showDetails ? '🔧 Hide Developer Details' : '🔧 Show Developer Details'}
                    </button>
                    
                    <AnimatePresence>
                      {showDetails && (
                        <motion.div 
                          className={styles.detailsContent}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <div className={styles.errorType}>
                            <strong>Error Type:</strong> {this.state.severity}
                          </div>
                          <div className={styles.errorMessage}>
                            <strong>Message:</strong> {errorMessage}
                          </div>
                          <pre className={styles.stackTrace}>
                            {errorInfo.componentStack}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Action Buttons */}
                <div className={styles.actions}>
                  {config.primaryAction === 'reload' && (
                    <motion.button 
                      className={styles.primaryButton}
                      onClick={this.handleReload}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ 
                        background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}80)` 
                      }}
                    >
                      <span className={styles.buttonIcon}>🔄</span>
                      Restore Sovereign Vault
                    </motion.button>
                  )}
                  
                  {config.primaryAction === 'login' && (
                    <motion.button 
                      className={styles.primaryButton}
                      onClick={this.handleGoHome}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ 
                        background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}80)` 
                      }}
                    >
                      <span className={styles.buttonIcon}>🔐</span>
                      Authenticate
                    </motion.button>
                  )}
                  
                  {config.primaryAction === 'retry' && (
                    <motion.button 
                      className={styles.primaryButton}
                      onClick={this.handleRetry}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={retryCount >= 3}
                      style={{ 
                        background: `linear-gradient(135deg, ${config.accentColor}, ${config.accentColor}80)` 
                      }}
                    >
                      <span className={styles.buttonIcon}>🔄</span>
                      {retryCount >= 3 ? 'Max Retries Reached' : `Retry Attempt ${retryCount + 1}/3`}
                    </motion.button>
                  )}

                  {config.secondaryAction === 'home' && (
                    <motion.button 
                      className={styles.secondaryButton}
                      onClick={this.handleGoHome}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={styles.buttonIcon}>🏠</span>
                      Return to Sanctuary
                    </motion.button>
                  )}
                  
                  {config.secondaryAction === 'support' && (
                    <motion.button 
                      className={styles.secondaryButton}
                      onClick={() => window.location.href = '/support'}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className={styles.buttonIcon}>🆘</span>
                      Contact Sovereign Support
                    </motion.button>
                  )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                  <p>
                    Still experiencing issues?{' '}
                    <a href="mailto:sovereign@focus.app" className={styles.supportLink}>
                      sovereign@focus.app
                    </a>
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div 
              key="recovering"
              className={styles.recoveringState}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.recoveringSpinner} />
              <p className={styles.recoveringText}>Restoring Sovereign Systems...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
}

// Wrapper component to inject Focusly context
const SovereignErrorBoundaryWithContext = (props) => {
  const focusly = useFocusly();
  return <SovereignErrorBoundary {...props} focusly={focusly} />;
};

export default SovereignErrorBoundaryWithContext;
export { SovereignErrorBoundary, ERROR_SEVERITY };
