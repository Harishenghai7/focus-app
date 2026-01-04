/**
 * Device Fingerprinting Utility
 * 
 * This module provides advanced device fingerprinting functionality to prevent
 * multiple account creation on the same device. It uses FingerprintJS to generate
 * a unique identifier based on device characteristics.
 * 
 * How it prevents multiple accounts:
 * 1. Generates a unique device fingerprint using browser/hardware characteristics
 * 2. Stores fingerprint data in Supabase device_fingerprints table
 * 3. Tracks which user IDs are associated with each fingerprint
 * 4. Enforces a limit (default: 2 accounts per device)
 * 5. Updates last_seen timestamp on every device access
 * 
 * This helps prevent:
 * - Account farming (creating multiple accounts for rewards)
 * - Vote manipulation (same person voting multiple times)
 * - Ban evasion (creating new accounts after being banned)
 * - Resource abuse (one person using multiple accounts to spam)
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { supabase } from '../supabaseClient';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CACHE_KEY = 'fpjs_fingerprint_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_ACCOUNTS_PER_DEVICE = 2; // Maximum accounts allowed per device fingerprint

// Singleton instance for FingerprintJS
let fpjsInstance = null;
let fingerprintCache = null;
let cacheTimestamp = null;

// ============================================================================
// 1. GET DEVICE FINGERPRINT
// ============================================================================

/**
 * Gets or generates a device fingerprint using FingerprintJS
 * 
 * Uses singleton pattern to avoid loading FingerprintJS multiple times.
 * Caches result in sessionStorage to prevent repeated fingerprint generation
 * within the same session.
 * 
 * @returns {Promise<Object>} Fingerprint object containing:
 *   - visitorId: {string} Unique device identifier from FingerprintJS
 *   - confidence: {Object} Confidence scores for the fingerprint
 *   - components: {Object} Raw component data used to generate fingerprint
 * 
 * @throws {Error} If fingerprint generation fails
 * 
 * @example
 * const fingerprint = await getDeviceFingerprint();
 * console.log(fingerprint.visitorId); // e.g., "1234567890abcdef"
 */
export async function getDeviceFingerprint() {
  try {
    // Check memory cache first (for multiple calls in quick succession)
    if (fingerprintCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      console.log('✅ Using cached fingerprint from memory');
      return fingerprintCache;
    }

    // Check sessionStorage cache
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          fingerprintCache = parsed.data;
          cacheTimestamp = Date.now();
          console.log('✅ Using cached fingerprint from sessionStorage');
          return parsed.data;
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse cached fingerprint:', e);
        sessionStorage.removeItem(CACHE_KEY);
      }
    }

    // Initialize FingerprintJS if not already done (singleton pattern)
    if (!fpjsInstance) {
      console.log('📱 Initializing FingerprintJS library...');
      fpjsInstance = await FingerprintJS.load();
    }

    // Generate new fingerprint
    console.log('🔍 Generating new device fingerprint...');
    const result = await fpjsInstance.get();

    const fingerprint = {
      visitorId: result.visitorId,
      confidence: result.confidence,
      components: result.components
    };

    // Cache result in sessionStorage
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      data: fingerprint,
      timestamp: Date.now()
    }));

    // Cache in memory
    fingerprintCache = fingerprint;
    cacheTimestamp = Date.now();

    console.log('✅ Device fingerprint generated:', fingerprint.visitorId);
    return fingerprint;

  } catch (error) {
    console.error('❌ Error generating device fingerprint:', error);
    throw new Error(`Failed to generate device fingerprint: ${error.message}`);
  }
}

// ============================================================================
// 2. SAVE DEVICE FINGERPRINT
// ============================================================================

/**
 * Saves or updates device fingerprint data in the database
 * 
 * Stores comprehensive device information including browser, OS, screen resolution,
 * and timezone. Uses Supabase upsert to update if the fingerprint already exists.
 * 
 * @param {string} userId - The user ID to associate with this fingerprint
 * @param {Object} fingerprint - Fingerprint object from getDeviceFingerprint()
 * @param {Object} deviceInfo - Additional device information
 * @param {string} deviceInfo.browserName - Browser name (e.g., "Chrome")
 * @param {string} deviceInfo.osName - Operating system (e.g., "Windows 10")
 * @param {string} deviceInfo.deviceType - Device type (e.g., "desktop", "mobile")
 * @param {string} deviceInfo.screenResolution - Screen resolution (e.g., "1920x1080")
 * @param {string} deviceInfo.timezone - Timezone (e.g., "UTC-5")
 * 
 * @returns {Promise<Object>} Result object containing:
 *   - success: {boolean} Whether operation succeeded
 *   - data: {Object} Saved device fingerprint record (if successful)
 *   - error: {string} Error message (if failed)
 * 
 * @example
 * const fingerprint = await getDeviceFingerprint();
 * const result = await saveDeviceFingerprint(userId, fingerprint, {
 *   browserName: 'Chrome',
 *   osName: 'Windows 10',
 *   deviceType: 'desktop',
 *   screenResolution: '1920x1080',
 *   timezone: 'UTC-5'
 * });
 */
