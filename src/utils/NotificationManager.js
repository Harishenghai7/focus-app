import { supabase } from '../supabaseClient';

/**
 * Enhanced notification system with real-time delivery
 */
class NotificationManager {
  static async createNotification(type, data) {
    const { recipient_id, actor_id, content_id, content_type } = data;
    
    // Don't notify self
    if (recipient_id === actor_id) return;
    
    try {
      const { data: notification } = await supabase
        .from('notifications')
        .insert([{
          user_id: recipient_id,
          type,
          actor_id,
          content_id,
          content_type,
          created_at: new Date().toISOString()
        }])
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(username, avatar_url)
        `)
        .single();
        
      // Send real-time notification
      await supabase
        .channel(`notifications-${recipient_id}`)
        .send({
          type: 'broadcast',
          event: 'new_notification',
          payload: notification
        });
        
      // Send push notification if enabled
      await this.sendPushNotification(recipient_id, notification);
      
      return notification;
      
    } catch (error) {

    }
  }
  
  static async sendPushNotification(userId, notification) {
    // Implementation for push notifications
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.pushManager) {
          // Send push notification (requires service worker setup)

        }
      } catch (error) {

      }
    }
  }
  
  static getNotificationMessage(notification) {
    const { type, actor } = notification;
    const username = actor?.username || 'Someone';
    
    switch (type) {
      case 'like':
        return `${username} liked your post`;
      case 'comment':
        return `${username} commented on your post`;
      case 'follow':
        return `${username} started following you`;
      case 'mention':
        return `${username} mentioned you in a comment`;
      case 'post':
        return `${username} shared a new post`;
      case 'story':
        return `${username} added to their story`;
      default:
        return 'New notification';
    }
  }
  
  static async markAsRead(notificationId) {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
    } catch (error) {

    }
  }
  
  static async markAllAsRead(userId) {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    } catch (error) {

    }
  }
  
  static async getUnreadCount(userId) {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);
      
      return count || 0;
    } catch (error) {

      return 0;
    }
  }
}

export default NotificationManager;