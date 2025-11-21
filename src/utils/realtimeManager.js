import { supabase } from '../supabaseClient';

/**
 * Enhanced real-time subscription manager
 */
class RealTimeManager {
  constructor() {
    this.subscriptions = new Map();
  }
  
  subscribeToPost(postId, callback) {
    const channelName = `post-${postId}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromPost(postId);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'posts', filter: `id=eq.${postId}` },
        (payload) => callback({ type: 'post_updated', payload })
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'likes', filter: `content_id=eq.${postId}` },
        (payload) => callback({ type: 'like_added', payload })
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'likes', filter: `content_id=eq.${postId}` },
        (payload) => callback({ type: 'like_removed', payload })
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `content_id=eq.${postId}` },
        (payload) => callback({ type: 'comment_added', payload })
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments', filter: `content_id=eq.${postId}` },
        (payload) => callback({ type: 'comment_removed', payload })
      )
      .subscribe();
      
    this.subscriptions.set(channelName, channel);
    return channel;
  }
  
  unsubscribeFromPost(postId) {
    const channelName = `post-${postId}`;
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }
  
  subscribeToUser(userId, callback) {
    const channelName = `user-${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromUser(userId);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'follows', filter: `following_id=eq.${userId}` },
        (payload) => callback({ type: 'new_follower', payload })
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'follows', filter: `following_id=eq.${userId}` },
        (payload) => callback({ type: 'follower_removed', payload })
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `user_id=eq.${userId}` },
        (payload) => callback({ type: 'new_post', payload })
      )
      .subscribe();
      
    this.subscriptions.set(channelName, channel);
    return channel;
  }
  
  unsubscribeFromUser(userId) {
    const channelName = `user-${userId}`;
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }
  
  subscribeToNotifications(userId, callback) {
    const channelName = `notifications-${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromNotifications(userId);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => callback({ type: 'new_notification', payload })
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => callback({ type: 'notification_updated', payload })
      )
      .on('broadcast',
        { event: 'new_notification' },
        (payload) => callback({ type: 'broadcast_notification', payload })
      )
      .subscribe();
      
    this.subscriptions.set(channelName, channel);
    return channel;
  }
  
  unsubscribeFromNotifications(userId) {
    const channelName = `notifications-${userId}`;
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }
  
  subscribeToMessages(conversationId, callback) {
    const channelName = `messages-${conversationId}`;
    
    // Remove existing subscription if any
    this.unsubscribeFromMessages(conversationId);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => callback({ type: 'new_message', payload })
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => callback({ type: 'message_updated', payload })
      )
      .on('broadcast',
        { event: 'typing' },
        (payload) => callback({ type: 'typing_indicator', payload })
      )
      .subscribe();
      
    this.subscriptions.set(channelName, channel);
    return channel;
  }
  
  unsubscribeFromMessages(conversationId) {
    const channelName = `messages-${conversationId}`;
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }
  
  sendTypingIndicator(conversationId, userId, isTyping) {
    const channelName = `messages-${conversationId}`;
    const channel = this.subscriptions.get(channelName);
    
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId, isTyping, timestamp: Date.now() }
      });
    }
  }
  
  unsubscribeAll() {
    this.subscriptions.forEach((channel, channelName) => {
      supabase.removeChannel(channel);
    });
    this.subscriptions.clear();
  }
  
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.keys());
  }
}

// Create singleton instance
export const realTimeManager = new RealTimeManager();
export default RealTimeManager;