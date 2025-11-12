// index.js
import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from '@sentry/react';
import App from "./App";
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

// ✅ SECURITY FIX: Only enable Sentry in production
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

if (isProduction && process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN, // ✅ FIX: Only from env var
    environment: process.env.NODE_ENV,
    enabled: true,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay()
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 0.2, // ✅ FIX: Reduced from 1.0 to protect privacy
    beforeSend(event) {
      // Filter out noise
      if (event.exception) {
        const error = event.exception.values[0];
        if (error.value?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
      }
      return event;
    }
  });
}

// ✅ FIX: Wrap initialization in try-catch
try {
  initializeErrorTracking();
} catch (error) {
  console.error('Error tracking initialization failed:', error);
}

try {
  initializeSecurity();
} catch (error) {
  console.error('Security initialization failed:', error);
}

try {
  initializeVersionManagement();
} catch (error) {
  console.error('Version management initialization failed:', error);
}

try {
  initializeAnalytics();
  trackSessionStart();
} catch (error) {
  console.error('Analytics initialization failed:', error);
}

// ✅ SECURITY FIX: Only expose in development
if (isDevelopment) {
  window.autoTester = autoTester;
  window.supabase = supabase;
  console.log('🔧 Development mode: autoTester and supabase available on window');
}

// Remove any loading classes
document.documentElement.classList.remove("app-loading", "app-booting");

// ✅ FIX: Register service worker immediately for faster PWA
if ('serviceWorker' in navigator && isProduction) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('SW registered: ', registration);
      if ('PushManager' in window) {
        window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
      }
    })
    .catch((registrationError) => {
      console.error('SW registration failed: ', registrationError);
      window.dispatchEvent(new CustomEvent('sw-registration-failed', { detail: registrationError }));
    });
}

try {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(container);

  root.render(
    // ✅ FIX: Add StrictMode for development checks
    <React.StrictMode>
      <Sentry.ErrorBoundary fallback={({ error }) => (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2>Something went wrong</h2>
          <p>We've been notified of this error.</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )}>
        {/* ✅ FIX: Removed duplicate ThemeProvider (App.js has it) */}
        <App />
      </Sentry.ErrorBoundary>
    </React.StrictMode>
  );

  // ✅ FIX: Report web vitals to console in dev, analytics in prod
  reportWebVitals((metric) => {
    if (isDevelopment) {
      console.log(metric);
    } else if (window.gtag) {
      // Send to Google Analytics if available
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }
  });
} catch (error) {
  console.error('Critical app initialization error:', error);
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
