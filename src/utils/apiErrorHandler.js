// Global API error handler for session expiry and auth issues
import { supabase } from '../supabaseClient';

let sessionExpiredCallback = null;

export const setSessionExpiredCallback = (callback) => {
  sessionExpiredCallback = callback;
};

export const handleApiError = async (error) => {
  // Handle session expiry (401/403)
  if (error?.status === 401 || error?.status === 403 || error?.message?.includes('JWT')) {
    // Try to refresh session
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError || !session) {
      // Session refresh failed - logout user
      if (sessionExpiredCallback) {
        sessionExpiredCallback();
      } else {
        // Fallback: clear session and redirect
        await supabase.auth.signOut();
        window.location.href = '/auth';
      }
      
      return { shouldRetry: false, error: 'Session expired' };
    }
    
    // Session refreshed successfully
    return { shouldRetry: true, error: null };
  }
  
  // Handle network errors
  if (error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
    return { shouldRetry: false, error: 'Network error. Please check your connection.' };
  }
  
  // Handle rate limiting
  if (error?.status === 429) {
    return { shouldRetry: false, error: 'Too many requests. Please try again later.' };
  }
  
  // Generic error
  return { shouldRetry: false, error: error?.message || 'An error occurred' };
};

// Wrapper for Supabase queries with automatic error handling
export const withErrorHandling = async (queryFn, retryCount = 1) => {
  try {
    const result = await queryFn();
    
    if (result.error) {
      const { shouldRetry, error } = await handleApiError(result.error);
      
      if (shouldRetry && retryCount > 0) {
        // Retry the query after session refresh
        return await withErrorHandling(queryFn, retryCount - 1);
      }
      
      return { data: null, error };
    }
    
    return result;
  } catch (error) {
    const { shouldRetry, error: handledError } = await handleApiError(error);
    
    if (shouldRetry && retryCount > 0) {
      return await withErrorHandling(queryFn, retryCount - 1);
    }
    
    return { data: null, error: handledError };
  }
};

// Monitor auth state changes
export const setupAuthMonitoring = (onSessionExpired) => {
  setSessionExpiredCallback(onSessionExpired);
  
  // Listen for auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
    } else if (event === 'TOKEN_REFRESHED') {
    } else if (event === 'USER_UPDATED') {
    }
  });
  
  return subscription;
};
