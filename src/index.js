// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from '@sentry/react';
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { initializeErrorTracking } from "./utils/errorTracking";
import { initializeSecurity } from "./config/security";
import { initializeVersionManagement } from "./utils/versionManager";
import { initializeAnalytics, trackSessionStart } from "./utils/analytics";
import { reportWebVitals } from "./utils/reportWebVitals";
import autoTester from './utils/autoTester';
import { supabase } from './supabaseClient';
import './styles/theme.css';
import './styles/app-common.css';
import "./styles/global.css";

// Initialize Sentry for AI-powered error monitoring
Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN || 'https://990858c82f807d489aac2b2e0bb990b7@o4510329559449600.ingest.us.sentry.io/4510329573277696',
  environment: process.env.NODE_ENV,
  enabled: true, // Enable in development for testing
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // Filter out development noise
    if (event.exception) {
      const error = event.exception.values[0];
      if (error.value?.includes('ResizeObserver loop limit exceeded')) {
        return null;
      }
    }
    return event;
  }
});

// Initialize error tracking first
initializeErrorTracking();

// Initialize security measures
initializeSecurity();

// Initialize version management
initializeVersionManagement();

// Initialize analytics
initializeAnalytics();

// Track session start
trackSessionStart();

// Initialize automated tester

window.autoTester = autoTester;

// Expose Supabase client for testing
window.supabase = supabase;

// Remove any loading classes
document.documentElement.classList.remove("app-loading", "app-booting");

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        // Feature #384: Push on mobile and web both
        // Feature #386: Install as PWA
        if ('PushManager' in window) {
          // Initialize push notifications
          window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
        }
      })
      .catch((registrationError) => {
        console.error('SW registration failed: ', registrationError);
        // Feature #388: Offline notification fallback
        window.dispatchEvent(new CustomEvent('sw-registration-failed', { detail: registrationError }));
      });
  });
}

try {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error('Root element not found');
  }
  
  const root = ReactDOM.createRoot(container);
  
  root.render(
    <Sentry.ErrorBoundary fallback={({ error }) => (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>Something went wrong</h2>
        <p>We've been notified of this error.</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    )}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
  
  // Report web vitals
  reportWebVitals();
} catch (error) {
  console.error('Critical app initialization error:', error);
  // Feature #371: App crash reporting
  if (window.Sentry) {
    window.Sentry.captureException(error);
  }
  // Fallback error display
  const container = document.getElementById("root");
  if (container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <h1 style="color: #e74c3c; margin-bottom: 1rem;">⚠️ App Failed to Load</h1>
        <p style="color: #666; margin-bottom: 2rem; text-align: center;">Focus encountered an error during startup.</p>
        <button onclick="window.location.reload()" style="background: #3498db; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">Reload App</button>
      </div>
    `;
  }
}

