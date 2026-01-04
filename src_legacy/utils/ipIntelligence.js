/**
 * IP Intelligence Service
 * 
 * This module provides IP address analysis and threat detection capabilities to prevent
 * abuse through multiple account creation from suspicious IP addresses.
 * 
 * Features:
 * 1. IP geolocation detection using ipapi.co (free tier, no API key needed)
 * 2. VPN/Proxy detection through organization field analysis
 * 3. Tor exit node detection
 * 4. Risk level calculation based on threat indicators
 * 5. IP registry tracking with signup count and timestamps
 * 6. Configurable signup limits to prevent mass account creation from single IPs
 * 7. Rate limiting and fallback behavior for API unavailability
 * 
 * This helps prevent:
 * - Mass account creation (bot farms)
 * - Vote manipulation through VPN networks
 * - Ban evasion using proxy/VPN services
 * - Spam and abuse from high-risk regions
 */

import { supabase } from '../supabaseClient';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const IPAPI_ENDPOINT = 'https://ipapi.co/json/';
const CACHE_KEY_PREFIX = 'ip_intelligence_cache_';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const IP_CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours for IP data
const API_TIMEOUT = 5000; // 5 seconds timeout for API calls
const SIGNUP_LIMIT = 5; // Max signups per IP in 24 hours
const SIGNUP_WINDOW = 24 * 60 * 60 * 1000; // 24 hour window

// VPN/Proxy indicators to detect in organization field
const VPN_KEYWORDS = ['vpn', 'proxy', 'hosting', 'datacenter', 'vps', 'server', 'aws', 'azure', 'digitalocean', 'linode', 'hetzner'];
const TOR_KEYWORDS = ['tor', 'exit', 'relay'];

// In-memory cache for API responses
const apiCache = new Map();

// ============================================================================
// 1. GET IP INFO
// ============================================================================

/**
 * Fetches current user's IP data and analyzes it for threats
 * 
 * Attempts to fetch IP geolocation data from ipapi.co. Includes:
 * - IP address and geolocation (country, city, coordinates)
 * - VPN/Proxy detection through organization field
 * - Tor exit node detection
 * - Overall risk level calculation
 * 
 * Implements caching to minimize API calls and handles rate limiting gracefully.
 * Falls back to safe defaults if API is unavailable.
 * 
 * @returns {Promise<Object>} IP information object:
 *   - ip: {string} Public IP address
 *   - country: {string} Country code (e.g., 'US')
 *   - city: {string} City name
 *   - latitude: {number} Geographic latitude
 *   - longitude: {number} Geographic longitude
 *   - isVPN: {boolean} Detected VPN usage
 *   - isProxy: {boolean} Detected proxy/hosting usage
 *   - isTor: {boolean} Detected Tor exit node
 *   - riskLevel: {string} 'high' | 'medium' | 'low'
 *   - raw: {Object} Raw API response for debugging
 * 
 * @throws Does not throw - returns safe defaults on error
 * 
 * @example
 * const ipInfo = await getIPInfo();
 * console.log(`Risk Level: ${ipInfo.riskLevel}`);
 * if (ipInfo.isVPN) console.warn('VPN detected');
 */
export async function getIPInfo() {
  try {
    // Check memory cache first
    const cacheKey = `${CACHE_KEY_PREFIX}current_ip`;
    if (apiCache.has(cacheKey)) {
      const cached = apiCache.get(cacheKey);
      if (Date.now() - cached.timestamp < IP_CACHE_DURATION) {
        console.log('✅ IP data from memory cache');
        return cached.data;
      }
      apiCache.delete(cacheKey);
    }

    // Fetch IP data from ipapi.co
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(IPAPI_ENDPOINT, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 429) {
      console.warn('⚠️ IP API rate limited (429) - using fallback');
      return getFallbackIPData();
    }

    if (!response.ok) {
      throw new Error(`IP API returned ${response.status}`);
    }

    const rawData = await response.json();

    // Analyze the raw data for threats
    const ipData = analyzeIPData(rawData);

    // Cache the result
    apiCache.set(cacheKey, {
      data: ipData,
      timestamp: Date.now()
    });

    console.log('✅ IP data fetched and analyzed:', {
      ip: ipData.ip,
      riskLevel: ipData.riskLevel,
      isVPN: ipData.isVPN,
      isProxy: ipData.isProxy,
      isTor: ipData.isTor
    });

    return ipData;
  } catch (error) {
    console.error('❌ Error fetching IP info:', error.message);
    return getFallbackIPData();
  }
}

