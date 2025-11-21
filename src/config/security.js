/**
 * Security Configuration
 * Handles HTTPS enforcement, secure cookies, and security headers
 */

// Check if running in production
export const isProduction = process.env.REACT_APP_ENV === 'production';

// Enforce HTTPS in production
export const enforceHTTPS = () => {
  if (isProduction && window.location.protocol !== 'https:') {
    window.location.href = window.location.href.replace('http:', 'https:');
  }
};

// Cookie configuration for secure storage
export const cookieConfig = {
  secure: isProduction, // Only send over HTTPS in production
  sameSite: 'strict', // Prevent CSRF attacks
  httpOnly: false, // Can't be set from client-side JS (handled by server)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Set secure cookie
export const setSecureCookie = (name, value, options = {}) => {
  const config = { ...cookieConfig, ...options };
  
  let cookieString = `${name}=${encodeURIComponent(value)}`;
  
  if (config.maxAge) {
    const expires = new Date(Date.now() + config.maxAge);
    cookieString += `; expires=${expires.toUTCString()}`;
  }
  
  if (config.path) {
    cookieString += `; path=${config.path}`;
  } else {
    cookieString += '; path=/';
  }
  
  if (config.secure) {
    cookieString += '; secure';
  }
  
  if (config.sameSite) {
    cookieString += `; samesite=${config.sameSite}`;
  }
  
  document.cookie = cookieString;
};

// Get cookie value
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  
  return null;
};

// Delete cookie
export const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

// Content Security Policy configuration
export const cspConfig = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'media-src': ["'self'", 'https:', 'blob:'],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.peerjs.com'
  ],
  'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com'],
  'frame-src': ["'self'", 'https://accounts.google.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

// Generate CSP header string
export const generateCSPHeader = () => {
  return Object.entries(cspConfig)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

// Security headers configuration
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
};

// Initialize security measures
export const initializeSecurity = () => {
  // Enforce HTTPS
  enforceHTTPS();
  
  // Log security initialization in development
  if (!isProduction) {
  }
};

export default {
  isProduction,
  enforceHTTPS,
  cookieConfig,
  setSecureCookie,
  getCookie,
  deleteCookie,
  cspConfig,
  generateCSPHeader,
  securityHeaders,
  initializeSecurity
};
