/**
 * Notification utilities
 */

export const requestPermission = async () => {
  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications');
  }
  
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
};

export const hasPermission = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};

export const isSupported = () => {
  return 'Notification' in window;
};

export const showNotification = (title, options = {}) => {
  if (!hasPermission()) {
    console.warn('Notification permission not granted');
    return null;
  }
  
  const defaultOptions = {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default',
    renotify: false,
    requireInteraction: false,
    silent: false
  };
  
  const notification = new Notification(title, { ...defaultOptions, ...options });
  
  return notification;
};

export const showPersistentNotification = async (title, options = {}) => {
  if (!('serviceWorker' in navigator) || !hasPermission()) {
    return showNotification(title, options);
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'default',
      renotify: false,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      actions: []
    };
    
    return registration.showNotification(title, { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Failed to show persistent notification:', error);
    return showNotification(title, options);
  }
};

export const createNotificationAction = (action, title, icon = null) => {
  return { action, title, icon };
};

export const scheduleNotification = (title, options = {}, delay = 0) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const notification = showNotification(title, options);
      resolve(notification);
    }, delay);
  });
};

export const createNotificationGroup = () => {
  const notifications = new Map();
  
  return {
    add: (id, title, options = {}) => {
      const notification = showNotification(title, {
        ...options,
        tag: id
      });
      
      if (notification) {
        notifications.set(id, notification);
      }
      
      return notification;
    },
    
    remove: (id) => {
      const notification = notifications.get(id);
      if (notification) {
        notification.close();
        notifications.delete(id);
      }
    },
    
    removeAll: () => {
      notifications.forEach(notification => notification.close());
      notifications.clear();
    },
    
    get: (id) => {
      return notifications.get(id);
    },
    
    has: (id) => {
      return notifications.has(id);
    },
    
    size: () => {
      return notifications.size;
    }
  };
};

export const createNotificationQueue = (maxConcurrent = 3, delay = 1000) => {
  const queue = [];
  const active = new Set();
  let processing = false;
  
  const processQueue = async () => {
    if (processing || queue.length === 0 || active.size >= maxConcurrent) {
      return;
    }
    
    processing = true;
    
    while (queue.length > 0 && active.size < maxConcurrent) {
      const { title, options, resolve } = queue.shift();
      
      const notification = showNotification(title, options);
      
      if (notification) {
        active.add(notification);
        
        const cleanup = () => {
          active.delete(notification);
          processQueue();
        };
        
        notification.addEventListener('close', cleanup);
        notification.addEventListener('click', cleanup);
        
        setTimeout(cleanup, options.duration || 5000);
      }
      
      resolve(notification);
      
      if (queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    processing = false;
  };
  
  return {
    add: (title, options = {}) => {
      return new Promise((resolve) => {
        queue.push({ title, options, resolve });
        processQueue();
      });
    },
    
    clear: () => {
      queue.length = 0;
      active.forEach(notification => notification.close());
      active.clear();
    },
    
    size: () => queue.length,
    active: () => active.size
  };
};

export const vibrate = (pattern = [200, 100, 200]) => {
  if ('vibrate' in navigator) {
    return navigator.vibrate(pattern);
  }
  return false;
};

export const playNotificationSound = (soundUrl = '/notification.mp3', volume = 0.5) => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = Math.max(0, Math.min(1, volume));
    return audio.play();
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    return Promise.reject(error);
  }
};

export const createNotificationTemplate = (type) => {
  const templates = {
    message: {
      icon: '/icons/message.png',
      badge: '/icons/message-badge.png',
      requireInteraction: true,
      actions: [
        createNotificationAction('reply', 'Reply'),
        createNotificationAction('mark-read', 'Mark as Read')
      ]
    },
    
    like: {
      icon: '/icons/heart.png',
      badge: '/icons/heart-badge.png',
      requireInteraction: false
    },
    
    follow: {
      icon: '/icons/user.png',
      badge: '/icons/user-badge.png',
      requireInteraction: false,
      actions: [
        createNotificationAction('view-profile', 'View Profile'),
        createNotificationAction('follow-back', 'Follow Back')
      ]
    },
    
    comment: {
      icon: '/icons/comment.png',
      badge: '/icons/comment-badge.png',
      requireInteraction: true,
      actions: [
        createNotificationAction('reply', 'Reply'),
        createNotificationAction('view-post', 'View Post')
      ]
    },
    
    system: {
      icon: '/icons/system.png',
      badge: '/icons/system-badge.png',
      requireInteraction: false,
      silent: true
    }
  };
  
  return templates[type] || {};
};