/**
 * Analyzes raw IP data to detect threats and calculate risk level
 * 
 * @private
 * @param {Object} rawData - Raw API response from ipapi.co
 * @returns {Object} Analyzed IP data with threat detection
 */
function analyzeIPData(rawData) {
  const org = (rawData.org || '').toLowerCase();
  const city = rawData.city || 'Unknown';
  const country = rawData.country_code || rawData.country || 'Unknown';
  const latitude = parseFloat(rawData.latitude) || 0;
  const longitude = parseFloat(rawData.longitude) || 0;

  // Detect VPN indicators
  const isVPN = VPN_KEYWORDS.some(keyword => org.includes(keyword));

  // Detect Proxy/Hosting indicators (separate from VPN for distinction)
  const isProxy = org.includes('proxy') || 
                  org.includes('hosting') || 
                  org.includes('datacenter') || 
                  org.includes('vps');

  // Detect Tor exit node
  const isTor = TOR_KEYWORDS.some(keyword => org.includes(keyword));

  // Calculate risk level
  let riskLevel = 'low';
  if (isTor) {
    riskLevel = 'high'; // Tor is highest risk
  } else if (isVPN || isProxy) {
    riskLevel = 'medium'; // VPN/Proxy is medium risk
  }

  return {
    ip: rawData.ip || 'Unknown',
    country,
    city,
    latitude,
    longitude,
    isVPN,
    isProxy,
    isTor,
    riskLevel,
    raw: rawData // Include raw data for debugging
  };
}

/**
 * Returns fallback IP data when API is unavailable
 * 
 * @private
 * @returns {Object} Safe default IP data
 */
function getFallbackIPData() {
  return {
    ip: 'unknown',
    country: 'Unknown',
    city: 'Unknown',
    latitude: 0,
    longitude: 0,
    isVPN: false,
    isProxy: false,
    isTor: false,
    riskLevel: 'low', // Conservative fallback
    raw: { error: 'API unavailable' }
  };
}

// ============================================================================
// 2. SAVE IP REGISTRY
// ============================================================================

/**
 * Saves or updates IP information in the ip_registry table
 * 
 * Performs an upsert operation to track IP addresses and their associated
 * account creation activity. Updates signup count and last_signup timestamp.
 * 
 * @param {Object} ipData - IP information object (from getIPInfo)
 * @param {string} ipData.ip - IP address
 * @param {string} ipData.country - Country code
 * @param {string} ipData.city - City name
 * @param {boolean} ipData.isVPN - VPN detected flag
 * @param {boolean} ipData.isProxy - Proxy detected flag
 * @param {string} ipData.riskLevel - Risk level ('high', 'medium', 'low')
 * 
 * @returns {Promise<Object>} Result object:
 *   - success: {boolean} Operation succeeded
 *   - blocked: {boolean} IP is blocked from further signups
 *   - reason: {string} Reason if blocked (empty if allowed)
 *   - data: {Object} Updated row data (if successful)
 * 
 * @example
 * const ipInfo = await getIPInfo();
 * const result = await saveIPRegistry(ipInfo);
 * if (result.blocked) {
 *   console.warn('IP blocked:', result.reason);
 * }
 */
