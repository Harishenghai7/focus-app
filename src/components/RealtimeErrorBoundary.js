/**
 * RealtimeErrorBoundary Component
 *
 * Catches errors in live/realtime features and displays a fallback UI.
 * Prompts user to refresh page if live updates fail.
 *
 * @component
 * @example
 * <RealtimeErrorBoundary>
 *   <LiveFeed />
 * </RealtimeErrorBoundary>
 *
 * @param {React.ReactNode} children - Child components to render
 * @returns {React.ReactElement} Error boundary wrapper
 */

import React from 'react';
import PropTypes from 'prop-types';
import styles from './RealtimeErrorBoundary.module.css';
import './RealtimeErrorBoundary.css';

class RealtimeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Realtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.realtimeErrorBoundary} role="alert" aria-live="assertive">
          <h3 className={styles.errorTitle}>Connection Issue</h3>
          <p className={styles.errorMessage}>
            We're having trouble with live updates. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className={styles.refreshBtn}
            aria-label="Refresh page"
            type="button"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

RealtimeErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

RealtimeErrorBoundary.displayName = 'RealtimeErrorBoundary';

export default RealtimeErrorBoundary;
