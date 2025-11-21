// Push Notifications Utility
class PushNotificationManager {
  constructor() {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.serviceWorkerRegistration = null;
  }

  /**
   * Initialize the push notification manager
   * Registers service worker and sets up push notifications
   */
  async initialize() {
    if (!this.isSupported) {

      return false;
    }

    try {
      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      
      return true;
    } catch (error) {

      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported) {

      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {

        // Initialize service worker if not already done
        if (!this.serviceWorkerRegistration) {
          await this.initialize();
        }
      }
      
      return permission === 'granted';
    } catch (error) {

      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled() {
    return this.permission === 'granted';
  }

  /**
   * Get current permission status
   */
  getPermissionStatus() {
    return this.permission;
  }

  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      return false;
    }

    const defaultOptions = {
      icon: '/focus-logo.png',
      badge: '/focus-logo.png',
      tag: 'focus-notification',
      requireInteraction: false,
      ...options
    };

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, defaultOptions);
      } else {
        new Notification(title, defaultOptions);
      }
      return true;
    } catch (error) {

      return false;
    }
  }

  // Notification types
  async notifyLike(username, postType = 'post') {
    return this.showNotification(
      `${username} liked your ${postType}`,
      {
        body: 'Tap to view',
        icon: '/focus-logo.png',
        tag: 'like-notification',
        data: { type: 'like', username }
      }
    );
  }

  async notifyComment(username, comment, postType = 'post') {
    return this.showNotification(
      `${username} commented on your ${postType}`,
      {
        body: comment.length > 50 ? comment.substring(0, 50) + '...' : comment,
        icon: '/focus-logo.png',
        tag: 'comment-notification',
        data: { type: 'comment', username, comment }
      }
    );
  }

  async notifyFollow(username) {
    return this.showNotification(
      `${username} started following you`,
      {
        body: 'Tap to view their profile',
        icon: '/focus-logo.png',
        tag: 'follow-notification',
        data: { type: 'follow', username }
      }
    );
  }

  async notifyMessage(username, message) {
    return this.showNotification(
      `New message from ${username}`,
      {
        body: message.length > 50 ? message.substring(0, 50) + '...' : message,
        icon: '/focus-logo.png',
        tag: 'message-notification',
        data: { type: 'message', username, message }
      }
    );
  }

  async notifyFollowRequest(username) {
    return this.showNotification(
      `${username} wants to follow you`,
      {
        body: 'Tap to view request',
        icon: '/focus-logo.png',
        tag: 'follow-request-notification',
        data: { type: 'follow_request', username }
      }
    );
  }

  // In-app notification banner
  showInAppNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `in-app-notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
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
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation styles
    if (!document.getElementById('notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .notification-close {
          background: none;
          border: none;
          color: white;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto remove after duration
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);

    return notification;
  }
}

// Create singleton instance
const pushNotifications = new PushNotificationManager();

export default pushNotifications;