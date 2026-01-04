import { supabase } from '../supabaseClient';
import { getDeviceFingerprint } from './deviceFingerprinting';
import { getIPInfo } from './ipIntelligence';
import { analyzeEmailQuality } from './emailVerification';
import { 
  calculateBotProbability, 
  calculateTrustScore as calculateBehaviorTrustScore,
  updateUserTrustScore as updateBehaviorTrust,
  getUserBehaviorSummary 
} from './behaviorAnalysis';
import { 
  calculateSocialTrustScore, 
  updateSocialGraphMetrics,
  getSocialGraphReport 
} from './socialGraphAnalysis';

/**
 * Trust Shield Manager
 * Main orchestration layer for comprehensive 7-layer verification system
 * 
 * Coordinates:
 * 1. Device Fingerprinting - Unique device identification
 * 2. IP Intelligence - Location, VPN, proxy detection
 * 3. Email Verification - Quality and reputation analysis
 * 4. Behavioral Analysis - Action pattern detection
 * 5. Social Graph Analysis - Connection pattern analysis
 * 6. CAPTCHA Verification - Human verification
 * 7. Manual Review - Human moderation when needed
 * 
 * This is the single point of entry for all verification operations.
 * All other modules feed data into this orchestrator.
 */

/**
 * Verification level thresholds and meanings
 * 
 * Levels explained:
 * - new: Brand new account, limited permissions
 * - unverified: Low trust score, restricted
 * - basic: Passed basic checks, normal access
 * - verified: Email verified, good behavior
 * - trusted: High trust score, established user
 * - highly_trusted: Maximum trust, all privileges
 */
const VERIFICATION_LEVELS = {
  NEW: 'new',
  UNVERIFIED: 'unverified',
  BASIC: 'basic',
  VERIFIED: 'verified',
  TRUSTED: 'trusted',
  HIGHLY_TRUSTED: 'highly_trusted'
};

/**
 * Trust score thresholds for each level
 */
const TRUST_THRESHOLDS = {
  HIGHLY_TRUSTED: 90,
  TRUSTED: 70,
  VERIFIED: 50,
  BASIC: 30,
  UNVERIFIED: 0
};

/**
 * Action rate limits based on verification level
 * Prevents spam while allowing legitimate usage
 */
const RATE_LIMITS = {
  [VERIFICATION_LEVELS.NEW]: {
    posts_per_hour: 2,
    comments_per_hour: 5,
    likes_per_hour: 20,
    follows_per_hour: 10,
    messages_per_hour: 5
  },
  [VERIFICATION_LEVELS.UNVERIFIED]: {
    posts_per_hour: 1,
    comments_per_hour: 3,
    likes_per_hour: 10,
    follows_per_hour: 5,
    messages_per_hour: 2
  },
  [VERIFICATION_LEVELS.BASIC]: {
    posts_per_hour: 5,
    comments_per_hour: 20,
    likes_per_hour: 100,
    follows_per_hour: 30,
    messages_per_hour: 20
  },
  [VERIFICATION_LEVELS.VERIFIED]: {
    posts_per_hour: 10,
    comments_per_hour: 50,
    likes_per_hour: 200,
    follows_per_hour: 50,
    messages_per_hour: 50
  },
  [VERIFICATION_LEVELS.TRUSTED]: {
    posts_per_hour: 20,
    comments_per_hour: 100,
    likes_per_hour: 500,
    follows_per_hour: 100,
    messages_per_hour: 100
  },
  [VERIFICATION_LEVELS.HIGHLY_TRUSTED]: {
    posts_per_hour: 50,
    comments_per_hour: 200,
    likes_per_hour: 1000,
    follows_per_hour: 200,
    messages_per_hour: 200
  }
};

/**
 * Initialize Trust Shield for new user
 * Called during signup to establish baseline verification
 * 
 * Process:
 * 1. Capture device fingerprint
 * 2. Analyze IP address
 * 3. Check email quality
 * 4. Create verification record
 * 5. Set initial trust level
 * 
 * @param {string} userId - New user ID
 * @param {Object} signupData - Additional signup data (email, ip, userAgent)
 * @returns {Object} Initialization result with fingerprint and IP info
 */
