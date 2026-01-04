import { supabase } from '../supabaseClient';

/**
 * Behavioral Analysis Engine
 * AI-powered bot detection through real-time behavior pattern analysis
 * 
 * This module implements sophisticated bot detection algorithms by analyzing:
 * - Timing patterns: Detecting inhuman speed and uniformity
 * - Content patterns: Identifying spam and suspicious content
 * - Interaction patterns: Analyzing social behavior
 * - Statistical anomalies: Finding deviations from normal user behavior
 */

// Spam keyword detection database
const SPAM_KEYWORDS = [
  'click here',
  'buy now',
  'free money',
  'limited offer',
  'act now',
  'earn money',
  'work from home',
  'miracle',
  'guarantee',
  'risk free',
  'no obligation',
  'special promotion',
  'winner',
  'congratulations',
  'claim now',
  'limited time',
  'call now',
  'order now',
  'discount',
  'prize'
];

// URL regex pattern for link detection
const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(\b[a-z0-9]+\.(com|net|org|io|co|app)\b)/gi;

/**
 * Log user action for behavioral analysis
 * Records actions with metadata for pattern detection
 * 
 * @param {string} userId - User ID performing the action
 * @param {string} actionType - Type: 'post', 'comment', 'like', 'follow', 'message'
 * @param {Object} metadata - Action-specific data (content, targetId, etc.)
 * @returns {Object} Logged action with analysis flags
 */
