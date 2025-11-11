// Offline functionality manager for Focus app
import React from 'react';

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingActions = this.loadPendingActions();
    this.listeners = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
      this.processPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  // Queue actions for when back online
  queueAction(action) {
    const actionWithId = {
      ...action,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    };
    
    this.pendingActions.push(actionWithId);
    this.savePendingActions();
    
    // Show offline notification
    this.showOfflineNotification(action.type);
    
    return actionWithId.id;
  }

  // Process all pending actions when back online with retry logic
  async processPendingActions() {
    if (!this.isOnline || this.pendingActions.length === 0) return;

    const actions = [...this.pendingActions];
    this.pendingActions = [];
    this.savePendingActions();

    const results = await Promise.allSettled(
      actions.map(action => this.executeActionWithRetry(action))
    );

    // Handle results
    results.forEach((result, index) => {
      const action = actions[index];
      
      if (result.status === 'fulfilled') {
        this.showSuccessNotification(action.type);
      } else {

        // Re-queue failed actions with retry count
        const retryCount = (action.retryCount || 0) + 1;
        
        if (retryCount < 3) {
          this.pendingActions.push({
            ...action,
            retryCount,
            lastAttempt: Date.now()
          });
        } else {

          this.showNotification(
            `Failed to sync ${action.type}. Please try again manually.`,
            'error'
          );
        }
      }
    });

    this.savePendingActions();
    this.updateLastSync();
  }

  // Execute action with exponential backoff retry
  async executeActionWithRetry(action, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        await this.executeAction(action);
        return; // Success
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries - 1) {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  async executeAction(action) {
    try {
      const { supabase } = await import('../supabaseClient');
      
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      switch (action.type) {
      case 'like':
        return await supabase
          .from('likes')
          .insert({
            user_id: action.userId,
            content_id: action.contentId,
            content_type: action.contentType
          });

      case 'unlike':
        return await supabase
          .from('likes')
          .delete()
          .eq('user_id', action.userId)
          .eq('content_id', action.contentId)
          .eq('content_type', action.contentType);

      case 'comment':
        return await supabase
          .from('comments')
          .insert({
            user_id: action.userId,
            content_id: action.contentId,
            content_type: action.contentType,
            text: action.text
          });

      case 'follow':
        return await supabase
          .from('follows')
          .insert({
            follower_id: action.followerId,
            following_id: action.followingId
          });

      case 'unfollow':
        return await supabase
          .from('follows')
          .delete()
          .eq('follower_id', action.followerId)
          .eq('following_id', action.followingId);

      case 'message':
        return await supabase
          .from('messages')
          .insert({
            sender_id: action.senderId,
            receiver_id: action.receiverId,
            content: action.content,
            message_type: action.messageType || 'text'
          });

      default:
        throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {

      throw error;
    }
  }

  // Cache management
  cacheData(key, data, ttl = 3600000) { // 1 hour default TTL
    const cacheItem = {
      data,
      timestamp: Date.now(),
      ttl
    };
    localStorage.setItem(`focus_cache_${key}`, JSON.stringify(cacheItem));
  }

  getCachedData(key) {
    try {
      const cached = localStorage.getItem(`focus_cache_${key}`);
      if (!cached) return null;

      const { data, timestamp, ttl } = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(`focus_cache_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  clearCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('focus_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Optimistic UI updates
  optimisticUpdate(key, updateFn) {
    const cached = this.getCachedData(key);
    if (cached) {
      const updated = updateFn(cached);
      this.cacheData(key, updated);
      return updated;
    }
    return null;
  }

  // Persistence
  loadPendingActions() {
    try {
      const stored = localStorage.getItem('focus_pending_actions');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      return [];
    }
  }

  savePendingActions() {
    localStorage.setItem('focus_pending_actions', JSON.stringify(this.pendingActions));
  }

  // Notifications
  showOfflineNotification(actionType) {
    const messages = {
      like: 'Like saved. Will sync when online.',
      comment: 'Comment saved. Will post when online.',
      follow: 'Follow request saved. Will send when online.',
      message: 'Message saved. Will send when online.'
    };

    this.showNotification(messages[actionType] || 'Action saved for later.', 'info');
  }

  showSuccessNotification(actionType) {
    const messages = {
      like: 'Like synced successfully!',
      comment: 'Comment posted successfully!',
      follow: 'Follow request sent!',
      message: 'Message sent successfully!'
    };

    this.showNotification(messages[actionType] || 'Action completed!', 'success');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `offline-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      max-width: 300px;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    // Auto remove
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 3000);
  }

  // Event listeners
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => callback(event, this.isOnline));
  }

  // Public API
  getStatus() {
    return {
      isOnline: this.isOnline,
      pendingActions: this.pendingActions.length,
      lastSync: localStorage.getItem('focus_last_sync')
    };
  }

  updateLastSync() {
    localStorage.setItem('focus_last_sync', new Date().toISOString());
  }
}

// Create singleton instance
const offlineManager = new OfflineManager();

// React hook for offline functionality
export const useOffline = () => {
  const [isOnline, setIsOnline] = React.useState(offlineManager.isOnline);
  const [pendingActions, setPendingActions] = React.useState(offlineManager.pendingActions.length);

  React.useEffect(() => {
    const unsubscribe = offlineManager.subscribe((event, online) => {
      setIsOnline(online);
      setPendingActions(offlineManager.pendingActions.length);
    });

    return unsubscribe;
  }, []);

  return {
    isOnline,
    pendingActions,
    queueAction: offlineManager.queueAction.bind(offlineManager),
    cacheData: offlineManager.cacheData.bind(offlineManager),
    getCachedData: offlineManager.getCachedData.bind(offlineManager),
    optimisticUpdate: offlineManager.optimisticUpdate.bind(offlineManager),
    getStatus: offlineManager.getStatus.bind(offlineManager)
  };
};

export default offlineManager;