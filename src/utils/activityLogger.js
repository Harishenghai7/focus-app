/**
 * Activity Logger
 * Track teen activity for guardian dashboard
 */

import { supabase } from '../lib/supabase';

/**
 * Log teen activity
 */
export const logActivity = async (teenId, activityType, details = {}) => {
    try {
        const { error } = await supabase
            .from('teen_activity_logs')
            .insert({
                teen_id: teenId,
                activity_type: activityType,
                details
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw - activity logging should not break the app
    }
};

/**
 * Log post creation
 */
export const logPostCreated = async (teenId, postId, mediaCount = 0) => {
    await logActivity(teenId, 'post_created', {
        post_id: postId,
        media_count: mediaCount
    });
};

/**
 * Log post deletion
 */
export const logPostDeleted = async (teenId, postId) => {
    await logActivity(teenId, 'post_deleted', {
        post_id: postId
    });
};

/**
 * Log user followed
 */
export const logUserFollowed = async (teenId, followedUserId, followedUsername) => {
    await logActivity(teenId, 'followed_user', {
        user_id: followedUserId,
        username: followedUsername
    });
};

/**
 * Log user unfollowed
 */
export const logUserUnfollowed = async (teenId, unfollowedUserId, unfollowedUsername) => {
    await logActivity(teenId, 'unfollowed_user', {
        user_id: unfollowedUserId,
        username: unfollowedUsername
    });
};

/**
 * Log new follower
 */
export const logNewFollower = async (teenId, followerId, followerUsername) => {
    await logActivity(teenId, 'new_follower', {
        user_id: followerId,
        username: followerUsername
    });
};

/**
 * Log content reported
 */
export const logContentReported = async (teenId, contentId, contentType, reason) => {
    await logActivity(teenId, 'content_reported', {
        content_id: contentId,
        content_type: contentType,
        reason
    });
};

/**
 * Log account blocked
 */
export const logAccountBlocked = async (teenId, blockedUserId, blockedUsername) => {
    await logActivity(teenId, 'account_blocked', {
        user_id: blockedUserId,
        username: blockedUsername
    });
};

/**
 * Log message sent
 */
export const logMessageSent = async (teenId, recipientId, recipientUsername) => {
    await logActivity(teenId, 'message_sent', {
        recipient_id: recipientId,
        recipient_username: recipientUsername
    });
};

/**
 * Log profile updated
 */
export const logProfileUpdated = async (teenId, updatedFields = []) => {
    await logActivity(teenId, 'profile_updated', {
        updated_fields: updatedFields
    });
};

/**
 * Log location shared
 */
export const logLocationShared = async (teenId, sharedWith = 'public') => {
    await logActivity(teenId, 'location_shared', {
        shared_with: sharedWith
    });
};

/**
 * Get activity summary for a date range
 */
export const getActivitySummary = async (teenId, startDate, endDate) => {
    try {
        const { data, error } = await supabase
            .from('teen_activity_logs')
            .select('activity_type, details, created_at')
            .eq('teen_id', teenId)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Aggregate by type
        const summary = {
            posts_created: 0,
            posts_deleted: 0,
            users_followed: 0,
            users_unfollowed: 0,
            new_followers: 0,
            content_reported: 0,
            accounts_blocked: 0,
            messages_sent: 0,
            profile_updates: 0,
            location_shares: 0,
            total_activities: data?.length || 0,
            detailed_activities: data || []
        };

        data?.forEach(activity => {
            switch (activity.activity_type) {
                case 'post_created':
                    summary.posts_created++;
                    break;
                case 'post_deleted':
                    summary.posts_deleted++;
                    break;
                case 'followed_user':
                    summary.users_followed++;
                    break;
                case 'unfollowed_user':
                    summary.users_unfollowed++;
                    break;
                case 'new_follower':
                    summary.new_followers++;
                    break;
                case 'content_reported':
                    summary.content_reported++;
                    break;
                case 'account_blocked':
                    summary.accounts_blocked++;
                    break;
                case 'message_sent':
                    summary.messages_sent++;
                    break;
                case 'profile_updated':
                    summary.profile_updates++;
                    break;
                case 'location_shared':
                    summary.location_shares++;
                    break;
                default:
                    break;
            }
        });

        return summary;
    } catch (error) {
        console.error('Error getting activity summary:', error);
        throw error;
    }
};

/**
 * Get recent activities (for dashboard widget)
 */
export const getRecentActivities = async (teenId, limit = 20) => {
    try {
        const { data, error } = await supabase
            .from('teen_activity_logs')
            .select('*')
            .eq('teen_id', teenId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error getting recent activities:', error);
        throw error;
    }
};

/**
 * Get activity by type
 */
export const getActivitiesByType = async (teenId, activityType, limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('teen_activity_logs')
            .select('*')
            .eq('teen_id', teenId)
            .eq('activity_type', activityType)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error(`Error getting ${activityType} activities:`, error);
        throw error;
    }
};

const _defaultModule = {
    logActivity,
    logPostCreated,
    logPostDeleted,
    logUserFollowed,
    logUserUnfollowed,
    logNewFollower,
    logContentReported,
    logAccountBlocked,
    logMessageSent,
    logProfileUpdated,
    logLocationShared,
    getActivitySummary,
    getRecentActivities,
    getActivitiesByType
};


export default _defaultModule;