export async function logAction(userId, actionType, metadata = {}) {
  try {
    // Get user signup time
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Calculate time since signup (in seconds)
    const signupDate = new Date(userData.created_at);
    const now = new Date();
    const timeSinceSignup = Math.floor((now - signupDate) / 1000);

    // Get last action time
    const { data: lastAction } = await supabase
      .from('user_behavior_logs')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Calculate time since last action (in seconds)
    let timeSinceLastAction = null;
    if (lastAction) {
      const lastActionDate = new Date(lastAction.created_at);
      timeSinceLastAction = Math.floor((now - lastActionDate) / 1000);
    }

    // Analyze content for spam indicators
    const content = metadata.content || metadata.text || '';
    const spamAnalysis = detectSpamContent(content);
    
    // Extract and count links
    const links = content.match(URL_REGEX) || [];
    const linkCount = links.length;
    const hasLinks = linkCount > 0;

    // Check for spam keywords
    const lowerContent = content.toLowerCase();
    const hasSpamKeywords = SPAM_KEYWORDS.some(keyword => 
      lowerContent.includes(keyword)
    );

    // Determine if action is suspicious
    // Suspicious if: too fast after signup, has spam content, or rapid actions
    const isSuspicious = (
      timeSinceSignup < 300 || // Less than 5 minutes old
      hasSpamKeywords ||
      (timeSinceLastAction !== null && timeSinceLastAction < 2) || // Actions < 2 sec apart
      linkCount > 3 // Too many links
    );

    // Prepare log entry
    const logEntry = {
      user_id: userId,
      action_type: actionType,
      metadata: {
        ...metadata,
        content_length: content.length,
        link_count: linkCount,
        has_spam_keywords: hasSpamKeywords,
        spam_confidence: spamAnalysis.confidence
      },
      time_since_signup: timeSinceSignup,
      time_since_last_action: timeSinceLastAction,
      has_links: hasLinks,
      link_count: linkCount,
      has_spam_keywords: hasSpamKeywords,
      is_suspicious: isSuspicious
    };

    // Insert into database
    const { data: loggedAction, error: logError } = await supabase
      .from('user_behavior_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) throw logError;

    // If action is highly suspicious, update trust score immediately
    if (isSuspicious || spamAnalysis.isSpam) {
      await updateUserTrustScore(userId);
    }

    return loggedAction;

  } catch (error) {
    console.error('Error logging action:', error);
    throw error;
  }
}

/**
 * Calculate bot probability score
 * Analyzes behavioral patterns to detect automated/bot behavior
 * 
 * Bot indicators:
 * - Inhuman speed: Actions too fast for human interaction
 * - Uniform timing: Robotic intervals between actions
 * - No idle time: Continuous activity without breaks
 * - High link ratio: Excessive self-promotion
 * - Spam content: Marketing/scam keywords
 * - Mass actions: Bulk following/liking
 * 
 * @param {string} userId - User ID to analyze
 * @returns {Object} { botProbability, indicators, confidence }
 */
export async function calculateBotProbability(userId) {
  try {
    // Get last 100 actions for analysis
    const { data: actions, error } = await supabase
      .from('user_behavior_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!actions || actions.length === 0) {
      return {
        botProbability: 0,
        indicators: {},
        confidence: 0
      };
    }

    const indicators = {};
    let probabilityScore = 0;

    // INDICATOR 1: Too Fast - Actions per minute analysis
    // Bots perform actions at superhuman speeds
    const recentActions = actions.filter(a => {
      const actionTime = new Date(a.created_at);
      const oneMinuteAgo = new Date(Date.now() - 60000);
      return actionTime > oneMinuteAgo;
    });

    if (recentActions.length > 10) {
      indicators.tooFast = true;
      probabilityScore += 0.3;
    }

    // INDICATOR 2: Uniform Timing - Actions at exact intervals
    // Bots often use fixed delays between actions
    const timings = [];
    for (let i = 1; i < Math.min(actions.length, 20); i++) {
      const current = new Date(actions[i].created_at);
      const previous = new Date(actions[i - 1].created_at);
      const diff = Math.abs(current - previous) / 1000; // seconds
      timings.push(diff);
    }

    if (timings.length > 5) {
      // Calculate standard deviation of timing intervals
      const mean = timings.reduce((a, b) => a + b, 0) / timings.length;
      const variance = timings.reduce((sum, timing) => 
        sum + Math.pow(timing - mean, 2), 0
      ) / timings.length;
      const stdDev = Math.sqrt(variance);

      // Low standard deviation = uniform timing = likely bot
      if (stdDev < 1 && mean < 10) {
        indicators.uniformTiming = true;
        probabilityScore += 0.2;
      }
    }

    // INDICATOR 3: No Idle Time - Continuous activity without breaks
    // Humans take breaks; bots don't
    const hasLongGap = timings.some(t => t > 30);
    if (!hasLongGap && timings.length > 10) {
      indicators.noIdleTime = true;
      probabilityScore += 0.2;
    }

    // INDICATOR 4: High Link Ratio - Excessive promotional content
    // Bots often spam links for traffic/scams
    const actionsWithContent = actions.filter(a => 
      a.action_type === 'post' || a.action_type === 'comment'
    );
    
    if (actionsWithContent.length > 5) {
      const actionsWithLinks = actionsWithContent.filter(a => a.has_links);
      const linkRatio = actionsWithLinks.length / actionsWithContent.length;
      
      if (linkRatio > 0.5) {
        indicators.highLinkRatio = true;
        indicators.linkRatioValue = linkRatio;
        probabilityScore += 0.2;
      }
    }

    // INDICATOR 5: Spam Content - Marketing/scam keywords detected
    // Bots use predictable spam language
    const spamActions = actions.filter(a => a.has_spam_keywords);
    if (spamActions.length > 0) {
      indicators.hasSpamContent = true;
      indicators.spamCount = spamActions.length;
      probabilityScore += 0.3;
    }

    // INDICATOR 6: Mass Following - Bulk follow actions
    // Bots perform mass follows to gain followers back
    const recentFollows = actions.filter(a => {
      const actionTime = new Date(a.created_at);
      const oneHourAgo = new Date(Date.now() - 3600000);
      return actionTime > oneHourAgo && a.action_type === 'follow';
    });

    if (recentFollows.length > 50) {
      indicators.massFollowing = true;
      indicators.followCount = recentFollows.length;
      probabilityScore += 0.2;
    }

    // INDICATOR 7: Suspicious Actions - Flagged by real-time analysis
    const suspiciousCount = actions.filter(a => a.is_suspicious).length;
    const suspiciousRatio = suspiciousCount / actions.length;
    
    if (suspiciousRatio > 0.3) {
      indicators.highSuspiciousRatio = true;
      indicators.suspiciousRatio = suspiciousRatio;
      probabilityScore += 0.2;
    }

    // INDICATOR 8: Action Diversity - Lack of varied behavior
    // Bots often repeat the same action type
    const actionTypes = new Set(actions.map(a => a.action_type));
    if (actionTypes.size === 1 && actions.length > 20) {
      indicators.lackOfDiversity = true;
      probabilityScore += 0.15;
    }

    // Cap probability at 1.0
    const botProbability = Math.min(probabilityScore, 1.0);

    // Calculate confidence based on sample size
    // More data = higher confidence in the score
    const confidence = Math.min(actions.length / 50, 1.0);

    return {
      botProbability,
      indicators,
      confidence,
      sampleSize: actions.length
    };

  } catch (error) {
    console.error('Error calculating bot probability:', error);
    return {
      botProbability: 0,
      indicators: {},
      confidence: 0,
      error: error.message
    };
  }
}

/**
 * Calculate user trust score
 * Comprehensive trust metric based on behavior, age, and engagement
 * 
 * Score ranges:
 * - 90-100: Highly trusted user
 * - 70-89: Trusted user
 * - 50-69: Neutral/new user
 * - 30-49: Low trust, monitor closely
 * - 0-29: High risk, likely bot/spam
 * 
 * @param {string} userId - User ID to score
 * @returns {number} Trust score (0-100)
 */
export async function calculateTrustScore(userId) {
  try {
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('created_at, avatar_url, bio')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get behavior logs
    const { data: behaviors, error: behaviorError } = await supabase
      .from('user_behavior_logs')
      .select('*')
      .eq('user_id', userId);

    if (behaviorError) throw behaviorError;

    // Get bot probability
    const { botProbability } = await calculateBotProbability(userId);

    // Get social metrics
    const { data: followers } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', userId);

    const { data: following } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', userId);

    const { data: posts } = await supabase
      .from('posts')
      .select('id, likes_count, comments_count')
      .eq('user_id', userId);

    // Start with base score
    let score = 100;

    // PENALTY: Account age
    const accountAge = Date.now() - new Date(user.created_at).getTime();
    const hoursOld = accountAge / (1000 * 60 * 60);
    
    if (hoursOld < 1) {
      score -= 20; // Very new account
    } else if (hoursOld < 24) {
      score -= 10; // Less than a day old
    } else if (hoursOld < 168) { // Less than a week
      score -= 5;
    } else if (hoursOld > 168) { // More than a week
      score += 10; // BONUS: Established account
    }

    // PENALTY: Bot probability
    if (botProbability > 0.7) {
      score -= 40; // Very likely a bot
    } else if (botProbability > 0.5) {
      score -= 30; // Likely a bot
    } else if (botProbability > 0.3) {
      score -= 15; // Suspicious
    }

    // PENALTY: Suspicious actions
    const suspiciousActions = behaviors?.filter(b => b.is_suspicious) || [];
    const suspiciousRatio = behaviors?.length > 0 
      ? suspiciousActions.length / behaviors.length 
      : 0;
    
    if (suspiciousRatio > 0.5) {
      score -= 20;
    } else if (suspiciousRatio > 0.3) {
      score -= 10;
    }

    // PENALTY: High link ratio (spammer)
    const contentActions = behaviors?.filter(b => 
      b.action_type === 'post' || b.action_type === 'comment'
    ) || [];
    
    const actionsWithLinks = contentActions.filter(b => b.has_links);
    const linkRatio = contentActions.length > 0 
      ? actionsWithLinks.length / contentActions.length 
      : 0;
    
    if (linkRatio > 0.7) {
      score -= 15;
    }

    // PENALTY: No profile picture
    if (!user.avatar_url) {
      score -= 10;
    }

    // PENALTY: No bio
    if (!user.bio || user.bio.trim().length === 0) {
      score -= 10;
    }

    // PENALTY: Low engagement ratio
    const totalEngagement = posts?.reduce((sum, post) => 
      sum + (post.likes_count || 0) + (post.comments_count || 0), 0
    ) || 0;
    const postCount = posts?.length || 0;
    const avgEngagement = postCount > 0 ? totalEngagement / postCount : 0;
    
    if (postCount > 5 && avgEngagement < 1) {
      score -= 15; // Posts but no engagement = likely bot
    }

    // BONUS: Has followers
    const followerCount = followers?.length || 0;
    if (followerCount > 0) {
      score += 5;
    }
    if (followerCount > 10) {
      score += 5;
    }
    if (followerCount > 50) {
      score += 5;
    }

    // BONUS: Mutual connections
    const followingIds = following?.map(f => f.following_id) || [];
    const followerIds = followers?.map(f => f.follower_id) || [];
    const mutualConnections = followingIds.filter(id => 
      followerIds.includes(id)
    ).length;
    
    if (mutualConnections > 0) {
      score += 10;
    }

    // BONUS: Regular posting pattern (not too fast, not too slow)
    const postActions = behaviors?.filter(b => b.action_type === 'post') || [];
    if (postActions.length > 5) {
      const timings = [];
      for (let i = 1; i < postActions.length; i++) {
        const current = new Date(postActions[i].created_at);
        const previous = new Date(postActions[i - 1].created_at);
        const hours = Math.abs(current - previous) / (1000 * 60 * 60);
        timings.push(hours);
      }
      
      const avgHoursBetweenPosts = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      // Ideal: post every 1-48 hours
      if (avgHoursBetweenPosts >= 1 && avgHoursBetweenPosts <= 48) {
        score += 5;
      }
    }

    // BONUS: Content variety
    const actionTypes = new Set(behaviors?.map(b => b.action_type) || []);
    if (actionTypes.size >= 4) {
      score += 5; // Uses multiple features = real user
    }

    // Clamp score to 0-100 range
    score = Math.max(0, Math.min(100, score));

    return score;

  } catch (error) {
    console.error('Error calculating trust score:', error);
    return 50; // Return neutral score on error
  }
}

/**
 * Detect spam content using NLP-like analysis
 * Identifies spam through multiple techniques
 * 
 * Detection methods:
 * - Keyword matching: Known spam phrases
 * - URL density: Excessive links
 * - Character repetition: "Heyyyyy!!!!"
 * - ALL CAPS: Aggressive marketing
 * - Pattern matching: Common spam structures
 * 
 * @param {string} text - Content to analyze
 * @returns {Object} { isSpam, confidence, reasons }
 */
export function detectSpamContent(text) {
  if (!text || typeof text !== 'string') {
    return { isSpam: false, confidence: 0, reasons: [] };
  }

  const reasons = [];
  let spamScore = 0;

  // Check for spam keywords
  const lowerText = text.toLowerCase();
  const foundKeywords = SPAM_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword)
  );
  
  if (foundKeywords.length > 0) {
    reasons.push(`Contains spam keywords: ${foundKeywords.join(', ')}`);
    spamScore += 0.3 * Math.min(foundKeywords.length, 3);
  }

  // Count links/URLs
  const links = text.match(URL_REGEX) || [];
  const linkCount = links.length;
  const linkDensity = linkCount / Math.max(text.split(/\s+/).length, 1);
  
  if (linkCount > 3) {
    reasons.push(`Too many links: ${linkCount}`);
    spamScore += 0.3;
  } else if (linkDensity > 0.3) {
    reasons.push(`High link density: ${(linkDensity * 100).toFixed(1)}%`);
    spamScore += 0.2;
  }

  // Detect repeated characters (Heyyyyy!!!!)
  const repeatedChars = text.match(/(.)\1{4,}/g);
  if (repeatedChars) {
    reasons.push(`Excessive character repetition: ${repeatedChars.join(', ')}`);
    spamScore += 0.2;
  }

  // Detect ALL CAPS text
  const words = text.split(/\s+/).filter(w => w.length > 3);
  const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w));
  const capsRatio = words.length > 0 ? capsWords.length / words.length : 0;
  
  if (capsRatio > 0.5) {
    reasons.push(`Excessive ALL CAPS: ${(capsRatio * 100).toFixed(1)}%`);
    spamScore += 0.2;
  }

  // Detect excessive punctuation
  const punctCount = (text.match(/[!?]{2,}/g) || []).length;
  if (punctCount > 2) {
    reasons.push(`Excessive punctuation: ${punctCount} instances`);
    spamScore += 0.15;
  }

  // Detect emoji spam
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const emojiDensity = emojiCount / Math.max(text.length, 1);
  
  if (emojiDensity > 0.2) {
    reasons.push(`High emoji density: ${emojiCount} emojis`);
    spamScore += 0.15;
  }

  // Detect short content with links (classic spam)
  if (text.length < 50 && linkCount > 0) {
    reasons.push('Short message with links');
    spamScore += 0.2;
  }

  // Detect common spam patterns
  const spamPatterns = [
    /\b(dm|message)\s+(me|us)\b/i,
    /\b(follow|check out)\s+(my|our)\b/i,
    /\b(link in bio|bio link)\b/i,
    /\b\d{10,}\b/, // Long numbers (phone numbers)
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i // Email addresses
  ];

  spamPatterns.forEach(pattern => {
    if (pattern.test(text)) {
      reasons.push(`Matches spam pattern: ${pattern.source}`);
      spamScore += 0.15;
    }
  });

  // Calculate final confidence
  const confidence = Math.min(spamScore, 1.0);
  const isSpam = confidence > 0.5;

  return {
    isSpam,
    confidence,
    reasons,
    score: spamScore
  };
}

