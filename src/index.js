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
import { supabase } from './supabaseClient';
import './index.css';

// Initialize Sentry ONLY in production
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (IS_PRODUCTION && process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV,
    enabled: true,
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
        const error = event.exception.values?.[0];
        if (error?.value?.includes('ResizeObserver loop limit exceeded')) {
          return null;
        }
        // Filter chunk loading errors (normal during deploys)
        if (error?.value?.includes('ChunkLoadError')) {
          return null;
        }
      }
      return event;
    }
  });
} else if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Development mode: Sentry disabled');
}

// Initialize error tracking first
try {
  initializeErrorTracking();
} catch (error) {
  console.error('Error tracking initialization failed:', error);
}

// Initialize security measures
try {
  initializeSecurity();
} catch (error) {
  console.error('Security initialization failed:', error);
}

// Initialize version management
try {
  initializeVersionManagement();
} catch (error) {
  console.error('Version management initialization failed:', error);
}

// Initialize analytics (only in production)
if (IS_PRODUCTION) {
  try {
    initializeAnalytics();
    trackSessionStart();
  } catch (error) {
    console.error('Analytics initialization failed:', error);
  }
}

// Remove any loading classes
document.documentElement.classList.remove("app-loading", "app-booting");

// Register service worker for PWA (production only, before React renders)
if ('serviceWorker' in navigator && IS_PRODUCTION) {
  navigator.serviceWorker.register('/sw.js')
    .then((registration) => {
      console.log('✅ Service Worker registered:', registration.scope);
      
      // Feature #384: Push on mobile and web both
      // Feature #386: Install as PWA
      if ('PushManager' in window) {
        window.dispatchEvent(new CustomEvent('sw-registered', { detail: registration }));
      }
    })
    .catch((error) => {
      console.error('❌ Service Worker registration failed:', error);
      // Feature #388: Offline notification fallback
      window.dispatchEvent(new CustomEvent('sw-registration-failed', { detail: error }));
    });
}

// Render React App
try {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error('Root element not found');
  }
  
  const root = ReactDOM.createRoot(container);
  
  const ErrorFallback = ({ error, resetError }) => (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      fontFamily: 'system-ui',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb'
    }}>
      <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>⚠️ Something went wrong</h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '500px' }}>
        We've been notified of this error and will fix it soon.
      </p>
      <button 
        onClick={() => window.location.reload()}
        style={{
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          marginBottom: '1rem'
        }}
      >
        Reload Page
      </button>
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '600px' }}>
          <summary style={{ cursor: 'pointer', color: '#6b7280' }}>Error Details (Dev Only)</summary>
          <pre style={{ 
            background: '#1f2937', 
            color: '#f3f4f6', 
            padding: '1rem', 
            borderRadius: '4px',
            overflow: 'auto',
            fontSize: '12px',
            marginTop: '1rem'
          }}>
            {error?.message}\n{error?.stack}
          </pre>
        </details>
      )}
    </div>
  );
  
  root.render(
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Sentry.ErrorBoundary>
  );
  
  // Report web vitals (production only)
  if (IS_PRODUCTION) {
    reportWebVitals();
  }
  
} catch (error) {
  console.error('❌ Critical app initialization error:', error);
  
  // Feature #371: App crash reporting
  if (window.Sentry && IS_PRODUCTION) {
    Sentry.captureException(error);
  }
  
  // Fallback error display
  const container = document.getElementById("root");
  if (container) {
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb;">
        <h1 style="color: #dc2626; margin-bottom: 1rem;">⚠️ App Failed to Load</h1>
        <p style="color: #6b7280; margin-bottom: 2rem; text-align: center; max-width: 500px;">
          Focus encountered an error during startup. Please try reloading the page.
        </p>
        <button 
          onclick="window.location.reload()" 
          style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-bottom: 1rem;"
        >
          🔄 Reload App
        </button>
        <button 
          onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" 
          style="background: #6b7280; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 14px;"
        >
          🗑️ Clear Cache & Reload
        </button>
      </div>
    `;
  }
}