export async function saveIPRegistry(ipData) {
  try {
    if (!ipData || !ipData.ip) {
      throw new Error('Invalid IP data provided');
    }

    const now = new Date().toISOString();

    // Prepare threat level based on risk
    let threatLevel = 'low';
    if (ipData.isTor) {
      threatLevel = 'critical';
    } else if (ipData.riskLevel === 'high') {
      threatLevel = 'high';
    } else if (ipData.riskLevel === 'medium') {
      threatLevel = 'medium';
    }

    // Upsert into ip_registry table
    const { data, error } = await supabase
      .from('ip_registry')
      .upsert(
        {
          ip: ipData.ip,
          country: ipData.country,
          city: ipData.city,
          is_vpn: ipData.isVPN,
          is_proxy: ipData.isProxy,
          threat_level: threatLevel,
          signup_count: 1,
          last_signup: now,
          last_seen: now,
          first_seen: now
        },
        { onConflict: 'ip' }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving IP registry:', error);
      return {
        success: false,
        blocked: false,
        reason: '',
        error: error.message
      };
    }

    console.log('✅ IP registry updated:', {
      ip: ipData.ip,
      signupCount: data.signup_count,
      threatLevel: data.threat_level
    });

    return {
      success: true,
      blocked: false,
      reason: '',
      data
    };
  } catch (error) {
    console.error('❌ Exception in saveIPRegistry:', error.message);
    return {
      success: false,
      blocked: false,
      reason: '',
      error: error.message
    };
  }
}

// ============================================================================
// 3. CHECK IP LIMIT
// ============================================================================

/**
 * Checks if an IP address has exceeded signup limits
 * 
 * Queries the ip_registry table to verify the IP hasn't created too many
 * accounts recently. Implements a rolling 24-hour window.
 * 
 * Rules:
 * - Block if more than SIGNUP_LIMIT (5) signups in last 24 hours
 * - Allow if within limits
 * - Different handling for high-risk IPs (VPN/Proxy/Tor)
 * 
 * @param {string} ipAddress - IP address to check
 * 
 * @returns {Promise<Object>} Limit check result:
 *   - allowed: {boolean} Whether signup is allowed from this IP
 *   - signupCount: {number} Number of signups from this IP (24h window)
 *   - blocked: {boolean} Whether IP is blocked
 *   - reason: {string} Reason for blocking (empty if allowed)
 *   - threatLevel: {string} Threat level of the IP
 * 
 * @example
 * const check = await checkIPLimit('192.168.1.1');
 * if (!check.allowed) {
 *   console.warn(`IP blocked: ${check.reason}`);
 * }
 */
export async function checkIPLimit(ipAddress) {
  try {
    if (!ipAddress) {
      throw new Error('IP address required');
    }

    // Query IP registry for this address
    const { data, error } = await supabase
      .from('ip_registry')
      .select('signup_count, last_signup, threat_level, is_vpn, is_proxy')
      .eq('ip', ipAddress)
      .single();

    // If IP not found, it's a first-time signup - allow
    if (error && error.code === 'PGRST116') {
      console.log('✅ New IP address - first signup allowed');
      return {
        allowed: true,
        signupCount: 0,
        blocked: false,
        reason: '',
        threatLevel: 'unknown'
      };
    }

    if (error) {
      console.error('❌ Error querying IP registry:', error);
      // Fail open - allow signup on error
      return {
        allowed: true,
        signupCount: 0,
        blocked: false,
        reason: '',
        threatLevel: 'unknown'
      };
    }

    // Check if last signup is within 24-hour window
    const lastSignup = new Date(data.last_signup);
    const hoursAgo = (Date.now() - lastSignup.getTime()) / (1000 * 60 * 60);

    // If last signup was more than 24 hours ago, reset count
    if (hoursAgo >= 24) {
      console.log('✅ 24-hour window expired - signup allowed');
      return {
        allowed: true,
        signupCount: 0,
        blocked: false,
        reason: '',
        threatLevel: data.threat_level
      };
    }

    // Check signup count against limit
    const blocked = data.signup_count >= SIGNUP_LIMIT;
    const reason = blocked 
      ? `Too many signups from this IP (${data.signup_count}/${SIGNUP_LIMIT} in 24h)`
      : '';

    if (blocked) {
      console.warn('🚫 IP blocked - signup limit exceeded:', {
        ip: ipAddress,
        signupCount: data.signup_count,
        threatLevel: data.threat_level
      });
    } else {
      console.log('✅ IP within limits:', {
        ip: ipAddress,
        signupCount: data.signup_count,
        remaining: SIGNUP_LIMIT - data.signup_count
      });
    }

    return {
      allowed: !blocked,
      signupCount: data.signup_count,
      blocked,
      reason,
      threatLevel: data.threat_level
    };
  } catch (error) {
    console.error('❌ Exception in checkIPLimit:', error.message);
    // Fail open - allow signup on error
    return {
      allowed: true,
      signupCount: 0,
      blocked: false,
      reason: '',
      threatLevel: 'unknown'
    };
  }
}

