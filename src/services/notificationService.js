import { supabase } from '../config/supabaseClient';

/**
 * Notification Service
 * Handles all notification operations including creation, reading, deletion, and push notifications
 */

// Notification types enum
export const NOTIFICATION_TYPES = {
  LIKE: 'like',
  COMMENT: 'comment',
  FOLLOW: 'follow',
  MENTION: 'mention',
  TAG: 'tag',
  DM: 'dm',
  CALL: 'call'
};

/**
 * Send a notification to a user
 * @param {string} userId - The user ID to send notification to
 * @param {string} type - Type of notification (like, comment, follow, mention, tag, dm, call)
 * @param {object} data - Additional notification data
 * @returns {Promise<object>} The created notification
 */
export const sendNotification = async (userId, type, data = {}) => {
  try {
    // Validate notification type
    if (!Object.values(NOTIFICATION_TYPES).includes(type)) {
      throw new Error(`Invalid notification type: ${type}`);
    }

    // Validate required fields based on type
    const validatedData = validateNotificationData(type, data);

    // Create notification payload
    const notificationPayload = {
      user_id: userId,
      type: type,
      sender_id: data.senderId || null,
      post_id: data.postId || null,
      comment_id: data.commentId || null,
      message: generateNotificationMessage(type, data),
      data: validatedData,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Insert notification into database
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([notificationPayload])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw error;
    }

    // Send push notification if enabled
    await sendPushNotification(userId, type, validatedData);

    // Emit real-time notification event
    await emitNotificationEvent(userId, notification);

    return notification;
  } catch (error) {
    console.error('Error in sendNotification:', error);
    throw error;
  }
};

/**
 * Mark a notification as read
 * @param {string} notificationId - The notification ID to mark as read
 * @returns {Promise<object>} The updated notification
 */
export const markAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in markAsRead:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object>} Result of the operation
 */
export const markAllAsRead = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select();

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    throw error;
  }
};

/**
 * Delete a notification
 * @param {string} notificationId - The notification ID to delete
 * @returns {Promise<boolean>} Success status
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    throw error;
  }
};

/**
 * Delete all notifications for a user
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteAllNotifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count for a user
 * @param {string} userId - The user ID
 * @returns {Promise<number>} Count of unread notifications
 */
export const getUnreadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    return 0;
  }
};

/**
 * Get all notifications for a user
 * @param {string} userId - The user ID
 * @param {object} options - Query options (limit, offset, unreadOnly)
 * @returns {Promise<array>} Array of notifications
 */
