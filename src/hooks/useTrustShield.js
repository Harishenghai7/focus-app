import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';
import {
  getTrustShieldStatus,
  checkActionPermission,
  updateTrustScore
} from '../utils/trustShieldManager';

/**
 * useTrustShield - React Hook for Trust Shield Integration
 * 
 * Provides easy access to user's trust and verification status throughout the application.
 * Automatically fetches status, subscribes to real-time updates, and provides helper functions.
 * 
 * @returns {Object} Trust Shield state and functions
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const {
 *     trustScore,
 *     verificationLevel,
 *     canPerform,
 *     isLoading
 *   } = useTrustShield();
 * 
 *   const handlePost = async () => {
 *     const permission = await canPerform('post');
 *     if (permission.allowed) {
 *       // Create post
 *     } else {
 *       alert(permission.reason);
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <p>Trust Score: {trustScore}/100</p>
 *       <p>Level: {verificationLevel}</p>
 *       <button onClick={handlePost}>Create Post</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useTrustShield() {
  // State management
  const [trustStatus, setTrustStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  // Refs for cleanup and optimization
  const subscriptionRef = useRef(null);
  const autoRefreshIntervalRef = useRef(null);
  const cacheRef = useRef({
    permissions: {},
    lastFetch: null
  });

  /**
   * Get current user ID from auth session
   */
  const getCurrentUserId = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      return session?.user?.id || null;
    } catch (err) {
      console.error('Error getting user ID:', err);
      return null;
    }
  }, []);

  /**
   * Fetch trust shield status from database
   * Uses caching to minimize database queries
   */
  const fetchTrustStatus = useCallback(async (forceRefresh = false) => {
    try {
      const currentUserId = userId || await getCurrentUserId();
      if (!currentUserId) {
        setTrustStatus(null);
        setIsLoading(false);
        return;
      }

      setUserId(currentUserId);

      // Check cache (5 minute expiry)
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      if (
        !forceRefresh &&
        cacheRef.current.lastFetch &&
        (now - cacheRef.current.lastFetch) < cacheExpiry &&
        trustStatus
      ) {
        setIsLoading(false);
        return; // Use cached data
      }

      setIsLoading(true);
      setError(null);

      // Fetch fresh status
      const status = await getTrustShieldStatus(currentUserId);
      
      setTrustStatus(status);
      cacheRef.current.lastFetch = now;
      setIsLoading(false);

    } catch (err) {
      console.error('Error fetching trust status:', err);
      setError(err.message || 'Failed to load trust status');
      setIsLoading(false);
    }
  }, [userId, trustStatus]);

  /**
   * Subscribe to real-time updates for user verification changes
   * Automatically updates status when database changes occur
   */
  const subscribeToUpdates = useCallback(async () => {
    const currentUserId = userId || await getCurrentUserId();
    if (!currentUserId) return;

    // Unsubscribe from previous subscription if exists
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    // Subscribe to user_identity_verification changes
    const channel = supabase
      .channel(`trust-shield-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_identity_verification',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Trust Shield update received:', payload);
          // Refresh status on any change
          fetchTrustStatus(true);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Trust Shield real-time updates: Connected');
        }
      });

    subscriptionRef.current = channel;

    // Also subscribe to verification events for additional context
    const eventsChannel = supabase
      .channel(`trust-events-${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'verification_events',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('Verification event:', payload.new);
          // Refresh on important events
          if (['trust_score_update', 'full_verification'].includes(payload.new.event_type)) {
            fetchTrustStatus(true);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (eventsChannel) supabase.removeChannel(eventsChannel);
    };
  }, [userId, fetchTrustStatus]);

  /**
   * Set up auto-refresh interval
   * Refreshes trust status every 5 minutes to ensure data freshness
   */
  const setupAutoRefresh = useCallback(() => {
    // Clear existing interval
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    // Set up new interval (5 minutes)
    autoRefreshIntervalRef.current = setInterval(() => {
      console.log('Auto-refreshing trust status...');
      fetchTrustStatus(true);
    }, 5 * 60 * 1000);

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, [fetchTrustStatus]);

  /**
   * Check if user can perform a specific action
   * Uses permission caching to minimize API calls
   * 
   * @param {string} actionType - Type of action ('post', 'comment', 'like', 'follow', 'message')
   * @returns {Promise<Object>} Permission object with allowed status and details
   * 
   * @example
   * ```jsx
   * const permission = await canPerform('post');
   * if (permission.allowed) {
   *   // Proceed with action
   * } else {
   *   alert(permission.reason);
   *   if (permission.waitTime) {
   *     console.log(`Try again in ${permission.waitTime} seconds`);
   *   }
   * }
   * ```
   */
  const canPerform = useCallback(async (actionType) => {
    try {
      const currentUserId = userId || await getCurrentUserId();
      if (!currentUserId) {
        return {
          allowed: false,
          reason: 'User not authenticated',
          limit: 0,
          remaining: 0
        };
      }

      // Check permission cache (1 minute expiry for permissions)
      const cacheKey = `${actionType}_${Date.now()}`;
      const permissionCacheExpiry = 60 * 1000; // 1 minute
      const cachedPermission = cacheRef.current.permissions[actionType];
      
      if (cachedPermission && (Date.now() - cachedPermission.timestamp) < permissionCacheExpiry) {
        return cachedPermission.result;
      }

      // Fetch fresh permission
      const permission = await checkActionPermission(currentUserId, actionType);

      // Cache the result
      cacheRef.current.permissions[actionType] = {
        result: permission,
        timestamp: Date.now()
      };

      return permission;

    } catch (err) {
      console.error('Error checking permission:', err);
      return {
        allowed: false,
        reason: 'Error checking permissions',
        error: err.message
      };
    }
  }, [userId]);

  /**
   * Trigger trust score recalculation
   * Useful after important user actions (email verified, report resolved, etc.)
   * 
   * @param {string} reason - Reason for trust update
   * @param {Object} metadata - Additional context
   * @returns {Promise<Object>} Updated trust information
   * 
   * @example
   * ```jsx
   * // After email verification
   * await updateTrust('email_verified');
   * 
   * // After suspicious activity detected
   * await updateTrust('suspicious_activity', { details: 'Spam detected' });
   * ```
   */
  const updateTrust = useCallback(async (reason = 'manual_update', metadata = {}) => {
    try {
      const currentUserId = userId || await getCurrentUserId();
      if (!currentUserId) {
        throw new Error('User not authenticated');
      }

      setIsLoading(true);
      setError(null);

      // Trigger trust score update
      const result = await updateTrustScore(currentUserId, reason, metadata);

      // Refresh status to get latest data
      await fetchTrustStatus(true);

      return result;

    } catch (err) {
      console.error('Error updating trust:', err);
      setError(err.message || 'Failed to update trust score');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchTrustStatus]);

  /**
   * Manually refresh trust status
   * Forces a fresh fetch from database, bypassing cache
   * 
   * @returns {Promise<void>}
   * 
   * @example
   * ```jsx
   * <button onClick={refreshStatus}>
   *   Refresh Status
   * </button>
   * ```
   */
  const refreshStatus = useCallback(async () => {
    // Clear permission cache
    cacheRef.current.permissions = {};
    // Force refresh
    await fetchTrustStatus(true);
  }, [fetchTrustStatus]);

  /**
   * Clear all cached data
   * Useful when logging out or switching users
   */
  const clearCache = useCallback(() => {
    cacheRef.current = {
      permissions: {},
      lastFetch: null
    };
    setTrustStatus(null);
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      if (!mounted) return;

      // Get user ID and fetch initial status
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        setIsLoading(false);
        return;
      }

      setUserId(currentUserId);
      await fetchTrustStatus(false);
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [getCurrentUserId, fetchTrustStatus]);

  // Set up real-time subscription when user ID is available
  useEffect(() => {
    if (!userId) return;

    let cleanup;
    subscribeToUpdates().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [userId, subscribeToUpdates]);

  // Set up auto-refresh
  useEffect(() => {
    if (!userId) return;

    const cleanup = setupAutoRefresh();
    return cleanup;
  }, [userId, setupAutoRefresh]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from real-time updates
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }

      // Clear auto-refresh interval
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

  // Extract commonly used values for convenience
  const trustScore = trustStatus?.trustScore ?? 0;
  const verificationLevel = trustStatus?.verificationLevel ?? 'unverified';
  const restrictions = trustStatus?.restrictions ?? {};
  const badges = trustStatus?.badges ?? [];
  const rateLimits = trustStatus?.rateLimits ?? {};
  const details = trustStatus?.details ?? {};

  return {
    /**
     * Complete trust shield status object
     * Contains all verification data including scores, badges, restrictions
     * @type {Object|null}
     */
    trustStatus,

    /**
     * Trust score (0-100)
     * Higher scores indicate more trusted users
     * @type {number}
     */
    trustScore,

    /**
     * Verification level
     * Possible values: 'new', 'unverified', 'basic', 'verified', 'trusted', 'highly_trusted'
     * @type {string}
     */
    verificationLevel,

    /**
     * Account restrictions object
     * Contains flags like posting_disabled, follow_limit, requires_captcha
     * @type {Object}
     */
    restrictions,

    /**
     * Earned badges array
     * Each badge has: { id, name, icon }
     * @type {Array}
     */
    badges,

    /**
     * Rate limits for current verification level
     * Contains: posts_per_hour, comments_per_hour, etc.
     * @type {Object}
     */
    rateLimits,

    /**
     * Additional verification details
     * Contains: emailVerified, phoneVerified, captchaPassed, etc.
     * @type {Object}
     */
    details,

    /**
     * Loading state
     * True while fetching trust status
     * @type {boolean}
     */
    isLoading,

    /**
     * Error message if fetch failed
     * @type {string|null}
     */
    error,

    /**
     * Check if user can perform an action
     * @function
     * @param {string} actionType - Action type ('post', 'comment', 'like', 'follow', 'message')
     * @returns {Promise<Object>} Permission object with allowed, reason, limit, remaining
     */
    canPerform,

    /**
     * Trigger trust score recalculation
     * @function
     * @param {string} reason - Reason for update
     * @param {Object} metadata - Additional context
     * @returns {Promise<Object>} Updated trust data
     */
    updateTrust,

    /**
     * Refresh trust status (force reload)
     * @function
     * @returns {Promise<void>}
     */
    refreshStatus,

    /**
     * Clear all cached data
     * @function
     */
    clearCache,

    /**
     * Current user ID
     * @type {string|null}
     */
    userId,

    /**
     * Check if user is verified (convenience helper)
     * @type {boolean}
     */
    isVerified: verificationLevel !== 'unverified' && verificationLevel !== 'new',

    /**
     * Check if user is trusted (convenience helper)
     * @type {boolean}
     */
    isTrusted: trustScore >= 70,

    /**
     * Check if user has any restrictions (convenience helper)
     * @type {boolean}
     */
    hasRestrictions: Object.keys(restrictions).length > 0,

    /**
     * Check if user requires manual review (convenience helper)
     * @type {boolean}
     */
    requiresReview: details?.manualReviewRequired ?? false
  };
}

/**
 * Context provider for Trust Shield (optional)
 * Can be used to provide trust status to entire component tree
 * 
 * @example
 * ```jsx
 * import { TrustShieldProvider } from './hooks/useTrustShield';
 * 
 * function App() {
 *   return (
 *     <TrustShieldProvider>
 *       <YourApp />
 *     </TrustShieldProvider>
 *   );
 * }
 * ```
 */

const TrustShieldContext = createContext(null);

export function TrustShieldProvider({ children }) {
  const trustShield = useTrustShield();

  return (
    <TrustShieldContext.Provider value={trustShield}>
      {children}
    </TrustShieldContext.Provider>
  );
}

/**
 * Hook to use Trust Shield context
 * Must be used within TrustShieldProvider
 * 
 * @returns {Object} Trust Shield state and functions
 * @throws {Error} If used outside TrustShieldProvider
 */
export function useTrustShieldContext() {
  const context = useContext(TrustShieldContext);
  if (!context) {
    throw new Error('useTrustShieldContext must be used within TrustShieldProvider');
  }
  return context;
}

// Default export
export default useTrustShield;
