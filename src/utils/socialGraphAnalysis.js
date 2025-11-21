import { supabase } from '../supabaseClient';

/**
 * Social Graph Analysis Engine
 * Detects fake accounts and bot networks through social connection patterns
 * 
 * This module analyzes:
 * - Follower/following relationships and ratios
 * - Mutual connection patterns
 * - Engagement rates vs. network size
 * - Bot network detection through temporal clustering
 * - Social behavior anomalies
 * 
 * Bot networks often have distinctive patterns:
 * - Mass following with few followers (follow-back farms)
 * - All accounts created simultaneously (coordinated bots)
 * - High ratios indicating spam behavior
 * - Zero engagement despite high activity
 */

/**
 * Analyze user's social graph structure
 * Provides comprehensive overview of social connections
 * 
 * Key metrics:
 * - Follower count: How many follow this user
 * - Following count: How many this user follows
 * - Mutual connections: Bidirectional relationships (strong signal of legitimacy)
 * - Ratio: Following/Follower ratio (high ratio = potential spam)
 * - Engagement rate: Interaction quality vs. audience size
 * 
 * @param {string} userId - User ID to analyze
 * @returns {Object} Complete social graph metrics
 */
export async function analyzeSocialGraph(userId) {
  try {
    // Query followers (users who follow this user)
    const { data: followers, error: followersError } = await supabase
      .from('follows')
      .select('follower_id, created_at')
      .eq('following_id', userId);

    if (followersError) throw followersError;

    // Query following (users this user follows)
    const { data: following, error: followingError } = await supabase
      .from('follows')
      .select('following_id, created_at')
      .eq('follower_id', userId);

    if (followingError) throw followingError;

    const followerCount = followers?.length || 0;
    const followingCount = following?.length || 0;

    // Calculate mutual connections
    // These are users who both follow this user AND are followed by this user
    // Mutual connections are a strong indicator of real relationships
    const followerIds = followers?.map(f => f.follower_id) || [];
    const followingIds = following?.map(f => f.following_id) || [];
    
    const mutualConnections = followerIds.filter(id => 
      followingIds.includes(id)
    );
    const mutualCount = mutualConnections.length;

    // Calculate follower/following ratio
    // High ratio (e.g., following 1000, followers 10) = potential spam bot
    // Low ratio or balanced = more likely genuine user
    const ratio = followingCount > 0 
      ? followingCount / Math.max(followerCount, 1)
      : 0;

    // Get user's posts for engagement calculation
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, likes_count, comments_count')
      .eq('user_id', userId);

    if (postsError) throw postsError;

    const postCount = posts?.length || 0;

    // Calculate engagement rate
    // Total interactions divided by posts
    // Low engagement despite high post count = bot behavior
    const totalLikes = posts?.reduce((sum, post) => sum + (post.likes_count || 0), 0) || 0;
    const totalComments = posts?.reduce((sum, post) => sum + (post.comments_count || 0), 0) || 0;
    const totalEngagement = totalLikes + totalComments;
    
    // Engagement rate as percentage
    const engagementRate = postCount > 0 
      ? (totalEngagement / postCount / Math.max(followerCount, 1)) * 100
      : 0;

    // Analyze follower creation dates for bot network detection
    // Bot networks often create multiple accounts on the same day
    const followerCreationDates = {};
    if (followers && followers.length > 0) {
      // Get follower user data
      const { data: followerUsers } = await supabase
        .from('users')
        .select('id, created_at')
        .in('id', followerIds);

      followerUsers?.forEach(user => {
        const date = new Date(user.created_at).toDateString();
        followerCreationDates[date] = (followerCreationDates[date] || 0) + 1;
      });
    }

    // Find if majority of followers created on same day (bot network indicator)
    const maxSameDayFollowers = Math.max(...Object.values(followerCreationDates), 0);
    const sameDayFollowerRatio = followerCount > 0 
      ? maxSameDayFollowers / followerCount 
      : 0;

    // Calculate average account age of followers
    const { data: followerUsers } = await supabase
      .from('users')
      .select('created_at')
      .in('id', followerIds);

    let avgFollowerAge = 0;
    if (followerUsers && followerUsers.length > 0) {
      const totalAge = followerUsers.reduce((sum, user) => {
        const age = Date.now() - new Date(user.created_at).getTime();
        return sum + age;
      }, 0);
      avgFollowerAge = totalAge / followerUsers.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    return {
      followerCount,
      followingCount,
      mutualCount,
      mutualConnections,
      ratio,
      engagementRate,
      postCount,
      totalEngagement,
      sameDayFollowerRatio,
      avgFollowerAge,
      followerCreationDates
    };

  } catch (error) {
    console.error('Error analyzing social graph:', error);
    throw error;
  }
}

/**
 * Detect suspicious social patterns indicating bot/fake accounts
 * Uses heuristic analysis to identify bot behavior
 * 
 * Bot indicators explained:
 * 1. Mass following, no followers: Follow-back farming bots
 * 2. Same-day follower creation: Coordinated bot networks
 * 3. Extreme ratios: Spam behavior (following thousands to get follows back)
 * 4. No mutual connections: Lack of genuine relationships
 * 5. Zero engagement: Content ignored despite high activity
 * 6. New followers with old account: Purchased followers
 * 
 * @param {string} userId - User ID to check
 * @param {Object} graphData - Social graph data from analyzeSocialGraph
 * @returns {Object} { isSuspicious, patterns, confidence, severity }
 */
export async function detectSuspiciousPatterns(userId, graphData = null) {
  try {
    // Get graph data if not provided
    if (!graphData) {
      graphData = await analyzeSocialGraph(userId);
    }

    const patterns = [];
    let suspicionScore = 0;

    const {
      followerCount,
      followingCount,
      mutualCount,
      ratio,
      engagementRate,
      postCount,
      sameDayFollowerRatio,
      avgFollowerAge
    } = graphData;

    // PATTERN 1: Mass Following with Zero Followers
    // Bot behavior: Follow thousands hoping for follow-backs
    // Real users rarely follow >100 without getting followers back
    if (followingCount > 100 && followerCount === 0) {
      patterns.push({
        type: 'mass_following_zero_followers',
        description: 'Following many users but has no followers',
        severity: 'high',
        score: 0.4
      });
      suspicionScore += 0.4;
    }

    // PATTERN 2: Extreme Mass Following
    // Following >500 with very few followers = aggressive bot
    if (followingCount > 500 && followerCount < 50) {
      patterns.push({
        type: 'extreme_mass_following',
        description: `Following ${followingCount} but only ${followerCount} followers`,
        severity: 'critical',
        score: 0.5
      });
      suspicionScore += 0.5;
    }

    // PATTERN 3: Same-Day Follower Creation (Bot Network)
    // If >50% of followers created on same day = coordinated bot attack
    // Real followers accumulate gradually over time
    if (sameDayFollowerRatio > 0.5 && followerCount > 10) {
      patterns.push({
        type: 'bot_network_followers',
        description: `${(sameDayFollowerRatio * 100).toFixed(0)}% of followers created on same day`,
        severity: 'high',
        score: 0.4
      });
      suspicionScore += 0.4;
    }

    // PATTERN 4: Extreme Ratio (Spam Behavior)
    // Following 20x more people than follow back = spam bot
    // Real users have more balanced ratios (typically < 5)
    if (ratio > 20) {
      patterns.push({
        type: 'extreme_follow_ratio',
        description: `Following ${ratio.toFixed(1)}x more than followers`,
        severity: 'high',
        score: 0.3
      });
      suspicionScore += 0.3;
    } else if (ratio > 10) {
      patterns.push({
        type: 'high_follow_ratio',
        description: `Following ${ratio.toFixed(1)}x more than followers`,
        severity: 'medium',
        score: 0.2
      });
      suspicionScore += 0.2;
    }

    // PATTERN 5: No Mutual Connections with High Following
    // Following >50 but zero mutuals = not building real relationships
    // Real users naturally develop mutual connections
    if (followingCount > 50 && mutualCount === 0) {
      patterns.push({
        type: 'no_mutual_connections',
        description: 'Following many users but no mutual connections',
        severity: 'medium',
        score: 0.25
      });
      suspicionScore += 0.25;
    }

    // PATTERN 6: Zero Engagement with High Activity
    // Posting but getting no engagement = ignored spam content
    // Real content generates at least some engagement
    if (postCount > 10 && engagementRate < 0.1) {
      patterns.push({
        type: 'zero_engagement_high_activity',
        description: 'High post count but virtually no engagement',
        severity: 'medium',
        score: 0.3
      });
      suspicionScore += 0.3;
    }

    // PATTERN 7: Very New Followers on Old Account
    // Account exists for months but followers all <1 week old = purchased followers
    const { data: userData } = await supabase
      .from('users')
      .select('created_at')
      .eq('id', userId)
      .single();

    if (userData) {
      const accountAge = (Date.now() - new Date(userData.created_at).getTime()) / (1000 * 60 * 60 * 24);
      
      if (accountAge > 30 && avgFollowerAge < 7 && followerCount > 20) {
        patterns.push({
          type: 'purchased_followers_suspected',
          description: 'Old account with very new followers (possible purchase)',
          severity: 'medium',
          score: 0.3
        });
        suspicionScore += 0.3;
      }
    }

    // PATTERN 8: Follower Count Spike Detection
    // Sudden massive follower gain = purchased followers
    const { data: recentFollows } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', userId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const recentFollowerGain = recentFollows?.length || 0;
    
    if (recentFollowerGain > 100 && followerCount > 0) {
      const spikeRatio = recentFollowerGain / followerCount;
      if (spikeRatio > 0.5) {
        patterns.push({
          type: 'follower_spike',
          description: `Gained ${recentFollowerGain} followers in 24h (${(spikeRatio * 100).toFixed(0)}% of total)`,
          severity: 'high',
          score: 0.35
        });
        suspicionScore += 0.35;
      }
    }

    // PATTERN 9: Following Only Bots
    // If user primarily follows other bots = part of bot network
    if (followingCount > 10) {
      const { data: followingUsers } = await supabase
        .from('user_identity_verification')
        .select('bot_probability')
        .in('user_id', graphData.mutualConnections || [])
        .gte('bot_probability', 0.7);

      const botFollowingCount = followingUsers?.length || 0;
      const botFollowingRatio = botFollowingCount / followingCount;

      if (botFollowingRatio > 0.5) {
        patterns.push({
          type: 'following_bot_network',
          description: `${(botFollowingRatio * 100).toFixed(0)}% of connections are suspected bots`,
          severity: 'critical',
          score: 0.5
        });
        suspicionScore += 0.5;
      }
    }

    // Cap suspicion score at 1.0
    suspicionScore = Math.min(suspicionScore, 1.0);

    // Determine overall assessment
    const isSuspicious = suspicionScore > 0.5;
    const confidence = patterns.length > 0 ? Math.min(patterns.length / 3, 1.0) : 0;
    
    // Determine severity
    let severity = 'low';
    if (suspicionScore > 0.8) {
      severity = 'critical';
    } else if (suspicionScore > 0.6) {
      severity = 'high';
    } else if (suspicionScore > 0.4) {
      severity = 'medium';
    }

    return {
      isSuspicious,
      patterns,
      confidence,
      severity,
      suspicionScore
    };

  } catch (error) {
    console.error('Error detecting suspicious patterns:', error);
    return {
      isSuspicious: false,
      patterns: [],
      confidence: 0,
      severity: 'low',
      suspicionScore: 0,
      error: error.message
    };
  }
}

/**
 * Calculate social trust score based on graph metrics
 * Different from behavioral trust - focuses on social legitimacy
 * 
 * Score interpretation:
 * - 90-100: Strong social presence, trusted network
 * - 70-89: Good social connections, legitimate user
 * - 50-69: Average social presence
 * - 30-49: Weak connections, monitor
 * - 0-29: Bot-like social behavior, high risk
 * 
 * @param {string} userId - User ID to score
 * @returns {number} Social trust score (0-100)
 */
export async function calculateSocialTrustScore(userId) {
  try {
    // Get social graph data
    const graphData = await analyzeSocialGraph(userId);
    const suspiciousData = await detectSuspiciousPatterns(userId, graphData);

    // Start with neutral base score
    let score = 50;

    const {
      followerCount,
      followingCount,
      mutualCount,
      ratio,
      engagementRate
    } = graphData;

    // BONUS: Has followers (social proof)
    // Real users attract followers; bots struggle to gain organic followers
    if (followerCount > 0) {
      score += 5;
    }
    if (followerCount > 10) {
      score += 5;
    }
    if (followerCount > 50) {
      score += 5;
    }
    if (followerCount > 100) {
      score += 5;
    }

    // BONUS: Has mutual connections (genuine relationships)
    // Mutual connections indicate real social interaction
    if (mutualCount > 0) {
      score += 10;
    }
    if (mutualCount > 5) {
      score += 10;
    }
    if (mutualCount > 20) {
      score += 5;
    }

    // BONUS: Balanced ratio (normal behavior)
    // Real users have balanced follow ratios
    if (ratio < 5 && ratio > 0.2) {
      score += 10;
    } else if (ratio < 10) {
      score += 5;
    }

    // BONUS: Good engagement rate (quality content)
    // High engagement = audience values the content
    if (engagementRate > 5) {
      score += 15;
    } else if (engagementRate > 2) {
      score += 10;
    } else if (engagementRate > 0.5) {
      score += 5;
    }

    // PENALTY: Suspicious patterns detected
    if (suspiciousData.isSuspicious) {
      if (suspiciousData.severity === 'critical') {
        score -= 40;
      } else if (suspiciousData.severity === 'high') {
        score -= 30;
      } else if (suspiciousData.severity === 'medium') {
        score -= 20;
      } else {
        score -= 10;
      }
    }

    // PENALTY: Zero mutual connections
    // No mutuals despite social activity = bot behavior
    if (mutualCount === 0 && followingCount > 20) {
      score -= 15;
    }

    // PENALTY: Extreme ratio (spam behavior)
    if (ratio > 20) {
      score -= 25;
    } else if (ratio > 10) {
      score -= 20;
    } else if (ratio > 5) {
      score -= 10;
    }

    // PENALTY: High same-day follower ratio (bot network)
    if (graphData.sameDayFollowerRatio > 0.7) {
      score -= 20;
    } else if (graphData.sameDayFollowerRatio > 0.5) {
      score -= 15;
    }

    // PENALTY: Zero engagement
    if (engagementRate === 0 && graphData.postCount > 5) {
      score -= 15;
    }

    // Clamp score to 0-100 range
    score = Math.max(0, Math.min(100, score));

    return score;

  } catch (error) {
    console.error('Error calculating social trust score:', error);
    return 50; // Return neutral score on error
  }
}

/**
 * Find bot followers (fake/purchased followers)
 * Identifies which followers are likely bots
 * 
 * This is useful for:
 * - Detecting purchased followers
 * - Identifying bot attacks
 * - Cleaning up follower lists
 * 
 * @param {string} userId - User ID to check
 * @returns {Object} { totalFollowers, suspiciousCount, percentage, suspiciousFollowers }
 */
export async function findBotFollowers(userId) {
  try {
    // Get all followers
    const { data: followers, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    if (error) throw error;

    const totalFollowers = followers?.length || 0;

    if (totalFollowers === 0) {
      return {
        totalFollowers: 0,
        suspiciousCount: 0,
        percentage: 0,
        suspiciousFollowers: []
      };
    }

    const followerIds = followers.map(f => f.follower_id);

    // Get trust scores and bot probabilities for all followers
    const { data: verificationData } = await supabase
      .from('user_identity_verification')
      .select('user_id, bot_probability, trust_score')
      .in('user_id', followerIds);

    // Identify suspicious followers
    // High bot probability (>0.7) = likely bot
    const suspiciousFollowers = verificationData?.filter(v => 
      v.bot_probability > 0.7
    ) || [];

    // Get user details for suspicious accounts
    const suspiciousIds = suspiciousFollowers.map(s => s.user_id);
    const { data: suspiciousUsers } = await supabase
      .from('users')
      .select('id, username, created_at')
      .in('id', suspiciousIds);

    // Combine data
    const suspiciousWithDetails = suspiciousFollowers.map(suspicious => {
      const userDetails = suspiciousUsers?.find(u => u.id === suspicious.user_id);
      return {
        userId: suspicious.user_id,
        username: userDetails?.username,
        createdAt: userDetails?.created_at,
        botProbability: suspicious.bot_probability,
        trustScore: suspicious.trust_score
      };
    });

    const suspiciousCount = suspiciousFollowers.length;
    const percentage = (suspiciousCount / totalFollowers) * 100;

    return {
      totalFollowers,
      suspiciousCount,
      percentage,
      suspiciousFollowers: suspiciousWithDetails
    };

  } catch (error) {
    console.error('Error finding bot followers:', error);
    throw error;
  }
}

/**
 * Update social graph metrics in database
 * Calculates and stores all social graph metrics
 * 
 * Updates social_graph_metrics table with:
 * - Follower/following counts
 * - Mutual connections
 * - Engagement rates
 * - Trust scores
 * - Suspicious pattern flags
 * 
 * @param {string} userId - User ID to update
 * @returns {Object} Complete metrics object
 */
export async function updateSocialGraphMetrics(userId) {
  try {
    // Calculate all metrics
    const graphData = await analyzeSocialGraph(userId);
    const suspiciousData = await detectSuspiciousPatterns(userId, graphData);
    const socialTrustScore = await calculateSocialTrustScore(userId);
    const botFollowerData = await findBotFollowers(userId);

    // Prepare metrics object
    const metrics = {
      user_id: userId,
      follower_count: graphData.followerCount,
      following_count: graphData.followingCount,
      mutual_count: graphData.mutualCount,
      follow_ratio: graphData.ratio,
      engagement_rate: graphData.engagementRate,
      graph_trust_score: socialTrustScore,
      is_suspicious: suspiciousData.isSuspicious,
      suspicious_patterns: suspiciousData.patterns,
      suspicion_score: suspiciousData.suspicionScore,
      bot_follower_percentage: botFollowerData.percentage,
      last_updated: new Date().toISOString()
    };

    // Upsert into database
    const { data, error } = await supabase
      .from('social_graph_metrics')
      .upsert(metrics, { 
        onConflict: 'user_id',
        returning: true
      })
      .select()
      .single();

    if (error) throw error;

    // If highly suspicious, create flag for moderation
    if (suspiciousData.severity === 'critical' || suspiciousData.severity === 'high') {
      await supabase
        .from('flagged_content')
        .insert({
          content_id: userId,
          content_type: 'user',
          reason: 'suspicious_social_graph',
          reported_by: 'system',
          status: 'pending',
          severity: suspiciousData.severity,
          additional_data: {
            patterns: suspiciousData.patterns,
            suspicionScore: suspiciousData.suspicionScore,
            socialTrustScore
          }
        });
    }

    return {
      ...metrics,
      graphData,
      suspiciousData,
      botFollowerData
    };

  } catch (error) {
    console.error('Error updating social graph metrics:', error);
    throw error;
  }
}

/**
 * Get comprehensive social graph report
 * Complete analysis for moderation/review
 * 
 * @param {string} userId - User ID to analyze
 * @returns {Object} Complete social graph report
 */
export async function getSocialGraphReport(userId) {
  try {
    const [graphData, suspiciousData, socialTrustScore, botFollowerData] = await Promise.all([
      analyzeSocialGraph(userId),
      detectSuspiciousPatterns(userId),
      calculateSocialTrustScore(userId),
      findBotFollowers(userId)
    ]);

    // Get existing metrics from database
    const { data: storedMetrics } = await supabase
      .from('social_graph_metrics')
      .select('*')
      .eq('user_id', userId)
      .single();

    return {
      userId,
      timestamp: new Date().toISOString(),
      socialTrustScore,
      graphData,
      suspiciousData,
      botFollowerData,
      storedMetrics,
      recommendation: {
        risk: suspiciousData.severity,
        action: suspiciousData.severity === 'critical' 
          ? 'Immediate review required - likely bot'
          : suspiciousData.severity === 'high'
          ? 'Flag for review - suspicious patterns'
          : suspiciousData.severity === 'medium'
          ? 'Monitor closely'
          : 'No immediate action needed',
        confidence: suspiciousData.confidence
      }
    };

  } catch (error) {
    console.error('Error getting social graph report:', error);
    throw error;
  }
}

export default {
  analyzeSocialGraph,
  detectSuspiciousPatterns,
  calculateSocialTrustScore,
  findBotFollowers,
  updateSocialGraphMetrics,
  getSocialGraphReport
};