export const getNotifications = async (userId, options = {}) => {
  try {
    const { 
      limit = 50, 
      offset = 0, 
      unreadOnly = false,
      type = null 
    } = options;

    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        post:post_id (
          id,
          content,
          media_urls
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getNotifications:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time notification updates
 * @param {string} userId - The user ID
 * @param {function} callback - Callback function to handle new notifications
 * @returns {object} Subscription object
 */
export const subscribeToNotifications = (userId, callback) => {
  try {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return subscription;
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    throw error;
  }
};

/**
 * Unsubscribe from notification updates
 * @param {object} subscription - The subscription object to unsubscribe
 */
export const unsubscribeFromNotifications = async (subscription) => {
  try {
    if (subscription) {
      await supabase.removeChannel(subscription);
    }
  } catch (error) {
    console.error('Error unsubscribing from notifications:', error);
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate notification data based on type
 * @private
 */
const validateNotificationData = (type, data) => {
  const validated = { ...data };

  switch (type) {
    case NOTIFICATION_TYPES.LIKE:
      if (!data.senderId || !data.postId) {
        throw new Error('Like notifications require senderId and postId');
      }
      break;

    case NOTIFICATION_TYPES.COMMENT:
      if (!data.senderId || !data.postId || !data.commentId) {
        throw new Error('Comment notifications require senderId, postId, and commentId');
      }
      validated.commentText = data.commentText || '';
      break;

    case NOTIFICATION_TYPES.FOLLOW:
      if (!data.senderId) {
        throw new Error('Follow notifications require senderId');
      }
      break;

    case NOTIFICATION_TYPES.MENTION:
      if (!data.senderId || !data.postId) {
        throw new Error('Mention notifications require senderId and postId');
      }
      validated.mentionContext = data.mentionContext || '';
      break;

    case NOTIFICATION_TYPES.TAG:
      if (!data.senderId || !data.postId) {
        throw new Error('Tag notifications require senderId and postId');
      }
      break;

    case NOTIFICATION_TYPES.DM:
      if (!data.senderId || !data.messageId) {
        throw new Error('DM notifications require senderId and messageId');
      }
      validated.messagePreview = data.messagePreview || '';
      break;

    case NOTIFICATION_TYPES.CALL:
      if (!data.senderId || !data.callId) {
        throw new Error('Call notifications require senderId and callId');
      }
      validated.callType = data.callType || 'voice';
      validated.callStatus = data.callStatus || 'incoming';
      break;

    default:
      break;
  }

  return validated;
};

/**
 * Generate notification message based on type and data
 * @private
 */
const generateNotificationMessage = (type, data) => {
  const senderName = data.senderName || 'Someone';

  switch (type) {
    case NOTIFICATION_TYPES.LIKE:
      return `${senderName} liked your post`;

    case NOTIFICATION_TYPES.COMMENT:
      return `${senderName} commented on your post`;

    case NOTIFICATION_TYPES.FOLLOW:
      return `${senderName} started following you`;

    case NOTIFICATION_TYPES.MENTION:
      return `${senderName} mentioned you in a post`;

    case NOTIFICATION_TYPES.TAG:
      return `${senderName} tagged you in a post`;

    case NOTIFICATION_TYPES.DM:
      return `${senderName} sent you a message`;

    case NOTIFICATION_TYPES.CALL:
      const callType = data.callType === 'video' ? 'video' : 'voice';
      return `${senderName} is calling you (${callType})`;

    default:
      return `You have a new notification`;
  }
};

/**
 * Send push notification (Web Push API / Service Worker)
 * @private
 */
const sendPushNotification = async (userId, type, data) => {
  try {
    // Check if push notifications are supported and enabled
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    // Get user's push subscription from database
    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('push_notifications_enabled, push_subscription')
      .eq('user_id', userId)
      .single();

    if (error || !userSettings?.push_notifications_enabled) {
      return;
    }

    // Check if notifications are enabled for this type
    const notificationSettings = userSettings.notification_settings || {};
    if (notificationSettings[type] === false) {
      return;
    }

    // Send push notification via service worker
    if ('serviceWorker' in navigator && userSettings.push_subscription) {
      const registration = await navigator.serviceWorker.ready;
      
      const notificationOptions = {
        body: generateNotificationMessage(type, data),
        icon: '/logo192.png',
        badge: '/badge-72x72.png',
        tag: type,
        data: {
          type,
          ...data
        },
        requireInteraction: type === NOTIFICATION_TYPES.CALL,
        vibrate: type === NOTIFICATION_TYPES.CALL ? [200, 100, 200] : [100]
      };

      await registration.showNotification('Focus App', notificationOptions);
    }
  } catch (error) {
    console.error('Error sending push notification:', error);
    // Don't throw error - push notifications are optional
  }
};

/**
 * Emit real-time notification event
 * @private
 */
const emitNotificationEvent = async (userId, notification) => {
  try {
    // This will be picked up by real-time subscriptions
    // The database trigger or subscription will handle the event
    console.log(`Notification emitted for user ${userId}:`, notification.type);
  } catch (error) {
    console.error('Error emitting notification event:', error);
  }
};

/**
 * Request notification permission from the user
 * @returns {Promise<string>} Permission status
 */
export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'unsupported';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'error';
  }
};

/**
 * Register for push notifications
 * @param {string} userId - The user ID
 * @returns {Promise<object>} Subscription object
 */
export const registerPushNotifications = async (userId) => {
  try {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('Push notifications are not supported');
    }

    // Request notification permission
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY
    });

    // Save subscription to database
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        push_notifications_enabled: true,
        push_subscription: subscription.toJSON(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving push subscription:', error);
      throw error;
    }

    return subscription;
  } catch (error) {
    console.error('Error registering push notifications:', error);
    throw error;
  }
};

