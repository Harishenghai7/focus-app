/**
 * Loading states management utility
 */

let loadingStates = new Map();
let listeners = new Set();

export const setLoading = (key, isLoading, message = 'Loading...') => {
  const previousState = loadingStates.get(key);
  const newState = {
    isLoading,
    message,
    timestamp: Date.now(),
    key
  };
  
  loadingStates.set(key, newState);
  
  // Notify listeners
  listeners.forEach(listener => {
    try {
      listener(key, newState, previousState);
    } catch (error) {
      console.error('Loading state listener error:', error);
    }
  });
  
  return newState;
};

export const getLoadingState = (key) => {
  return loadingStates.get(key) || { isLoading: false, message: '', timestamp: null, key };
};

export const isLoading = (key) => {
  const state = loadingStates.get(key);
  return state ? state.isLoading : false;
};

export const getAllLoadingStates = () => {
  return Object.fromEntries(loadingStates);
};

export const clearLoading = (key) => {
  return setLoading(key, false);
};

export const clearAllLoading = () => {
  const keys = Array.from(loadingStates.keys());
  keys.forEach(key => clearLoading(key));
};

export const hasAnyLoading = () => {
  for (const [, state] of loadingStates) {
    if (state.isLoading) return true;
  }
  return false;
};

export const getActiveLoadingStates = () => {
  const active = {};
  for (const [key, state] of loadingStates) {
    if (state.isLoading) {
      active[key] = state;
    }
  }
  return active;
};

export const getActiveLoadingCount = () => {
  let count = 0;
  for (const [, state] of loadingStates) {
    if (state.isLoading) count++;
  }
  return count;
};

export const onLoadingChange = (callback) => {
  listeners.add(callback);
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
};

export const removeLoadingListener = (callback) => {
  listeners.delete(callback);
};

export const removeAllLoadingListeners = () => {
  listeners.clear();
};

// Predefined loading keys for common operations
export const LOADING_KEYS = {
  APP_INIT: 'app:init',
  USER_AUTH: 'user:auth',
  USER_PROFILE: 'user:profile',
  POSTS_LOAD: 'posts:load',
  POSTS_CREATE: 'posts:create',
  POSTS_UPDATE: 'posts:update',
  POSTS_DELETE: 'posts:delete',
  COMMENTS_LOAD: 'comments:load',
  COMMENTS_CREATE: 'comments:create',
  LIKES_UPDATE: 'likes:update',
  MESSAGES_LOAD: 'messages:load',
  MESSAGES_SEND: 'messages:send',
  NOTIFICATIONS_LOAD: 'notifications:load',
  SEARCH: 'search',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  API_CALL: 'api:call'
};

// Helper functions for common loading operations
export const startAppInit = () => setLoading(LOADING_KEYS.APP_INIT, true, 'Initializing app...');
export const finishAppInit = () => clearLoading(LOADING_KEYS.APP_INIT);

export const startAuth = () => setLoading(LOADING_KEYS.USER_AUTH, true, 'Authenticating...');
export const finishAuth = () => clearLoading(LOADING_KEYS.USER_AUTH);

export const startLoadingPosts = () => setLoading(LOADING_KEYS.POSTS_LOAD, true, 'Loading posts...');
export const finishLoadingPosts = () => clearLoading(LOADING_KEYS.POSTS_LOAD);

export const startCreatingPost = () => setLoading(LOADING_KEYS.POSTS_CREATE, true, 'Creating post...');
export const finishCreatingPost = () => clearLoading(LOADING_KEYS.POSTS_CREATE);

export const startUpdatingPost = () => setLoading(LOADING_KEYS.POSTS_UPDATE, true, 'Updating post...');
export const finishUpdatingPost = () => clearLoading(LOADING_KEYS.POSTS_UPDATE);

export const startDeletingPost = () => setLoading(LOADING_KEYS.POSTS_DELETE, true, 'Deleting post...');
export const finishDeletingPost = () => clearLoading(LOADING_KEYS.POSTS_DELETE);

export const startLoadingComments = () => setLoading(LOADING_KEYS.COMMENTS_LOAD, true, 'Loading comments...');
export const finishLoadingComments = () => clearLoading(LOADING_KEYS.COMMENTS_LOAD);

export const startCreatingComment = () => setLoading(LOADING_KEYS.COMMENTS_CREATE, true, 'Adding comment...');
export const finishCreatingComment = () => clearLoading(LOADING_KEYS.COMMENTS_CREATE);

export const startUpdatingLikes = () => setLoading(LOADING_KEYS.LIKES_UPDATE, true, 'Updating likes...');
export const finishUpdatingLikes = () => clearLoading(LOADING_KEYS.LIKES_UPDATE);