export const formatNotificationText = (text, maxLength = 100) => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - 3) + '...';
};

export const getNotificationSettings = () => {
  if (!isSupported()) {
    return {
      supported: false,
      permission: 'unsupported'
    };
  }
  
  return {
    supported: true,
    permission: Notification.permission,
    maxActions: Notification.maxActions || 2
  };
};

export const testNotification = () => {
  return showNotification('Test Notification', {
    body: 'This is a test notification to verify everything is working correctly.',
    icon: '/favicon.ico',
    tag: 'test',
    requireInteraction: false
  });
};

export const createInAppNotification = (message, type = 'info', duration = 5000) => {
  const notification = document.createElement('div');
  notification.className = `in-app-notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `;
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    max-width: 400px;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  const closeButton = notification.querySelector('.notification-close');
  closeButton.style.cssText = `
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    margin-left: 12px;
    cursor: pointer;
    padding: 0;
  `;
  
  const remove = () => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  };
  
  closeButton.addEventListener('click', remove);
  
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 10);
  
  // Auto remove
  if (duration > 0) {
    setTimeout(remove, duration);
  }
  
  return {
    element: notification,
    remove
  };
};

export const createNotificationCenter = () => {
  const notifications = [];
  const listeners = new Set();
  
  const notify = (notification) => {
    notifications.unshift(notification);
    listeners.forEach(listener => {
      try {
        listener('add', notification);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  };
  
  const markAsRead = (id) => {
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      listeners.forEach(listener => {
        try {
          listener('read', notification);
        } catch (error) {
          console.error('Notification listener error:', error);
        }
      });
    }
  };
  
  const remove = (id) => {
    const index = notifications.findIndex(n => n.id === id);
    if (index > -1) {
      const [notification] = notifications.splice(index, 1);
      listeners.forEach(listener => {
        try {
          listener('remove', notification);
        } catch (error) {
          console.error('Notification listener error:', error);
        }
      });
    }
  };
  
  return {
    add: (title, body, options = {}) => {
      const notification = {
        id: Date.now().toString(),
        title,
        body,
        timestamp: new Date(),
        read: false,
        ...options
      };
      
      notify(notification);
      return notification;
    },
    
    getAll: () => [...notifications],
    getUnread: () => notifications.filter(n => !n.read),
    getById: (id) => notifications.find(n => n.id === id),
    
    markAsRead,
    markAllAsRead: () => {
      notifications.forEach(n => {
        if (!n.read) {
          n.read = true;
        }
      });
      listeners.forEach(listener => {
        try {
          listener('mark-all-read');
        } catch (error) {
          console.error('Notification listener error:', error);
        }
      });
    },
    
    remove,
    clear: () => {
      notifications.length = 0;
      listeners.forEach(listener => {
        try {
          listener('clear');
        } catch (error) {
          console.error('Notification listener error:', error);
        }
      });
    },
    
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    
    count: () => notifications.length,
    unreadCount: () => notifications.filter(n => !n.read).length
  };
};

export default {
  requestPermission,
  hasPermission,
  isSupported,
  showNotification,
  showPersistentNotification,
  createNotificationAction,
  scheduleNotification,
  createNotificationGroup,
  createNotificationQueue,
  vibrate,
  playNotificationSound,
  createNotificationTemplate,
  formatNotificationText,
  getNotificationSettings,
  testNotification,
  createInAppNotification,
  createNotificationCenter
};