export async function initializeTrustShield(userId, signupData = {}) {
  try {
    console.log(`Initializing Trust Shield for user: ${userId}`);

    const { email, ip_address, user_agent } = signupData;

    // LAYER 1: Device Fingerprinting
    // Generate unique device identifier
    const fingerprint = getDeviceFingerprint(user_agent);

    // LAYER 2: IP Intelligence
    // Analyze IP reputation and location
    let ipInfo = null;
    if (ip_address) {
      ipInfo = await getIPInfo(ip_address);
    }

    // LAYER 3: Email Verification
    // Check email quality and disposability
    let emailQuality = { score: 50, isDisposable: false, isRoleAccount: false };
    if (email) {
      emailQuality = await analyzeEmailQuality(email);
    }

    // Calculate initial trust score
    // Start optimistic but adjust based on red flags
    let initialTrustScore = 100;

    // Penalties for suspicious indicators at signup
    if (emailQuality.isDisposable) {
      initialTrustScore -= 30; // Disposable email = high risk
    }
    if (emailQuality.isRoleAccount) {
      initialTrustScore -= 10; // Role accounts less trustworthy
    }
    if (ipInfo?.isVPN) {
      initialTrustScore -= 20; // VPN usage at signup suspicious
    }
    if (ipInfo?.isTor) {
      initialTrustScore -= 40; // Tor = very high risk
    }
    if (ipInfo?.isProxy) {
      initialTrustScore -= 25; // Proxy suspicious
    }
    if (ipInfo?.isDataCenter) {
      initialTrustScore -= 30; // Data center IPs = bots
    }

    // Determine initial verification level
    let initialLevel = VERIFICATION_LEVELS.NEW;
    if (initialTrustScore < 30) {
      initialLevel = VERIFICATION_LEVELS.UNVERIFIED; // Start restricted
    }

    // Create verification record in database
    const verificationData = {
      user_id: userId,
      device_fingerprint: fingerprint,
      ip_address: ip_address,
      ip_country: ipInfo?.country,
      ip_risk_score: ipInfo?.riskScore || 0,
      is_vpn: ipInfo?.isVPN || false,
      is_tor: ipInfo?.isTor || false,
      is_proxy: ipInfo?.isProxy || false,
      email_quality_score: emailQuality.score,
      is_disposable_email: emailQuality.isDisposable,
      trust_score: initialTrustScore,
      verification_level: initialLevel,
      verification_method: 'automatic_signup',
      account_restrictions: {},
      last_verification_date: new Date().toISOString()
    };

    const { data: verification, error: verificationError } = await supabase
      .from('user_identity_verification')
      .insert(verificationData)
      .select()
      .single();

    if (verificationError) throw verificationError;

    // Log initialization event
    await supabase
      .from('verification_events')
      .insert({
        user_id: userId,
        event_type: 'initialization',
        old_trust_score: null,
        new_trust_score: initialTrustScore,
        old_verification_level: null,
        new_verification_level: initialLevel,
        trigger: 'user_signup',
        details: {
          fingerprint,
          ipInfo,
          emailQuality
        }
      });

    // Log device fingerprint for tracking
    await supabase
      .from('device_fingerprints')
      .insert({
        user_id: userId,
        fingerprint,
        user_agent,
        ip_address,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        is_primary: true
      });

    console.log(`Trust Shield initialized for ${userId}: Level ${initialLevel}, Score ${initialTrustScore}`);

    return {
      success: true,
      userId,
      fingerprint,
      ipInfo,
      emailQuality,
      initialTrustScore,
      initialLevel,
      verification
    };

  } catch (error) {
    console.error('Error initializing Trust Shield:', error);
    
    // Log failure but don't block signup
    try {
      await supabase
        .from('verification_events')
        .insert({
          user_id: userId,
          event_type: 'initialization_failed',
          trigger: 'user_signup',
          details: { error: error.message }
        });
    } catch (logError) {
      console.error('Failed to log initialization error:', logError);
    }

    throw error;
  }
}