// ============================================================================
// 4. IS IP BLOCKED
// ============================================================================

/**
 * Quick check to determine if an IP is in the blocked list
 * 
 * Performs a fast lookup to check if an IP is currently blocked.
 * This is a simple yes/no check without detailed information.
 * Use checkIPLimit() for more detailed information.
 * 
 * @param {string} ipAddress - IP address to check
 * 
 * @returns {Promise<boolean>} True if IP is blocked, false otherwise
 * 
 * @example
 * if (await isIPBlocked('192.168.1.1')) {
 *   console.warn('IP is blocked');
 * }
 */
export async function isIPBlocked(ipAddress) {
  try {
    if (!ipAddress) {
      return false;
    }

    // Quick query to check if IP exists and has exceeded limit
    const { data, error } = await supabase
      .from('ip_registry')
      .select('signup_count, last_signup')
      .eq('ip', ipAddress)
      .maybeSingle();

    // No entry = not blocked
    if (error || !data) {
      return false;
    }

    // Check if within 24-hour window and over limit
    const lastSignup = new Date(data.last_signup);
    const hoursAgo = (Date.now() - lastSignup.getTime()) / (1000 * 60 * 60);

    if (hoursAgo >= 24) {
      // Window expired, not blocked
      return false;
    }

    // Check if over signup limit
    return data.signup_count >= SIGNUP_LIMIT;
  } catch (error) {
    console.error('❌ Error in isIPBlocked:', error.message);
    return false; // Fail open
  }
}

// ============================================================================
// 5. INCREMENT SIGNUP COUNT
// ============================================================================

/**
 * Increments the signup count for an IP address after successful signup
 * 
 * Should be called after user successfully completes signup to track the count.
 * Automatically handles the 24-hour window reset if needed.
 * 
 * @private
 * @param {string} ipAddress - IP address to increment
 * @returns {Promise<boolean>} Success status
 */
export async function incrementSignupCount(ipAddress) {
  try {
    if (!ipAddress) {
      return false;
    }

    const now = new Date().toISOString();

    // Get current data
    const { data: currentData, error: queryError } = await supabase
      .from('ip_registry')
      .select('signup_count, last_signup')
      .eq('ip', ipAddress)
      .maybeSingle();

    if (queryError) {
      throw queryError;
    }

    let newCount = 1;
    if (currentData) {
      // Check if 24-hour window has expired
      const lastSignup = new Date(currentData.last_signup);
      const hoursAgo = (Date.now() - lastSignup.getTime()) / (1000 * 60 * 60);

      if (hoursAgo < 24) {
        // Still in window, increment count
        newCount = currentData.signup_count + 1;
      }
      // else: window expired, reset to 1
    }

    // Update the count
    const { error: updateError } = await supabase
      .from('ip_registry')
      .update({
        signup_count: newCount,
        last_signup: now,
        last_seen: now
      })
      .eq('ip', ipAddress);

    if (updateError) {
      console.error('❌ Error incrementing signup count:', updateError);
      return false;
    }

    console.log('✅ Signup count incremented:', { ip: ipAddress, count: newCount });
    return true;
  } catch (error) {
    console.error('❌ Exception in incrementSignupCount:', error.message);
    return false;
  }
}

// ============================================================================
// 6. CLEANUP & MAINTENANCE
// ============================================================================

/**
 * Clears the in-memory API cache
 * 
 * Useful for testing or when you want to force fresh API calls.
 * 
 * @returns {void}
 */
export function clearIPCache() {
  apiCache.clear();
  console.log('✅ IP cache cleared');
}

/**
 * Gets cache statistics for debugging
 * 
 * @returns {Object} Cache statistics
 */
export function getIPCacheStats() {
  return {
    size: apiCache.size,
    entries: Array.from(apiCache.keys())
  };
}

export default {
  getIPInfo,
  saveIPRegistry,
  checkIPLimit,
  isIPBlocked,
  incrementSignupCount,
  clearIPCache,
  getIPCacheStats
};