/**
 * Update user trust score and verification level
 * Recalculates trust and updates database
 * 
 * Verification levels:
 * - unverified: Trust < 30
 * - basic: Trust 30-50
 * - verified: Trust 50-70
 * - trusted: Trust 70-90
 * - highly_trusted: Trust > 90
 * 
 * @param {string} userId - User ID to update
 * @returns {Object} { trustScore, botProbability, verificationLevel }
 */
export async function updateUserTrustScore(userId) {
  try {
    // Calculate current scores
    const trustScore = await calculateTrustScore(userId);
    const { botProbability } = await calculateBotProbability(userId);

    // Determine verification level based on trust score
    let verificationLevel = 'unverified';
    if (trustScore >= 90) {
      verificationLevel = 'highly_trusted';
    } else if (trustScore >= 70) {
      verificationLevel = 'trusted';
    } else if (trustScore >= 50) {
      verificationLevel = 'verified';
    } else if (trustScore >= 30) {
      verificationLevel = 'basic';
    }

    // Check if user has identity verification record
    const { data: existing } = await supabase
      .from('user_identity_verification')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Update existing record
      await supabase
        .from('user_identity_verification')
        .update({
          trust_score: trustScore,
          verification_level: verificationLevel,
          bot_probability: botProbability,
          last_verification_date: new Date().toISOString()
        })
        .eq('user_id', userId);
    } else {
      // Create new record
      await supabase
        .from('user_identity_verification')
        .insert({
          user_id: userId,
          trust_score: trustScore,
          verification_level: verificationLevel,
          bot_probability: botProbability,
          verification_method: 'behavioral_analysis',
          last_verification_date: new Date().toISOString()
        });
    }

    // If bot probability is very high, flag for review
    if (botProbability > 0.8) {
      await supabase
        .from('flagged_content')
        .insert({
          content_id: userId,
          content_type: 'user',
          reason: 'high_bot_probability',
          reported_by: 'system',
          status: 'pending',
          severity: 'high'
        });
    }

    return {
      trustScore,
      botProbability,
      verificationLevel
    };

  } catch (error) {
    console.error('Error updating user trust score:', error);
    throw error;
  }
}