/**
 * Perform full verification across all layers
 * Comprehensive analysis of user trustworthiness
 * 
 * Runs all verification layers in parallel for speed:
 * - Device fingerprint validation
 * - IP intelligence check
 * - Email quality recheck
 * - Behavioral pattern analysis
 * - Social graph analysis
 * - Bot probability calculation
 * 
 * @param {string} userId - User ID to verify
 * @returns {Object} Complete verification status
 */
export async function performFullVerification(userId) {
  try {
    console.log(`Performing full verification for user: ${userId}`);

    // Get current verification status
    const { data: currentVerification, error: currentError } = await supabase
      .from('user_identity_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (currentError) throw currentError;

    // Run all verification layers in parallel for performance
    const [
      deviceCheck,
      ipCheck,
      emailCheck,
      behaviorSummary,
      socialReport,
      botProbability
    ] = await Promise.allSettled([
      // LAYER 1: Device Fingerprint Check
      (async () => {
        const { data: devices } = await supabase
          .from('device_fingerprints')
          .select('*')
          .eq('user_id', userId);
        return { deviceCount: devices?.length || 0, devices };
      })(),

      // LAYER 2: IP Intelligence Recheck
      currentVerification.ip_address 
        ? getIPInfo(currentVerification.ip_address)
        : Promise.resolve(null),

      // LAYER 3: Email Quality (from stored data)
      Promise.resolve({
        score: currentVerification.email_quality_score,
        isDisposable: currentVerification.is_disposable_email
      }),

      // LAYER 4: Behavioral Analysis
      getUserBehaviorSummary(userId).catch(() => ({
        trustScore: 50,
        botProbability: 0,
        confidence: 0
      })),

      // LAYER 5: Social Graph Analysis
      getSocialGraphReport(userId).catch(() => ({
        socialTrustScore: 50,
        suspiciousData: { isSuspicious: false }
      })),

      // LAYER 6: Bot Probability
      calculateBotProbability(userId).catch(() => ({
        botProbability: 0,
        confidence: 0
      }))
    ]);

    // Extract results (handle rejected promises)
    const deviceData = deviceCheck.status === 'fulfilled' ? deviceCheck.value : { deviceCount: 0 };
    const ipData = ipCheck.status === 'fulfilled' ? ipCheck.value : null;
    const emailData = emailCheck.status === 'fulfilled' ? emailCheck.value : { score: 50 };
    const behaviorData = behaviorSummary.status === 'fulfilled' ? behaviorSummary.value : { trustScore: 50 };
    const socialData = socialReport.status === 'fulfilled' ? socialReport.value : { socialTrustScore: 50 };
    const botData = botProbability.status === 'fulfilled' ? botProbability.value : { botProbability: 0 };

    // Calculate combined trust score
    // Weighted average of all verification layers
    const weights = {
      behavior: 0.30,  // Behavior is most important (30%)
      social: 0.25,    // Social connections (25%)
      email: 0.15,     // Email quality (15%)
      ip: 0.15,        // IP reputation (15%)
      device: 0.10,    // Device consistency (10%)
      captcha: 0.05    // CAPTCHA (5%)
    };

    // Calculate weighted scores
    let combinedScore = 0;
    
    // Behavior score
    combinedScore += (behaviorData.trustScore || 50) * weights.behavior;
    
    // Social score
    combinedScore += (socialData.socialTrustScore || 50) * weights.social;
    
    // Email score
    combinedScore += (emailData.score || 50) * weights.email;
    
    // IP score (inverse of risk)
    const ipScore = ipData ? Math.max(0, 100 - (ipData.riskScore * 10)) : 50;
    combinedScore += ipScore * weights.ip;
    
    // Device score (consistency bonus)
    const deviceScore = deviceData.deviceCount === 1 ? 100 : Math.max(0, 100 - (deviceData.deviceCount * 10));
    combinedScore += deviceScore * weights.device;
    
    // CAPTCHA score
    const captchaScore = currentVerification.captcha_passed ? 100 : 0;
    combinedScore += captchaScore * weights.captcha;

    // Apply bot probability penalty
    // High bot probability significantly reduces trust
    if (botData.botProbability > 0.7) {
      combinedScore *= 0.5; // Halve score if likely bot
    } else if (botData.botProbability > 0.5) {
      combinedScore *= 0.7; // Reduce by 30%
    } else if (botData.botProbability > 0.3) {
      combinedScore *= 0.85; // Reduce by 15%
    }

    // Clamp final score
    const finalTrustScore = Math.max(0, Math.min(100, Math.round(combinedScore)));

    // Determine verification level based on score
    let verificationLevel = VERIFICATION_LEVELS.UNVERIFIED;
    if (finalTrustScore >= TRUST_THRESHOLDS.HIGHLY_TRUSTED) {
      verificationLevel = VERIFICATION_LEVELS.HIGHLY_TRUSTED;
    } else if (finalTrustScore >= TRUST_THRESHOLDS.TRUSTED) {
      verificationLevel = VERIFICATION_LEVELS.TRUSTED;
    } else if (finalTrustScore >= TRUST_THRESHOLDS.VERIFIED) {
      verificationLevel = VERIFICATION_LEVELS.VERIFIED;
    } else if (finalTrustScore >= TRUST_THRESHOLDS.BASIC) {
      verificationLevel = VERIFICATION_LEVELS.BASIC;
    }

    // Apply email verification bonus
    if (currentVerification.email_verified) {
      if (verificationLevel === VERIFICATION_LEVELS.BASIC) {
        verificationLevel = VERIFICATION_LEVELS.VERIFIED;
      }
    }

    // Determine restrictions based on issues found
    const restrictions = {};
    
    if (botData.botProbability > 0.7) {
      restrictions.posting_disabled = true;
      restrictions.reason = 'High bot probability detected';
    }
    
    if (socialData.suspiciousData?.isSuspicious) {
      restrictions.follow_limit = 10;
      restrictions.reason = 'Suspicious social patterns';
    }
    
    if (ipData?.isVPN && finalTrustScore < 50) {
      restrictions.requires_captcha = true;
      restrictions.reason = 'VPN usage with low trust';
    }

    // Update database with new scores
    const updateData = {
      trust_score: finalTrustScore,
      verification_level: verificationLevel,
      bot_probability: botData.botProbability,
      account_restrictions: restrictions,
      last_verification_date: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('user_identity_verification')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log verification event
    await supabase
      .from('verification_events')
      .insert({
        user_id: userId,
        event_type: 'full_verification',
        old_trust_score: currentVerification.trust_score,
        new_trust_score: finalTrustScore,
        old_verification_level: currentVerification.verification_level,
        new_verification_level: verificationLevel,
        trigger: 'manual_verification',
        details: {
          behaviorScore: behaviorData.trustScore,
          socialScore: socialData.socialTrustScore,
          botProbability: botData.botProbability,
          restrictions
        }
      });

    console.log(`Full verification complete for ${userId}: Level ${verificationLevel}, Score ${finalTrustScore}`);

    return {
      success: true,
      userId,
      trustScore: finalTrustScore,
      verificationLevel,
      restrictions,
      details: {
        behavior: behaviorData,
        social: socialData,
        bot: botData,
        device: deviceData,
        ip: ipData,
        email: emailData
      },
      scoreBreakdown: {
        behavior: Math.round((behaviorData.trustScore || 50) * weights.behavior),
        social: Math.round((socialData.socialTrustScore || 50) * weights.social),
        email: Math.round((emailData.score || 50) * weights.email),
        ip: Math.round(ipScore * weights.ip),
        device: Math.round(deviceScore * weights.device),
        captcha: Math.round(captchaScore * weights.captcha)
      }
    };

  } catch (error) {
    console.error('Error performing full verification:', error);
    throw error;
  }
}

/**
 * Check if user has permission to perform action
 * Enforces rate limits and restrictions
 * 
 * Action types:
 * - post: Create new post
 * - comment: Comment on post
 * - like: Like content
 * - follow: Follow user
 * - message: Send direct message
 * 
 * @param {string} userId - User attempting action
 * @param {string} actionType - Type of action
 * @returns {Object} { allowed, reason, limit, remaining, waitTime }
 */
export async function checkActionPermission(userId, actionType) {
  try {
    // Get user verification status
    const { data: verification, error } = await supabase
      .from('user_identity_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no verification record, deny by default
      return {
        allowed: false,
        reason: 'User not verified',
        limit: 0,
        remaining: 0
      };
    }

    // Check account-wide restrictions
    const restrictions = verification.account_restrictions || {};
    
    if (restrictions.account_suspended) {
      return {
        allowed: false,
        reason: 'Account suspended',
        limit: 0,
        remaining: 0
      };
    }

    if (restrictions.posting_disabled && (actionType === 'post' || actionType === 'comment')) {
      return {
        allowed: false,
        reason: restrictions.reason || 'Posting disabled',
        limit: 0,
        remaining: 0
      };
    }

    // Get rate limits for verification level
    const limits = RATE_LIMITS[verification.verification_level] || RATE_LIMITS[VERIFICATION_LEVELS.UNVERIFIED];
    const limitKey = `${actionType}s_per_hour`;
    const hourlyLimit = limits[limitKey] || 0;

    if (hourlyLimit === 0) {
      return {
        allowed: false,
        reason: 'Action not permitted for this verification level',
        limit: 0,
        remaining: 0
      };
    }

    // Count recent actions in past hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: recentActions, error: actionsError } = await supabase
      .from('user_behavior_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('action_type', actionType)
      .gte('created_at', oneHourAgo);

    if (actionsError) throw actionsError;

    const actionCount = recentActions?.length || 0;
    const remaining = Math.max(0, hourlyLimit - actionCount);

    if (actionCount >= hourlyLimit) {
      // Calculate wait time until oldest action expires
      const { data: oldestAction } = await supabase
        .from('user_behavior_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('action_type', actionType)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      let waitTime = 0;
      if (oldestAction) {
        const oldestTime = new Date(oldestAction.created_at).getTime();
        const expiryTime = oldestTime + (60 * 60 * 1000); // 1 hour from oldest
        waitTime = Math.max(0, Math.ceil((expiryTime - Date.now()) / 1000)); // seconds
      }

      return {
        allowed: false,
        reason: `Rate limit exceeded. You can perform ${hourlyLimit} ${actionType}s per hour.`,
        limit: hourlyLimit,
        remaining: 0,
        waitTime,
        retryAfter: new Date(Date.now() + (waitTime * 1000)).toISOString()
      };
    }

    // Check specific restrictions
    if (restrictions.follow_limit && actionType === 'follow') {
      const { data: recentFollows } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', userId)
        .gte('created_at', oneHourAgo);

      if (recentFollows && recentFollows.length >= restrictions.follow_limit) {
        return {
          allowed: false,
          reason: `Follow limit: ${restrictions.follow_limit} per hour (${restrictions.reason})`,
          limit: restrictions.follow_limit,
          remaining: 0
        };
      }
    }

    // Check if CAPTCHA required
    if (restrictions.requires_captcha && !verification.captcha_passed) {
      return {
        allowed: false,
        reason: 'CAPTCHA verification required',
        requiresCaptcha: true,
        limit: hourlyLimit,
        remaining
      };
    }

    // Action allowed
    return {
      allowed: true,
      reason: 'Action permitted',
      limit: hourlyLimit,
      remaining: remaining - 1, // Account for this action
      verificationLevel: verification.verification_level
    };

  } catch (error) {
    console.error('Error checking action permission:', error);
    // Fail closed - deny on error
    return {
      allowed: false,
      reason: 'Error checking permissions',
      error: error.message
    };
  }
}

/**
 * Update user trust score with reason logging
 * Recalculates trust from all sources and applies changes
 * 
 * Triggers:
 * - suspicious_activity: User behavior flagged
 * - email_verified: Email confirmation completed
 * - captcha_passed: CAPTCHA solved
 * - reported_content: User reported by others
 * - manual_review: Moderator decision
 * - time_based: Periodic recalculation
 * 
 * @param {string} userId - User to update
 * @param {string} reason - Why trust is being updated
 * @param {Object} metadata - Additional context
 * @returns {Object} Updated trust info
 */
export async function updateTrustScore(userId, reason, metadata = {}) {
  try {
    console.log(`Updating trust score for ${userId}: ${reason}`);

    // Get current verification state
    const { data: currentVerification } = await supabase
      .from('user_identity_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!currentVerification) {
      throw new Error('User verification record not found');
    }

    const oldTrustScore = currentVerification.trust_score;
    const oldLevel = currentVerification.verification_level;

    // Recalculate trust score from all sources
    const [behaviorTrust, socialTrust] = await Promise.allSettled([
      calculateBehaviorTrustScore(userId),
      calculateSocialTrustScore(userId)
    ]);

    const behaviorScore = behaviorTrust.status === 'fulfilled' ? behaviorTrust.value : 50;
    const socialScore = socialTrust.status === 'fulfilled' ? socialTrust.value : 50;

    // Calculate new combined score
    let newTrustScore = Math.round((behaviorScore * 0.6) + (socialScore * 0.4));

    // Apply reason-specific adjustments
    switch (reason) {
      case 'email_verified':
        newTrustScore = Math.min(100, newTrustScore + 10);
        break;
      case 'captcha_passed':
        newTrustScore = Math.min(100, newTrustScore + 5);
        break;
      case 'suspicious_activity':
        newTrustScore = Math.max(0, newTrustScore - 20);
        break;
      case 'reported_content':
        newTrustScore = Math.max(0, newTrustScore - 15);
        break;
      case 'manual_review_positive':
        newTrustScore = Math.min(100, newTrustScore + 15);
        break;
      case 'manual_review_negative':
        newTrustScore = Math.max(0, newTrustScore - 30);
        break;
    }

    // Determine new verification level
    let newLevel = VERIFICATION_LEVELS.UNVERIFIED;
    if (newTrustScore >= TRUST_THRESHOLDS.HIGHLY_TRUSTED) {
      newLevel = VERIFICATION_LEVELS.HIGHLY_TRUSTED;
    } else if (newTrustScore >= TRUST_THRESHOLDS.TRUSTED) {
      newLevel = VERIFICATION_LEVELS.TRUSTED;
    } else if (newTrustScore >= TRUST_THRESHOLDS.VERIFIED) {
      newLevel = VERIFICATION_LEVELS.VERIFIED;
    } else if (newTrustScore >= TRUST_THRESHOLDS.BASIC) {
      newLevel = VERIFICATION_LEVELS.BASIC;
    }

    // Apply restrictions if score drops significantly
    let restrictions = currentVerification.account_restrictions || {};
    
    if (newTrustScore < 30 && oldTrustScore >= 30) {
      // Trust dropped below threshold - restrict account
      restrictions = {
        ...restrictions,
        posting_limited: true,
        requires_captcha: true,
        reason: `Trust score dropped to ${newTrustScore}`
      };
    } else if (newTrustScore >= 50 && oldTrustScore < 50) {
      // Trust recovered - remove some restrictions
      delete restrictions.posting_limited;
      delete restrictions.requires_captcha;
    }

    // Update database
    const { error: updateError } = await supabase
      .from('user_identity_verification')
      .update({
        trust_score: newTrustScore,
        verification_level: newLevel,
        account_restrictions: restrictions,
        last_verification_date: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Log change event
    await supabase
      .from('verification_events')
      .insert({
        user_id: userId,
        event_type: 'trust_score_update',
        old_trust_score: oldTrustScore,
        new_trust_score: newTrustScore,
        old_verification_level: oldLevel,
        new_verification_level: newLevel,
        trigger: reason,
        details: {
          ...metadata,
          behaviorScore,
          socialScore,
          restrictions
        }
      });

    const scoreDelta = newTrustScore - oldTrustScore;
    const levelChanged = newLevel !== oldLevel;

    console.log(`Trust score updated for ${userId}: ${oldTrustScore} → ${newTrustScore} (${scoreDelta > 0 ? '+' : ''}${scoreDelta})`);

    return {
      success: true,
      userId,
      oldTrustScore,
      newTrustScore,
      scoreDelta,
      oldLevel,
      newLevel,
      levelChanged,
      restrictions
    };

  } catch (error) {
    console.error('Error updating trust score:', error);
    throw error;
  }
}

/**
 * Flag user for manual review
 * Escalates to human moderators when automated systems uncertain
 * 
 * Reasons for flagging:
 * - high_bot_probability: Behavioral analysis indicates bot
 * - suspicious_social_graph: Bot network detected
 * - multiple_reports: Other users flagged content
 * - ip_risk: High-risk IP detected
 * - fraud_detected: Payment/transaction fraud
 * 
 * @param {string} userId - User to flag
 * @param {string} reason - Why flagging
 * @param {Object} details - Supporting evidence
 * @param {boolean} restrictImmediately - Apply restrictions pending review
 * @returns {Object} Flag result with review ID
 */
export async function flagUserForReview(userId, reason, details = {}, restrictImmediately = false) {
  try {
    console.log(`Flagging user ${userId} for manual review: ${reason}`);

    // Get current verification
    const { data: verification } = await supabase
      .from('user_identity_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!verification) {
      throw new Error('User verification record not found');
    }

    // Prepare review notes
    const reviewNotes = {
      flagged_at: new Date().toISOString(),
      reason,
      details,
      current_trust_score: verification.trust_score,
      current_level: verification.verification_level,
      bot_probability: verification.bot_probability
    };

    // Update verification with manual review flag
    const updateData = {
      manual_review_required: true,
      manual_review_notes: reviewNotes
    };

    // Optionally apply immediate restrictions
    if (restrictImmediately) {
      const restrictions = verification.account_restrictions || {};
      updateData.account_restrictions = {
        ...restrictions,
        pending_review: true,
        posting_disabled: true,
        reason: `Flagged for review: ${reason}`
      };
    }

    const { error: updateError } = await supabase
      .from('user_identity_verification')
      .update(updateData)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // Create flagged content entry for moderation queue
    const { data: flag, error: flagError } = await supabase
      .from('flagged_content')
      .insert({
        content_id: userId,
        content_type: 'user',
        reason,
        reported_by: 'system',
        status: 'pending',
        severity: restrictImmediately ? 'high' : 'medium',
        additional_data: details
      })
      .select()
      .single();

    if (flagError) throw flagError;

    // Log event
    await supabase
      .from('verification_events')
      .insert({
        user_id: userId,
        event_type: 'flagged_for_review',
        trigger: reason,
        details: {
          ...details,
          restricted: restrictImmediately,
          flag_id: flag.id
        }
      });

    console.log(`User ${userId} flagged for review with ID: ${flag.id}`);

    return {
      success: true,
      flagged: true,
      userId,
      reviewId: flag.id,
      reason,
      restricted: restrictImmediately,
      details
    };

  } catch (error) {
    console.error('Error flagging user for review:', error);
    throw error;
  }
}

/**
 * Get comprehensive Trust Shield status
 * User-friendly view of verification state
 * 
 * Returns complete status including:
 * - Current trust score and level
 * - Active restrictions
 * - Verification badges
 * - Next steps to improve trust
 * 
 * @param {string} userId - User to check
 * @returns {Object} Complete Trust Shield status
 */
export async function getTrustShieldStatus(userId) {
  try {
    // Get verification data
    const { data: verification, error } = await supabase
      .from('user_identity_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !verification) {
      return {
        userId,
        trustScore: 0,
        verificationLevel: VERIFICATION_LEVELS.UNVERIFIED,
        restrictions: {},
        badges: [],
        nextStep: 'Complete account setup'
      };
    }

    // Determine badges earned
    const badges = [];
    
    if (verification.email_verified) {
      badges.push({ id: 'email_verified', name: 'Email Verified', icon: '✉️' });
    }
    if (verification.phone_verified) {
      badges.push({ id: 'phone_verified', name: 'Phone Verified', icon: '📱' });
    }
    if (verification.captcha_passed) {
      badges.push({ id: 'human_verified', name: 'Human Verified', icon: '✓' });
    }
    if (verification.verification_level === VERIFICATION_LEVELS.TRUSTED || 
        verification.verification_level === VERIFICATION_LEVELS.HIGHLY_TRUSTED) {
      badges.push({ id: 'trusted_user', name: 'Trusted User', icon: '⭐' });
    }
    if (verification.bot_probability < 0.1) {
      badges.push({ id: 'verified_human', name: 'Verified Human', icon: '👤' });
    }

    // Determine next verification step
    let nextStep = null;
    
    if (!verification.email_verified) {
      nextStep = 'Verify your email address';
    } else if (!verification.captcha_passed && verification.trust_score < 50) {
      nextStep = 'Complete CAPTCHA verification';
    } else if (verification.trust_score < 50) {
      nextStep = 'Build trust by engaging authentically';
    } else if (!verification.phone_verified) {
      nextStep = 'Verify your phone number (optional)';
    } else if (verification.verification_level !== VERIFICATION_LEVELS.HIGHLY_TRUSTED) {
      nextStep = 'Continue building your reputation';
    } else {
      nextStep = 'You have maximum trust!';
    }

    // Get rate limits for current level
    const rateLimits = RATE_LIMITS[verification.verification_level];

    return {
      userId,
      trustScore: verification.trust_score,
      verificationLevel: verification.verification_level,
      restrictions: verification.account_restrictions || {},
      badges,
      nextStep,
      rateLimits,
      details: {
        emailVerified: verification.email_verified,
        phoneVerified: verification.phone_verified,
        captchaPassed: verification.captcha_passed,
        botProbability: verification.bot_probability,
        manualReviewRequired: verification.manual_review_required,
        lastVerification: verification.last_verification_date
      }
    };

  } catch (error) {
    console.error('Error getting Trust Shield status:', error);
    throw error;
  }
}

/**
 * Verify CAPTCHA and update trust
 * LAYER 6: Human verification through CAPTCHA
 * 
 * Supports:
 * - hCaptcha
 * - FriendlyCaptcha
 * - reCAPTCHA
 * 
 * @param {string} userId - User completing CAPTCHA
 * @param {string} captchaToken - Token from CAPTCHA provider
 * @param {string} captchaType - Provider type
 * @returns {Object} Verification result
 */
export async function verifyWithCaptcha(userId, captchaToken, captchaType = 'hcaptcha') {
  try {
    console.log(`Verifying CAPTCHA for user ${userId}: ${captchaType}`);

    // Verify token with provider
    let isValid = false;
    let providerResponse = null;

    // Note: In production, verify with actual CAPTCHA provider API
    // For now, we'll validate the token exists and has correct format
    if (captchaToken && captchaToken.length > 20) {
      isValid = true; // Placeholder - implement actual verification
      providerResponse = { success: true, challenge_ts: new Date().toISOString() };
    }

    if (!isValid) {
      return {
        verified: false,
        reason: 'Invalid CAPTCHA token',
        newTrustScore: null
      };
    }

    // Log CAPTCHA completion
    await supabase
      .from('captcha_logs')
      .insert({
        user_id: userId,
        captcha_type: captchaType,
        token: captchaToken.substring(0, 20) + '...', // Store truncated for privacy
        verified: true,
        provider_response: providerResponse
      });

    // Update verification record
    const { data: verification } = await supabase
      .from('user_identity_verification')
      .select('trust_score')
      .eq('user_id', userId)
      .single();

    const oldTrustScore = verification?.trust_score || 50;
    const newTrustScore = Math.min(100, oldTrustScore + 10);

    await supabase
      .from('user_identity_verification')
      .update({
        captcha_passed: true,
        trust_score: newTrustScore,
        last_verification_date: new Date().toISOString()
      })
      .eq('user_id', userId);

    // Log event
    await supabase
      .from('verification_events')
      .insert({
        user_id: userId,
        event_type: 'captcha_verified',
        old_trust_score: oldTrustScore,
        new_trust_score: newTrustScore,
        trigger: 'captcha_completion',
        details: { captchaType }
      });

    console.log(`CAPTCHA verified for ${userId}: Trust ${oldTrustScore} → ${newTrustScore}`);

    return {
      verified: true,
      newTrustScore,
      scoreDelta: 10,
      captchaType
    };

  } catch (error) {
    console.error('Error verifying CAPTCHA:', error);
    throw error;
  }
}

// Export all functions
export default {
  initializeTrustShield,
  performFullVerification,
  checkActionPermission,
  updateTrustScore,
  flagUserForReview,
  getTrustShieldStatus,
  verifyWithCaptcha
};

// Export verification levels and thresholds for use in other modules
export { VERIFICATION_LEVELS, TRUST_THRESHOLDS, RATE_LIMITS };