/**
 * Unregister from push notifications
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Success status
 */
export const unregisterPushNotifications = async (userId) => {
  try {
    // Unsubscribe from push notifications
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
      }
    }

    // Update database
    const { error } = await supabase
      .from('user_settings')
      .update({
        push_notifications_enabled: false,
        push_subscription: null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating push notification settings:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error unregistering push notifications:', error);
    throw error;
  }
};

/**
 * Update notification settings for a user
 * @param {string} userId - The user ID
 * @param {object} settings - Notification settings by type
 * @returns {Promise<object>} Updated settings
 */
export const updateNotificationSettings = async (userId, settings) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: userId,
        notification_settings: settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateNotificationSettings:', error);
    throw error;
  }
};

/**
 * Get notification settings for a user
 * @param {string} userId - The user ID
 * @returns {Promise<object>} Notification settings
 */
export const getNotificationSettings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('notification_settings, push_notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "not found" error
      console.error('Error getting notification settings:', error);
      throw error;
    }

    // Return default settings if none exist
    return data?.notification_settings || {
      [NOTIFICATION_TYPES.LIKE]: true,
      [NOTIFICATION_TYPES.COMMENT]: true,
      [NOTIFICATION_TYPES.FOLLOW]: true,
      [NOTIFICATION_TYPES.MENTION]: true,
      [NOTIFICATION_TYPES.TAG]: true,
      [NOTIFICATION_TYPES.DM]: true,
      [NOTIFICATION_TYPES.CALL]: true
    };
  } catch (error) {
    console.error('Error in getNotificationSettings:', error);
    // Return default settings on error
    return {
      [NOTIFICATION_TYPES.LIKE]: true,
      [NOTIFICATION_TYPES.COMMENT]: true,
      [NOTIFICATION_TYPES.FOLLOW]: true,
      [NOTIFICATION_TYPES.MENTION]: true,
      [NOTIFICATION_TYPES.TAG]: true,
      [NOTIFICATION_TYPES.DM]: true,
      [NOTIFICATION_TYPES.CALL]: true
    };
  }
};

// ==================== BULK OPERATIONS ====================

/**
 * Send bulk notifications (for batch operations)
 * @param {array} notifications - Array of notification objects
 * @returns {Promise<array>} Array of created notifications
 */
export const sendBulkNotifications = async (notifications) => {
  try {
    const notificationPayloads = notifications.map(({ userId, type, data }) => ({
      user_id: userId,
      type: type,
      sender_id: data.senderId || null,
      post_id: data.postId || null,
      comment_id: data.commentId || null,
      message: generateNotificationMessage(type, data),
      data: validateNotificationData(type, data),
      is_read: false,
      created_at: new Date().toISOString()
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationPayloads)
      .select();

    if (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in sendBulkNotifications:', error);
    throw error;
  }
};

/**
 * Clean up old notifications (for maintenance)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>} Number of deleted notifications
 */
export const cleanupOldNotifications = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('is_read', true)
      .select();

    if (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in cleanupOldNotifications:', error);
    throw error;
  }
};

export default {
  sendNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  getNotifications,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  requestNotificationPermission,
  registerPushNotifications,
  unregisterPushNotifications,
  updateNotificationSettings,
  getNotificationSettings,
  sendBulkNotifications,
  cleanupOldNotifications,
  NOTIFICATION_TYPES
};