/**
 * Get user behavior summary
 * Comprehensive overview of user patterns
 * 
 * @param {string} userId - User ID to analyze
 * @returns {Object} Complete behavior profile
 */
export async function getUserBehaviorSummary(userId) {
  try {
    const [trustScore, { botProbability, indicators, confidence }] = await Promise.all([
      calculateTrustScore(userId),
      calculateBotProbability(userId)
    ]);

    // Get recent actions
    const { data: recentActions } = await supabase
      .from('user_behavior_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get verification status
    const { data: verification } = await supabase
      .from('user_identity_verification')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      trustScore,
      botProbability,
      indicators,
      confidence,
      verificationLevel: verification?.verification_level || 'unverified',
      recentActions: recentActions || [],
      lastUpdated: verification?.last_verification_date,
      summary: {
        risk: trustScore < 30 ? 'high' : trustScore < 50 ? 'medium' : 'low',
        recommendation: botProbability > 0.7 
          ? 'Block or shadow ban'
          : botProbability > 0.5
          ? 'Monitor closely'
          : 'Allow with normal moderation'
      }
    };

  } catch (error) {
    console.error('Error getting behavior summary:', error);
    throw error;
  }
}

export default {
  logAction,
  calculateBotProbability,
  calculateTrustScore,
  detectSpamContent,
  updateUserTrustScore,
  getUserBehaviorSummary
};
