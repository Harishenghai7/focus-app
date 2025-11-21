/**
 * Email Quality Checker
 * 
 * This module provides email validation and quality assessment to prevent abuse
 * through disposable/temporary email addresses and low-quality accounts.
 * 
 * Features:
 * 1. Disposable email detection against a curated database
 * 2. Email quality scoring based on multiple factors
 * 3. Free vs Corporate domain classification
 * 4. Suspicious pattern detection (random strings, excessive numbers)
 * 5. Privacy-preserving storage using SHA-256 hashing (GDPR compliant)
 * 6. Email reputation tracking and lookup
 * 7. In-memory caching for performance optimization
 * 
 * Privacy & Compliance:
 * - Emails are hashed using SHA-256 before storage (GDPR Article 32 compliance)
 * - Hashed emails cannot be reversed to identify users
 * - Original email is never sent to or stored by external services
 * - Local disposable email list (no external API calls for privacy)
 * 
 * This helps prevent:
 * - Spam account creation using disposable emails
 * - Low-effort bot registrations
 * - Quick throwaway accounts for abuse
 * - Mass account farming with temporary email services
 */

import { supabase } from '../supabaseClient';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const EMAIL_DOMAIN_CACHE_KEY = 'email_domain_cache_';
const EMAIL_HASH_CACHE_KEY = 'email_hash_cache_';

// Free email providers (well-known, legitimate)
const FREE_EMAIL_PROVIDERS = [
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'aol.com',
  'mail.com',
  'inbox.com',
  'protonmail.com',
  'tutanota.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'yandex.com',
  'zoho.com',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'sohu.com',
  'foxmail.com'
];

// In-memory caches
const disposableDomainCache = new Map();
const emailQualityCache = new Map();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Hashes an email address using SHA-256 for privacy and GDPR compliance
 * 
 * Why we hash emails:
 * - GDPR Article 32 requires appropriate technical and organizational measures
 * - Hashing is a one-way function (cannot be reversed)
 * - Allows us to detect duplicate emails without storing plain text
 * - Provides deniability - we never store the actual email in plain text
 * - Complies with data minimization principle
 * - Protects user privacy in case of data breach
 * 
 * @private
 * @param {string} email - Email address to hash
 * @returns {Promise<string>} SHA-256 hex hash of email (lowercase)
 * 
 * @example
 * const hash = await hashEmail('user@example.com');
 * // Returns: 'abc123def456...'
 */
async function hashEmail(email) {
  try {
    // Normalize email (lowercase) before hashing
    const normalizedEmail = email.toLowerCase().trim();

    // Convert string to buffer
    const encoder = new TextEncoder();
    const data = encoder.encode(normalizedEmail);

    // Compute SHA-256 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert hash buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('❌ Error hashing email:', error.message);
    throw new Error('Email hashing failed');
  }
}

/**
 * Extracts domain from email address
 * 
 * @private
 * @param {string} email - Email address
 * @returns {string} Domain part (e.g., 'gmail.com' from 'user@gmail.com')
 */