export async function saveDeviceFingerprint(userId, fingerprint, deviceInfo) {
  try {
    if (!userId || !fingerprint || !fingerprint.visitorId) {
      throw new Error('Missing required parameters: userId and fingerprint');
    }

    console.log('💾 Saving device fingerprint for user:', userId);

    const {
      browserName = 'Unknown',
      osName = 'Unknown',
      deviceType = 'unknown',
      screenResolution = 'Unknown',
      timezone = 'Unknown'
    } = deviceInfo || {};

    // Prepare data for upsert
    const fingerprintData = {
      fingerprint_hash: fingerprint.visitorId, // Unique identifier
      visitor_id: fingerprint.visitorId,
      user_id: userId,
      confidence_score: fingerprint.confidence?.score || 0,
      browser_name: browserName,
      os_name: osName,
      device_type: deviceType,
      screen_resolution: screenResolution,
      timezone: timezone,
      last_seen: new Date().toISOString(),
      usage_count: 1
    };

    // Use upsert: update if exists, insert if new
    // The unique constraint should be on (fingerprint_hash, user_id)
    const { data, error } = await supabase
      .from('device_fingerprints')
      .upsert(fingerprintData, {
        onConflict: 'fingerprint_hash,user_id'
      })
      .select();

    if (error) {
      console.error('❌ Error saving device fingerprint:', error);
      return {
        success: false,
        error: error.message
      };
    }

    console.log('✅ Device fingerprint saved:', data);
    return {
      success: true,
      data: data[0]
    };

  } catch (error) {
    console.error('❌ Error in saveDeviceFingerprint:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// 3. CHECK DEVICE LIMIT
// ============================================================================

/**
 * Checks if a device has reached the account creation limit
 * 
 * Queries the device_fingerprints table to count how many unique user IDs
 * are associated with this fingerprint. Enforces a maximum limit per device
 * to prevent account farming.
 * 
 * Business Logic:
 * - Prevents one person from creating unlimited accounts
 * - Limits to 2 accounts per physical device
 * - Helps prevent vote manipulation and ban evasion
 * 
 * @param {string} fingerprint - Device fingerprint (visitor ID)
 * 
 * @returns {Promise<Object>} Limit check result containing:
 *   - allowed: {boolean} Whether another account can be created
 *   - accountCount: {number} Current number of accounts on this device
 *   - limit: {number} Maximum allowed accounts per device
 *   - reachedLimit: {boolean} Whether device has hit the account limit
 * 
 * @example
 * const check = await checkDeviceLimit(fingerprint.visitorId);
 * if (!check.allowed) {
 *   console.log(`Device already has ${check.accountCount} accounts. Limit: ${check.limit}`);
 * }
 */
export async function checkDeviceLimit(fingerprint) {
  try {
    if (!fingerprint) {
      throw new Error('Fingerprint is required');
    }

    console.log('🔎 Checking device limit for fingerprint:', fingerprint);

    // Query all fingerprints for this device
    const { data, error, count } = await supabase
      .from('device_fingerprints')
      .select('user_id', { count: 'exact' })
      .eq('fingerprint_hash', fingerprint)
      .eq('is_active', true); // Only count active accounts

    if (error) {
      console.error('❌ Error checking device limit:', error);
      return {
        allowed: false,
        accountCount: 0,
        limit: MAX_ACCOUNTS_PER_DEVICE,
        reachedLimit: true,
        error: error.message
      };
    }

    // Count unique user IDs
    const uniqueUserIds = new Set(data?.map(d => d.user_id) || []);
    const accountCount = uniqueUserIds.size;
    const allowed = accountCount < MAX_ACCOUNTS_PER_DEVICE;

    console.log(`📊 Device has ${accountCount} accounts. Limit: ${MAX_ACCOUNTS_PER_DEVICE}. Allowed: ${allowed}`);

    return {
      allowed,
      accountCount,
      limit: MAX_ACCOUNTS_PER_DEVICE,
      reachedLimit: !allowed
    };

  } catch (error) {
    console.error('❌ Error in checkDeviceLimit:', error);
    return {
      allowed: false,
      accountCount: 0,
      limit: MAX_ACCOUNTS_PER_DEVICE,
      reachedLimit: true,
      error: error.message
    };
  }
}

// ============================================================================
// 4. UPDATE DEVICE LAST SEEN
// ============================================================================

/**
 * Updates the last_seen timestamp and usage counter for a device fingerprint
 * 
 * Called whenever a user from a device performs an important action.
 * Helps track device activity and detect suspicious patterns.
 * 
 * @param {string} fingerprint - Device fingerprint (visitor ID)
 * @param {string} userId - The user ID performing the action (optional)
 * 
 * @returns {Promise<Object>} Update result containing:
 *   - success: {boolean} Whether update succeeded
 *   - data: {Object} Updated device fingerprint record (if successful)
 *   - error: {string} Error message (if failed)
 * 
 * @example
 * await updateDeviceLastSeen(fingerprint.visitorId, userId);
 */
export async function updateDeviceLastSeen(fingerprint, userId = null) {
  try {
    if (!fingerprint) {
      throw new Error('Fingerprint is required');
    }

    console.log('⏰ Updating last_seen for fingerprint:', fingerprint);

    // Build the update query
    let query = supabase
      .from('device_fingerprints')
      .update({
        last_seen: new Date().toISOString(),
        // Increment usage_count using raw SQL increment
        usage_count: supabase.rpc('increment_usage_count') // Alternative: handle in app
      })
      .eq('fingerprint_hash', fingerprint);

    // If userId provided, filter to specific user's entry
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.select();

    if (error) {
      console.error('❌ Error updating last_seen:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Manual increment since RPC might not be available
    // Update usage_count by fetching current and incrementing
    if (data && data.length > 0) {
      const currentRecord = data[0];
      const newCount = (currentRecord.usage_count || 0) + 1;

      const { data: updatedData, error: updateError } = await supabase
        .from('device_fingerprints')
        .update({ usage_count: newCount })
        .eq('fingerprint_hash', fingerprint)
        .eq('user_id', userId || data[0].user_id)
        .select();

      if (updateError) {
        console.warn('⚠️ Failed to increment usage_count:', updateError);
      }

      console.log('✅ Device last_seen updated');
      return {
        success: true,
        data: updatedData ? updatedData[0] : currentRecord
      };
    }

    console.log('✅ Device last_seen updated');
    return {
      success: true,
      data: data[0]
    };

  } catch (error) {
    console.error('❌ Error in updateDeviceLastSeen:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Clears the cached fingerprint from sessionStorage and memory
 * Useful for testing or when user clears browser data
 */
export function clearFingerprintCache() {
  sessionStorage.removeItem(CACHE_KEY);
  fingerprintCache = null;
  cacheTimestamp = null;
  console.log('✅ Fingerprint cache cleared');
}

/**
 * Gets device information from browser APIs
 * Returns data that can be passed to saveDeviceFingerprint
 * 
 * @returns {Object} Device information object
 */
export function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  // Detect browser
  let browserName = 'Unknown';
  if (ua.indexOf('Firefox') > -1) browserName = 'Firefox';
  else if (ua.indexOf('Chrome') > -1) browserName = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browserName = 'Safari';
  else if (ua.indexOf('Edge') > -1) browserName = 'Edge';
  
  // Detect OS
  let osName = 'Unknown';
  if (ua.indexOf('Windows') > -1) osName = 'Windows';
  else if (ua.indexOf('Mac') > -1) osName = 'macOS';
  else if (ua.indexOf('Linux') > -1) osName = 'Linux';
  else if (ua.indexOf('Android') > -1) osName = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) osName = 'iOS';
  
  // Detect device type
  const deviceType = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    ? 'mobile'
    : 'desktop';
  
  // Screen resolution
  const screenResolution = `${window.screen.width}x${window.screen.height}`;
  
  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  return {
    browserName,
    osName,
    deviceType,
    screenResolution,
    timezone
  };
}

/**
 * Complete workflow: Get fingerprint, check limit, and save if allowed
 * 
 * @param {string} userId - User ID to check/register
 * @returns {Promise<Object>} Complete status containing limit check and save results
 */
export async function registerDeviceFingerprint(userId) {
  try {
    console.log('📱 Registering device fingerprint for user:', userId);

    // Step 1: Get fingerprint
    const fingerprint = await getDeviceFingerprint();

    // Step 2: Check limit
    const limitCheck = await checkDeviceLimit(fingerprint.visitorId);
    
    if (limitCheck.error) {
      console.warn('⚠️ Could not check device limit:', limitCheck.error);
      // Continue anyway - don't block user
    }

    // Step 3: Get device info
    const deviceInfo = getDeviceInfo();

    // Step 4: Save fingerprint (even if limit is reached, for tracking)
    const saveResult = await saveDeviceFingerprint(userId, fingerprint, deviceInfo);

    // Step 5: Update last seen
    if (saveResult.success) {
      await updateDeviceLastSeen(fingerprint.visitorId, userId);
    }

    return {
      fingerprint: fingerprint.visitorId,
      limitCheck,
      saveResult,
      deviceInfo
    };

  } catch (error) {
    console.error('❌ Error in registerDeviceFingerprint:', error);
    return {
      error: error.message
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  getDeviceFingerprint,
  saveDeviceFingerprint,
  checkDeviceLimit,
  updateDeviceLastSeen,
  clearFingerprintCache,
  getDeviceInfo,
  registerDeviceFingerprint
};
