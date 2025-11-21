import { supabase } from '../supabaseClient';

/**
 * Notification Preferences Utility
 * Handles checking user notification preferences before sending notifications
 */

/**
 * Get user's notification preferences
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} User's notification settings
 */
export async function getUserNotificationPreferences(userId) {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('push_notifications, notify_likes, notify_comments, notify_follows, notify_messages, email_notifications')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Return default preferences if error
      return {
        push_notifications: true,
        notify_likes: true,
        notify_comments: true,
        notify_follows: true,
        notify_messages: true,
        email_notifications: true
      };
    }

    return data || {
      push_notifications: true,
      notify_likes: true,
      notify_comments: true,
      notify_follows: true,
      notify_messages: true,
      email_notifications: true
    };
  } catch (error) {
    return {
      push_notifications: true,
      notify_likes: true,
      notify_comments: true,
      notify_follows: true,
      notify_messages: true,
      email_notifications: true
    };
  }
}

/**
 * Check if user wants to receive a specific type of notification
 * @param {string} userId - The user ID
 * @param {string} notificationType - Type of notification (like, comment, follow, message)
 * @returns {Promise<boolean>} Whether the user wants this notification
 */
export async function shouldSendNotification(userId, notificationType) {
  const preferences = await getUserNotificationPreferences(userId);

  // Check if push notifications are enabled globally
  if (!preferences.push_notifications) {
    return false;
  }

  // Check specific notification type
  switch (notificationType) {
    case 'like':
      return preferences.notify_likes;
    case 'comment':
    case 'mention':
      return preferences.notify_comments;
    case 'follow':
    case 'follow_request':
      return preferences.notify_follows;
    case 'message':
      return preferences.notify_messages;
    default:
      return true; // Allow other notification types by default
  }
}

/**
 * Create a notification with preference checking
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object|null>} Created notification or null if user doesn't want it
 */
export async function createNotificationWithPreferences(notificationData) {
  const { user_id, type } = notificationData;

  // Check if user wants this type of notification
  const shouldSend = await shouldSendNotification(user_id, type);

  if (!shouldSend) {
    return null;
  }

  // Create the notification
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Batch create notifications with preference checking
 * @param {Array<Object>} notificationsData - Array of notification data objects
 * @returns {Promise<Array<Object>>} Array of created notifications
 */
export async function createNotificationsWithPreferences(notificationsData) {
  const results = await Promise.all(
    notificationsData.map(data => createNotificationWithPreferences(data))
  );

  // Filter out null results (notifications that were skipped)
  return results.filter(result => result !== null);
}

/**
 * Check if user wants email notifications
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the user wants email notifications
 */
export async function shouldSendEmailNotification(userId) {
  const preferences = await getUserNotificationPreferences(userId);
  return preferences.email_notifications;
}

export default {
  getUserNotificationPreferences,
  shouldSendNotification,
  createNotificationWithPreferences,
  createNotificationsWithPreferences,
  shouldSendEmailNotification
};
