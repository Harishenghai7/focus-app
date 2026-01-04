/**
 * Application constants
 */

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
export const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// App Configuration
export const APP_NAME = 'Focus App';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'A social media application focused on meaningful connections';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const INFINITE_SCROLL_THRESHOLD = 0.8;

// File Upload
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
export const ALLOWED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg'];

// Content Limits
export const MAX_POST_LENGTH = 2000;
export const MAX_COMMENT_LENGTH = 500;
export const MAX_BIO_LENGTH = 160;
export const MAX_USERNAME_LENGTH = 30;
export const MIN_USERNAME_LENGTH = 3;
export const MAX_HASHTAGS_PER_POST = 10;
export const MAX_MENTIONS_PER_POST = 20;

// UI Constants
export const MOBILE_BREAKPOINT = 768;
export const TABLET_BREAKPOINT = 1024;
export const DESKTOP_BREAKPOINT = 1200;

// Animation Durations (in milliseconds)
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000
};

// Z-Index Layers
export const Z_INDEX = {
  DROPDOWN: 1000,
  STICKY: 1010,
  FIXED: 1020,
  MODAL_BACKDROP: 1030,
  MODAL: 1040,
  POPOVER: 1050,
  TOOLTIP: 1060,
  NOTIFICATION: 1070,
  MAX: 2147483647
};

// Theme Constants
export const THEME = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

// Colors
export const COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#64748b',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  POSTS: 'posts',
  COMMENTS: 'comments',
  NOTIFICATIONS: 'notifications',
  FOLLOWERS: 'followers',
  FOLLOWING: 'following',
  SEARCH_RESULTS: 'search_results',
  TRENDING: 'trending',
  MESSAGES: 'messages'
};

// Cache Durations (in minutes)
export const CACHE_DURATION = {
  SHORT: 5,
  MEDIUM: 15,
  LONG: 60,
  VERY_LONG: 240
};

// Error Codes
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// Event Types
export const EVENT_TYPES = {
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_REGISTER: 'user:register',
  POST_CREATED: 'post:created',
  POST_UPDATED: 'post:updated',
  POST_DELETED: 'post:deleted',
  POST_LIKED: 'post:liked',
  POST_UNLIKED: 'post:unliked',
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',
  FOLLOW: 'user:follow',
  UNFOLLOW: 'user:unfollow',
  MESSAGE_SENT: 'message:sent',
  MESSAGE_RECEIVED: 'message:received',
  NOTIFICATION_RECEIVED: 'notification:received'
};

// Notification Types
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MENTION: 'mention',
  MESSAGE: 'message',
  SYSTEM: 'system'
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

// Privacy Settings
export const PRIVACY_LEVELS = {
  PUBLIC: 'public',
  FRIENDS: 'friends',
  PRIVATE: 'private'
};

// Content Types
export const CONTENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  LINK: 'link',
  POLL: 'poll'
};

// Post Types
export const POST_TYPES = {
  ORIGINAL: 'original',
  REPOST: 'repost',
  REPLY: 'reply',
  QUOTE: 'quote'
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  SYSTEM: 'system'
};

// Connection Status
export const CONNECTION_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  CONNECTING: 'connecting',
  RECONNECTING: 'reconnecting'
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Sort Options
export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  POPULAR: 'popular',
  TRENDING: 'trending',
  RELEVANCE: 'relevance'
};

// Time Constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  DRAFT_POST: 'draft_post',
  DRAFT_COMMENT: 'draft_comment',
  RECENTLY_VIEWED: 'recently_viewed',
  BOOKMARKS: 'bookmarks'
};

// Validation Patterns
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,30}$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&=]*)$/,
  HASHTAG: /#[a-zA-Z0-9_]+/g,
  MENTION: /@[a-zA-Z0-9_]+/g,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
};

// Feature Flags
export const FEATURES = {
  DARK_MODE: true,
  PUSH_NOTIFICATIONS: true,
  VIDEO_CALLS: true,
  AUDIO_CALLS: true,
  STORIES: true,
  LIVE_STREAMING: false,
  MONETIZATION: false,
  ANALYTICS: true,
  A11Y_ENHANCEMENTS: true,
  PWA: true
};

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    SEARCH: '/users/search',
    FOLLOWERS: '/users/followers',
    FOLLOWING: '/users/following',
    FOLLOW: '/users/follow',
    UNFOLLOW: '/users/unfollow'
  },
  POSTS: {
    LIST: '/posts',
    CREATE: '/posts',
    DETAIL: '/posts/:id',
    UPDATE: '/posts/:id',
    DELETE: '/posts/:id',
    LIKE: '/posts/:id/like',
    UNLIKE: '/posts/:id/unlike',
    COMMENTS: '/posts/:id/comments'
  },
  COMMENTS: {
    CREATE: '/comments',
    UPDATE: '/comments/:id',
    DELETE: '/comments/:id',
    LIKE: '/comments/:id/like',
    UNLIKE: '/comments/:id/unlike'
  },
  MESSAGES: {
    LIST: '/messages',
    SEND: '/messages',
    CONVERSATION: '/messages/conversation/:userId',
    MARK_READ: '/messages/mark-read'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/mark-read',
    MARK_ALL_READ: '/notifications/mark-all-read'
  },
  UPLOAD: {
    IMAGE: '/upload/image',
    VIDEO: '/upload/video',
    AUDIO: '/upload/audio',
    FILE: '/upload/file'
  }
};

// Default Values
export const DEFAULTS = {
  AVATAR: '/images/default-avatar.svg',
  COVER_IMAGE: '/images/default-cover.jpg',
  POST_IMAGE: '/images/default-post.jpg',
  PROFILE_BIO: '',
  THEME: THEME.LIGHT,
  LANGUAGE: 'en',
  PAGE_SIZE: DEFAULT_PAGE_SIZE
};

export default {
  API_BASE_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  INFINITE_SCROLL_THRESHOLD,
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_AUDIO_TYPES,
  MAX_POST_LENGTH,
  MAX_COMMENT_LENGTH,
  MAX_BIO_LENGTH,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  MAX_HASHTAGS_PER_POST,
  MAX_MENTIONS_PER_POST,
  MOBILE_BREAKPOINT,
  TABLET_BREAKPOINT,
  DESKTOP_BREAKPOINT,
  ANIMATION_DURATION,
  Z_INDEX,
  THEME,
  COLORS,
  CACHE_KEYS,
  CACHE_DURATION,
  ERROR_CODES,
  HTTP_STATUS,
  EVENT_TYPES,
  NOTIFICATION_TYPES,
  USER_ROLES,
  PRIVACY_LEVELS,
  CONTENT_TYPES,
  POST_TYPES,
  MESSAGE_TYPES,
  CONNECTION_STATUS,
  LOADING_STATES,
  SORT_OPTIONS,
  TIME,
  STORAGE_KEYS,
  PATTERNS,
  FEATURES,
  ENDPOINTS,
  DEFAULTS
};