export const startLoadingMessages = () => setLoading(LOADING_KEYS.MESSAGES_LOAD, true, 'Loading messages...');
export const finishLoadingMessages = () => clearLoading(LOADING_KEYS.MESSAGES_LOAD);

export const startSendingMessage = () => setLoading(LOADING_KEYS.MESSAGES_SEND, true, 'Sending message...');
export const finishSendingMessage = () => clearLoading(LOADING_KEYS.MESSAGES_SEND);

export const startSearch = () => setLoading(LOADING_KEYS.SEARCH, true, 'Searching...');
export const finishSearch = () => clearLoading(LOADING_KEYS.SEARCH);

export const startUpload = () => setLoading(LOADING_KEYS.UPLOAD, true, 'Uploading...');
export const finishUpload = () => clearLoading(LOADING_KEYS.UPLOAD);

export const startDownload = () => setLoading(LOADING_KEYS.DOWNLOAD, true, 'Downloading...');
export const finishDownload = () => clearLoading(LOADING_KEYS.DOWNLOAD);

export const startApiCall = (endpoint) => setLoading(LOADING_KEYS.API_CALL, true, `Calling ${endpoint}...`);
export const finishApiCall = () => clearLoading(LOADING_KEYS.API_CALL);

// Timeout management for loading states
const loadingTimeouts = new Map();

export const setLoadingWithTimeout = (key, timeout = 30000, message = 'Loading...') => {
  setLoading(key, true, message);
  
  // Clear existing timeout
  if (loadingTimeouts.has(key)) {
    clearTimeout(loadingTimeouts.get(key));
  }
  
  // Set new timeout
  const timeoutId = setTimeout(() => {
    console.warn(`Loading timeout for ${key} after ${timeout}ms`);
    clearLoading(key);
    loadingTimeouts.delete(key);
  }, timeout);
  
  loadingTimeouts.set(key, timeoutId);
  
  return () => {
    if (loadingTimeouts.has(key)) {
      clearTimeout(loadingTimeouts.get(key));
      loadingTimeouts.delete(key);
    }
    clearLoading(key);
  };
};

export const clearLoadingTimeout = (key) => {
  if (loadingTimeouts.has(key)) {
    clearTimeout(loadingTimeouts.get(key));
    loadingTimeouts.delete(key);
  }
};

export const clearAllLoadingTimeouts = () => {
  for (const [key, timeoutId] of loadingTimeouts) {
    clearTimeout(timeoutId);
  }
  loadingTimeouts.clear();
};

// React hook-like functionality for non-React environments
export const createLoadingHook = () => {
  let currentStates = getAllLoadingStates();
  const stateListeners = new Set();
  
  const notifyStateChange = () => {
    const newStates = getAllLoadingStates();
    stateListeners.forEach(listener => {
      try {
        listener(newStates, currentStates);
      } catch (error) {
        console.error('Loading state hook listener error:', error);
      }
    });
    currentStates = newStates;
  };
  
  onLoadingChange(notifyStateChange);
  
  return {
    getStates: () => currentStates,
    subscribe: (callback) => {
      stateListeners.add(callback);
      return () => stateListeners.delete(callback);
    },
    cleanup: () => {
      stateListeners.clear();
      removeLoadingListener(notifyStateChange);
    }
  };
};

export default {
  setLoading,
  getLoadingState,
  isLoading,
  getAllLoadingStates,
  clearLoading,
  clearAllLoading,
  hasAnyLoading,
  getActiveLoadingStates,
  getActiveLoadingCount,
  onLoadingChange,
  removeLoadingListener,
  removeAllLoadingListeners,
  LOADING_KEYS,
  setLoadingWithTimeout,
  clearLoadingTimeout,
  clearAllLoadingTimeouts,
  createLoadingHook,
  // Helper functions
  startAppInit,
  finishAppInit,
  startAuth,
  finishAuth,
  startLoadingPosts,
  finishLoadingPosts,
  startCreatingPost,
  finishCreatingPost,
  startUpdatingPost,
  finishUpdatingPost,
  startDeletingPost,
  finishDeletingPost,
  startLoadingComments,
  finishLoadingComments,
  startCreatingComment,
  finishCreatingComment,
  startUpdatingLikes,
  finishUpdatingLikes,
  startLoadingMessages,
  finishLoadingMessages,
  startSendingMessage,
  finishSendingMessage,
  startSearch,
  finishSearch,
  startUpload,
  finishUpload,
  startDownload,
  finishDownload,
  startApiCall,
  finishApiCall
};