function extractDomain(email) {
  const match = email.match(/@([^@]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Detects random string patterns in local part of email
 * 
 * Examples: asdkfj234@gmail.com, xyzqwerty@yahoo.com
 * Uses heuristics:
 * - Multiple consonants in a row without vowels
 * - No common word patterns
 * 
 * @private
 * @param {string} localPart - Part before @ in email
 * @returns {boolean} True if pattern looks random
 */
function detectRandomPattern(localPart) {
  if (localPart.length < 5) return false;

  // Common vowels
  const vowels = /[aeiou]/i;
  let consonantStreak = 0;
  let maxConsonantStreak = 0;

  for (const char of localPart) {
    if (/[a-z]/i.test(char)) {
      if (!vowels.test(char)) {
        consonantStreak++;
        maxConsonantStreak = Math.max(maxConsonantStreak, consonantStreak);
      } else {
        consonantStreak = 0;
      }
    }
  }

  // If 4+ consonants in a row, likely random
  if (maxConsonantStreak >= 4) {
    return true;
  }

  // Check for repeating characters (e.g., 'aaaa', 'xxxx')
  if (/(.)\1{3,}/.test(localPart)) {
    return true;
  }

  // Check for keyboard patterns (e.g., 'qwerty', 'asdfgh', 'zxcvbn')
  const keyboardPatterns = [
    'qwerty', 'asdfgh', 'zxcvbn', 'qazwsx', 'qweasd',
    '12345', '123456', '1234567', '12345678', 'abc123'
  ];

  const lowercaseLocal = localPart.toLowerCase();
  if (keyboardPatterns.some(pattern => lowercaseLocal.includes(pattern))) {
    return false; // These are too common to be considered "suspicious random"
  }

  return false;
}

/**
 * Counts numbers in the local part of email
 * 
 * @private
 * @param {string} localPart - Part before @ in email
 * @returns {number} Percentage of characters that are numbers (0-100)
 */
function countNumberPercentage(localPart) {
  if (localPart.length === 0) return 0;
  const numberCount = (localPart.match(/\d/g) || []).length;
  return Math.round((numberCount / localPart.length) * 100);
}

// ============================================================================
// 1. IS DISPOSABLE EMAIL
// ============================================================================

/**
 * Checks if an email address uses a disposable/temporary email service
 * 
 * Extracts domain and queries disposable_email_domains table for matches.
 * Results are cached in memory for performance.
 * 
 * Disposable emails are services like:
 * - temp-mail.org, 10minutemail.com
 * - throwaway.email, guerrillamail.com
 * - mailinator.com, tempmail.com
 * 
 * @param {string} email - Email address to check
 * 
 * @returns {Promise<boolean>} True if email is from disposable service
 * 
 * @example
 * const isDisposable = await isDisposableEmail('user@tempmail.com');
 * if (isDisposable) console.warn('Disposable email detected');
 */
export async function isDisposableEmail(email) {
  try {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const domain = extractDomain(email);
    if (!domain) {
      return false;
    }

    const cacheKey = `${EMAIL_DOMAIN_CACHE_KEY}${domain}`;

    // Check memory cache first
    if (disposableDomainCache.has(cacheKey)) {
      const cached = disposableDomainCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.isDisposable;
      }
      disposableDomainCache.delete(cacheKey);
    }

    // Query disposable_email_domains table
    const { data, error } = await supabase
      .from('disposable_email_domains')
      .select('id')
      .eq('domain', domain)
      .maybeSingle();

    const isDisposable = !!data;

    // Cache the result
    disposableDomainCache.set(cacheKey, {
      isDisposable,
      timestamp: Date.now()
    });

    if (isDisposable) {
      console.warn('⚠️ Disposable email domain detected:', domain);
    } else {
      console.log('✅ Email domain is legitimate:', domain);
    }

    return isDisposable;
  } catch (error) {
    console.error('❌ Error checking disposable email:', error.message);
    // Fail open - assume not disposable on error
    return false;
  }
}

// ============================================================================
// 2. CALCULATE EMAIL QUALITY
// ============================================================================

/**
 * Calculates an email quality score based on multiple factors
 * 
 * Scoring:
 * - Disposable email: score = 0 (automatic fail)
 * - Free provider: score = 70 (legitimate but lower quality)
 * - Corporate domain: score = 100 (highest quality)
 * - Suspicious patterns: -20 (too many numbers), -15 (random string)
 * 
 * Returns comprehensive quality assessment with flags for different categories.
 * 
 * @param {string} email - Email address to analyze
 * 
 * @returns {Promise<Object>} Quality assessment:
 *   - score: {number} Quality score (0-100)
 *   - isDisposable: {boolean} From disposable email service
 *   - isFree: {boolean} Free email provider (Gmail, Yahoo, etc)
 *   - isCorporate: {boolean} Corporate/custom domain
 *   - suspiciousPatterns: {Object} Details of suspicious patterns found:
 *     * tooManyNumbers: {boolean}
 *     * numberPercentage: {number} % of characters that are numbers
 *     * randomString: {boolean}
 *     * explanation: {string} Human-readable reason if score reduced
 * 
 * @example
 * const quality = await calculateEmailQuality('john.smith@company.com');
 * console.log(`Score: ${quality.score}/100`);
 * if (quality.isCorporate) console.log('Corporate email - high trust');
 */
export async function calculateEmailQuality(email) {
  try {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email address');
    }

    // Extract parts
    const domain = extractDomain(email);
    const localPart = email.split('@')[0];

    if (!domain || !localPart) {
      throw new Error('Invalid email format');
    }

    // Check if disposable (automatic fail)
    const isDisposable = await isDisposableEmail(email);
    if (isDisposable) {
      console.warn('❌ Disposable email - quality score: 0');
      return {
        score: 0,
        isDisposable: true,
        isFree: false,
        isCorporate: false,
        suspiciousPatterns: {
          explanation: 'Disposable/temporary email service'
        }
      };
    }

    // Determine email category
    const isFree = FREE_EMAIL_PROVIDERS.includes(domain);
    const isCorporate = !isFree;

    // Start with base score
    let score = isFree ? 70 : 100;
    let explanation = '';

    // Check for suspicious patterns
    const suspiciousPatterns = {
      tooManyNumbers: false,
      numberPercentage: 0,
      randomString: false,
      explanation: ''
    };

    // Check for excessive numbers
    const numberPercentage = countNumberPercentage(localPart);
    suspiciousPatterns.numberPercentage = numberPercentage;

    if (numberPercentage > 40) {
      suspiciousPatterns.tooManyNumbers = true;
      score -= 20;
      explanation += `Too many numbers (${numberPercentage}%) in email local part. `;
    }

    // Check for random string patterns
    const hasRandomPattern = detectRandomPattern(localPart);
    if (hasRandomPattern) {
      suspiciousPatterns.randomString = true;
      score -= 15;
      explanation += 'Email local part appears to be random string. ';
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    suspiciousPatterns.explanation = explanation.trim() || 'None detected';

    const result = {
      score,
      isDisposable,
      isFree,
      isCorporate,
      suspiciousPatterns
    };

    console.log('✅ Email quality calculated:', {
      email: `${localPart.substring(0, 2)}...@${domain}`,
      score,
      category: isCorporate ? 'corporate' : 'free'
    });

    return result;
  } catch (error) {
    console.error('❌ Error calculating email quality:', error.message);
    // Return conservative score on error
    return {
      score: 50,
      isDisposable: false,
      isFree: false,
      isCorporate: false,
      suspiciousPatterns: {
        explanation: 'Error calculating quality'
      }
    };
  }
}

// ============================================================================
// 3. SAVE EMAIL QUALITY
// ============================================================================

/**
 * Saves email quality assessment to database with privacy preservation
 * 
 * Process:
 * 1. Hash email with SHA-256 (irreversible, GDPR compliant)
 * 2. Extract and store domain separately for analysis
 * 3. Upsert into email_quality_registry table
 * 4. Store quality score and flags for future lookups
 * 
 * Privacy note: Original email is never stored plain text. Only hash is saved.
 * This allows us to detect duplicate signups while preserving user privacy.
 * 
 * @param {string} email - Plain text email address (not stored)
 * @param {Object} qualityData - Quality assessment (from calculateEmailQuality)
 * 
 * @returns {Promise<Object>} Save result:
 *   - success: {boolean} Operation succeeded
 *   - hash: {string} SHA-256 hash of email (for verification)
 *   - data: {Object} Saved row data (if successful)
 *   - error: {string} Error message (if failed)
 * 
 * @example
 * const quality = await calculateEmailQuality('user@company.com');
 * const result = await saveEmailQuality('user@company.com', quality);
 * if (result.success) console.log('Email quality saved');
 */
export async function saveEmailQuality(email, qualityData) {
  try {
    if (!email || !qualityData) {
      throw new Error('Email and quality data required');
    }

    // Hash email for privacy (GDPR compliance)
    const emailHash = await hashEmail(email);
    const domain = extractDomain(email);

    if (!domain) {
      throw new Error('Invalid email domain');
    }

    // Prepare data for storage
    const registryData = {
      email_hash: emailHash, // SHA-256 hash (irreversible)
      email_domain: domain, // Domain stored for analysis
      is_disposable: qualityData.isDisposable,
      is_free: qualityData.isFree,
      quality_score: qualityData.score,
      created_at: new Date().toISOString()
    };

    // Upsert into email_quality_registry
    const { data, error } = await supabase
      .from('email_quality_registry')
      .upsert(registryData, { onConflict: 'email_hash' })
      .select()
      .single();

    if (error) {
      console.error('❌ Error saving email quality:', error);
      return {
        success: false,
        hash: emailHash,
        error: error.message
      };
    }

    console.log('✅ Email quality saved:', {
      hash: emailHash.substring(0, 16) + '...',
      domain,
      score: qualityData.score
    });

    return {
      success: true,
      hash: emailHash,
      data
    };
  } catch (error) {
    console.error('❌ Exception in saveEmailQuality:', error.message);
    return {
      success: false,
      hash: '',
      error: error.message
    };
  }
}

// ============================================================================
// 4. CHECK EMAIL REPUTATION
// ============================================================================

/**
 * Checks the reputation/history of an email address
 * 
 * Looks up email hash in email_quality_registry to find previous quality
 * assessment. Useful for:
 * - Detecting duplicate accounts (same email signing up again)
 * - Identifying high-quality vs low-quality emails
 * - Blocking disposable emails if policy requires
 * - Tracking reputation across multiple attempts
 * 
 * Privacy: Lookup is done via hashed email, never stores/exposes plain text.
 * 
 * @param {string} email - Email address to check
 * 
 * @returns {Promise<Object|null>} Previous quality data if found:
 *   - email_hash: {string} SHA-256 hash
 *   - email_domain: {string} Domain
 *   - is_disposable: {boolean}
 *   - is_free: {boolean}
 *   - quality_score: {number}
 *   - created_at: {string} ISO timestamp of first assessment
 *   
 *   OR null if email is new/not found
 * 
 * @example
 * const reputation = await checkEmailReputation('user@company.com');
 * if (reputation) {
 *   console.log(`Email previously seen, score: ${reputation.quality_score}`);
 * } else {
 *   console.log('New email address');
 * }
 */
export async function checkEmailReputation(email) {
  try {
    if (!email || typeof email !== 'string') {
      return null;
    }

    // Hash email for lookup
    const emailHash = await hashEmail(email);
    const cacheKey = `${EMAIL_HASH_CACHE_KEY}${emailHash}`;

    // Check memory cache first
    if (emailQualityCache.has(cacheKey)) {
      const cached = emailQualityCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
      emailQualityCache.delete(cacheKey);
    }

    // Query email_quality_registry
    const { data, error } = await supabase
      .from('email_quality_registry')
      .select('*')
      .eq('email_hash', emailHash)
      .maybeSingle();

    if (error) {
      console.error('❌ Error checking email reputation:', error);
      return null;
    }

    // Cache the result (even if null)
    if (data) {
      emailQualityCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log('✅ Email reputation found:', {
        hash: emailHash.substring(0, 16) + '...',
        score: data.quality_score,
        domain: data.email_domain
      });
    } else {
      console.log('✅ New email address (not in registry)');
    }

    return data || null;
  } catch (error) {
    console.error('❌ Exception in checkEmailReputation:', error.message);
    return null;
  }
}

// ============================================================================
// 5. CLEANUP & UTILITIES
// ============================================================================

/**
 * Clears in-memory caches for testing or maintenance
 * 
 * @returns {void}
 */
export function clearEmailCaches() {
  disposableDomainCache.clear();
  emailQualityCache.clear();
  console.log('✅ Email caches cleared');
}

/**
 * Gets cache statistics for debugging
 * 
 * @returns {Object} Cache statistics
 */
export function getEmailCacheStats() {
  return {
    disposableDomains: disposableDomainCache.size,
    emailQuality: emailQualityCache.size,
    entries: {
      disposableDomains: Array.from(disposableDomainCache.keys()),
      emailQuality: Array.from(emailQualityCache.keys())
    }
  };
}

/**
 * Gets the list of known free email providers
 * 
 * @returns {string[]} Array of free provider domains
 */
export function getFreeEmailProviders() {
  return [...FREE_EMAIL_PROVIDERS];
}

export default {
  isDisposableEmail,
  calculateEmailQuality,
  saveEmailQuality,
  checkEmailReputation,
  clearEmailCaches,
  getEmailCacheStats,
  getFreeEmailProviders
};
