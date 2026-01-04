/**
 * Teen Care Integration Helper
 * Wrapper functions to easily integrate Teen Care features into existing components
 */

import { analyzeContent, ALERT_TYPES } from './contentAnalyzer';
import { processContentForAlerts } from './alertNotifier';
import {
    logPostCreated,
    logPostDeleted,
    logUserFollowed,
    logUserUnfollowed,
    logNewFollower,
    logMessageSent,
    logProfileUpdated
} from './activityLogger';
import { supabase } from '../lib/supabase';

/**
 * Analyze and process post content before publishing
 * Call this before saving a post to check for safety issues
 */
export const analyzePostContent = async (userId, postText, postId = null) => {
    if (!postText || postText.trim().length === 0) {
        return { safe: true, issues: [] };
    }

    try {
        // Analyze content with AI
        const analysis = await analyzeContent(postText, {
            contentId: postId,
            contentType: 'post'
        });

        // If flagged, create alerts for guardians
        if (analysis.flagged && analysis.issues.length > 0) {
            await processContentForAlerts(userId, postText, {
                contentId: postId,
                contentType: 'post'
            });

            return {
                safe: false,
                issues: analysis.issues,
                severity: analysis.issues.reduce((max, issue) => {
                    const severities = ['low', 'medium', 'high', 'critical'];
                    return severities.indexOf(issue.severity) > severities.indexOf(max)
                        ? issue.severity
                        : max;
                }, 'low')
            };
        }

        return { safe: true, issues: [] };
    } catch (error) {
        console.error('Error analyzing post content:', error);
        // Don't block posting if analysis fails
        return { safe: true, issues: [], error: error.message };
    }
};

/**
 * Log post creation activity
 * Call after successfully publishing a post
 */
export const logPostActivity = async (userId, postId, mediaCount = 0) => {
    try {
        // Check if user is a teen (has age verification)
        const { data: ageData } = await supabase
            .from('age_verification')
            .select('is_teen_mode, is_coppa_mode')
            .eq('user_id', userId)
            .single();

        // Only log if user is in teen/COPPA mode
        if (ageData && (ageData.is_teen_mode || ageData.is_coppa_mode)) {
            await logPostCreated(userId, postId, mediaCount);
        }
    } catch (error) {
        console.error('Error logging post activity:', error);
        // Don't throw - logging should not break the app
    }
};

/**
 * Analyze and process message content
 * Call before sending a DM
 */
export const analyzeMessageContent = async (senderId, recipientId, messageText) => {
    if (!messageText || messageText.trim().length === 0) {
        return { safe: true };
    }

    try {
        // Get sender and recipient ages
        const { data: senderAge } = await supabase
            .from('age_verification')
            .select('birth_date')
            .eq('user_id', senderId)
            .single();

        const { data: recipientAge } = await supabase
            .from('age_verification')
            .select('birth_date, is_teen_mode, is_coppa_mode')
            .eq('user_id', recipientId)
            .single();

        // Calculate ages
        const senderAgeYears = senderAge ? calculateAge(senderAge.birth_date) : null;
        const recipientAgeYears = recipientAge ? calculateAge(recipientAge.birth_date) : null;

        // Analyze content
        const analysis = await analyzeContent(messageText, {
            contentType: 'message',
            senderId,
            recipientId,
            senderAge: senderAgeYears,
            recipientAge: recipientAgeYears
        });

        // If recipient is a teen, process alerts
        if (recipientAge && (recipientAge.is_teen_mode || recipientAge.is_coppa_mode)) {
            if (analysis.flagged) {
                await processContentForAlerts(recipientId, messageText, {
                    contentType: 'message',
                    relatedUserId: senderId
                });
            }

            // Log message activity
            const { data: senderData } = await supabase
                .from('users')
                .select('username')
                .eq('id', senderId)
                .single();

            await logMessageSent(recipientId, senderId, senderData?.username);
        }

        return {
            safe: !analysis.flagged,
            issues: analysis.issues || []
        };
    } catch (error) {
        console.error('Error analyzing message:', error);
        return { safe: true, error: error.message };
    }
};

/**
 * Log follow activity
 * Call when user follows someone
 */
export const logFollowActivity = async (userId, followedUserId) => {
    try {
        const { data: followedUser } = await supabase
            .from('users')
            .select('username')
            .eq('id', followedUserId)
            .single();

        // Check if user is a teen
        const { data: ageData } = await supabase
            .from('age_verification')
            .select('is_teen_mode, is_coppa_mode')
            .eq('user_id', userId)
            .single();

        if (ageData && (ageData.is_teen_mode || ageData.is_coppa_mode)) {
            await logUserFollowed(userId, followedUserId, followedUser?.username);
        }

        // Check if followed user is a teen (they get a new follower)
        const { data: followedAgeData } = await supabase
            .from('age_verification')
            .select('is_teen_mode, is_coppa_mode')
            .eq('user_id', followedUserId)
            .single();

        if (followedAgeData && (followedAgeData.is_teen_mode || followedAgeData.is_coppa_mode)) {
            const { data: followerUser } = await supabase
                .from('users')
                .select('username')
                .eq('id', userId)
                .single();

            await logNewFollower(followedUserId, userId, followerUser?.username);
        }
    } catch (error) {
        console.error('Error logging follow activity:', error);
    }
};

/**
 * Log unfollow activity
 * Call when user unfollows someone
 */
export const logUnfollowActivity = async (userId, unfollowedUserId) => {
    try {
        const { data: unfollowedUser } = await supabase
            .from('users')
            .select('username')
            .eq('id', unfollowedUserId)
            .single();

        const { data: ageData } = await supabase
            .from('age_verification')
            .select('is_teen_mode, is_coppa_mode')
            .eq('user_id', userId)
            .single();

        if (ageData && (ageData.is_teen_mode || ageData.is_coppa_mode)) {
            await logUserUnfollowed(userId, unfollowedUserId, unfollowedUser?.username);
        }
    } catch (error) {
        console.error('Error logging unfollow activity:', error);
    }
};

/**
 * Helper to calculate age from birthdate
 */
const calculateAge = (birthDate) => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

/**
 * Check if user should see age verification modal
 * Call in your Auth flow after signup/login
 */
export const shouldShowAgeVerification = async (userId) => {
    try {
        const { data } = await supabase
            .from('age_verification')
            .select('id')
            .eq('user_id', userId)
            .single();

        // Show modal if no age verification record exists
        return !data;
    } catch (error) {
        return true; // Show on error to be safe
    }
};

export default {
    analyzePostContent,
    logPostActivity,
    analyzeMessageContent,
    logFollowActivity,
    logUnfollowActivity,
    shouldShowAgeVerification
};
