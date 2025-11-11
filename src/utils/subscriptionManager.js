// Subscription manager to prevent memory leaks
import { logError } from './errorLogger';

class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.maxSubscriptions = 5; // Limit to 5 concurrent subscriptions as per requirement
    this.cleanupInterval = null;
    this.batchQueue = [];
    this.batchTimer = null;
    this.batchDelay = 100; // Batch updates every 100ms
    this.startCleanupMonitoring();
  }

  // Add a subscription with automatic cleanup
  add(key, subscription, metadata = {}) {
    // Check if we're at max subscriptions
    if (this.subscriptions.size >= this.maxSubscriptions) {
      this.cleanupOldest();
    }

    // Unsubscribe existing subscription with same key
    if (this.subscriptions.has(key)) {
      this.remove(key);
    }

    // Store subscription with metadata
    this.subscriptions.set(key, {
      subscription,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      metadata: {
        ...metadata,
        key
      }
    });
    return () => this.remove(key);
  }

  // Remove and unsubscribe
  remove(key) {
    const sub = this.subscriptions.get(key);
    if (sub) {
      try {
        // Try different unsubscribe methods
        if (typeof sub.subscription?.unsubscribe === 'function') {
          sub.subscription.unsubscribe();
        } else if (typeof sub.subscription === 'function') {
          sub.subscription();
        } else if (sub.subscription?.remove) {
          sub.subscription.remove();
        }
        
        this.subscriptions.delete(key);
      } catch (error) {
        logError(error, { context: 'subscription_cleanup', key });
        this.subscriptions.delete(key);
      }
    }
  }

  // Update last activity timestamp
  updateActivity(key) {
    const sub = this.subscriptions.get(key);
    if (sub) {
      sub.lastActivity = Date.now();
    }
  }

  // Remove all subscriptions
  removeAll() {
    const keys = Array.from(this.subscriptions.keys());
    keys.forEach(key => this.remove(key));
  }

  // Remove subscriptions by pattern
  removeByPattern(pattern) {
    const keys = Array.from(this.subscriptions.keys());
    const matchingKeys = keys.filter(key => 
      typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)
    );
    matchingKeys.forEach(key => this.remove(key));
  }

  // Cleanup oldest subscription (with priority consideration)
  cleanupOldest() {
    if (this.subscriptions.size === 0) return;

    // Try priority-based cleanup first
    const hasPriorities = Array.from(this.subscriptions.values())
      .some(sub => sub.metadata.priority !== undefined);
    
    if (hasPriorities) {
      this.cleanupByPriority();
      return;
    }

    // Fallback to oldest subscription
    let oldestKey = null;
    let oldestTime = Infinity;

    this.subscriptions.forEach((sub, key) => {
      if (sub.lastActivity < oldestTime) {
        oldestTime = sub.lastActivity;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.remove(oldestKey);
    }
  }

  // Cleanup inactive subscriptions
  cleanupInactive(maxInactiveMs = 300000) { // 5 minutes default
    const now = Date.now();
    const inactiveKeys = [];

    this.subscriptions.forEach((sub, key) => {
      if (now - sub.lastActivity > maxInactiveMs) {
        inactiveKeys.push(key);
      }
    });

    if (inactiveKeys.length > 0) {
      inactiveKeys.forEach(key => this.remove(key));
    }
  }

  // Start monitoring for memory leaks
  startCleanupMonitoring() {
    // Check every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactive();
      this.cleanupInactiveChannels();
      this.checkMemoryUsage();
      
      // Log stats in development
      if (process.env.NODE_ENV === 'development') {
        this.logStats();
      }
    }, 120000);
  }

  // Stop monitoring
  stopCleanupMonitoring() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Check memory usage
  checkMemoryUsage() {
    if (performance.memory) {
      const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
      const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

      if (usagePercent > 90) {
        // Aggressive cleanup if memory is critical
        if (usagePercent > 95) {
          this.cleanupInactive(60000); // Cleanup subscriptions inactive for 1 minute
        }
      }
    }
  }

  // Get subscription info
  getInfo() {
    const subscriptions = Array.from(this.subscriptions.entries()).map(([key, sub]) => ({
      key,
      age: Date.now() - sub.createdAt,
      inactive: Date.now() - sub.lastActivity,
      metadata: sub.metadata
    }));

    return {
      total: this.subscriptions.size,
      max: this.maxSubscriptions,
      subscriptions
    };
  }

  // Get subscription by key
  get(key) {
    return this.subscriptions.get(key);
  }

  // Check if subscription exists
  has(key) {
    return this.subscriptions.has(key);
  }

  // Set max subscriptions
  setMaxSubscriptions(max) {
    this.maxSubscriptions = max;
    
    // Cleanup if over limit
    while (this.subscriptions.size > this.maxSubscriptions) {
      this.cleanupOldest();
    }
  }

  // ============================================================================
  // BATCHING FUNCTIONALITY
  // ============================================================================

  /**
   * Add update to batch queue
   * @param {string} key - Subscription key
   * @param {*} data - Update data
   */
  queueUpdate(key, data) {
    this.batchQueue.push({ key, data, timestamp: Date.now() });
    
    // Start batch timer if not already running
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.batchDelay);
    }
  }

  /**
   * Process batched updates
   */
  processBatch() {
    if (this.batchQueue.length === 0) {
      this.batchTimer = null;
      return;
    }

    // Group updates by key
    const groupedUpdates = new Map();
    
    this.batchQueue.forEach(({ key, data, timestamp }) => {
      if (!groupedUpdates.has(key)) {
        groupedUpdates.set(key, []);
      }
      groupedUpdates.get(key).push({ data, timestamp });
    });

    // Process grouped updates
    groupedUpdates.forEach((updates, key) => {
      const sub = this.subscriptions.get(key);
      if (sub && sub.metadata.onBatchUpdate) {
        try {
          sub.metadata.onBatchUpdate(updates);
          this.updateActivity(key);
        } catch (error) {
          logError(error, { context: 'batch_update', key });
        }
      }
    });

    // Clear queue
    this.batchQueue = [];
    this.batchTimer = null;
  }

  /**
   * Force process batch immediately
   */
  flushBatch() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.processBatch();
    }
  }

  // ============================================================================
  // PRIORITY MANAGEMENT
  // ============================================================================

  /**
   * Set subscription priority
   * @param {string} key - Subscription key
   * @param {number} priority - Priority level (higher = more important)
   */
  setPriority(key, priority) {
    const sub = this.subscriptions.get(key);
    if (sub) {
      sub.metadata.priority = priority;
    }
  }

  /**
   * Cleanup lowest priority subscriptions first
   */
  cleanupByPriority() {
    if (this.subscriptions.size === 0) return;

    const subscriptionsArray = Array.from(this.subscriptions.entries());
    
    // Sort by priority (lowest first) and age (oldest first)
    subscriptionsArray.sort((a, b) => {
      const priorityA = a[1].metadata.priority || 0;
      const priorityB = b[1].metadata.priority || 0;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return a[1].lastActivity - b[1].lastActivity;
    });

    // Remove lowest priority subscription
    const [keyToRemove] = subscriptionsArray[0];
    this.remove(keyToRemove);
  }

  // ============================================================================
  // CHANNEL MANAGEMENT
  // ============================================================================

  /**
   * Get all subscriptions for a specific channel
   */
  getChannelSubscriptions(channel) {
    const channelSubs = [];
    
    this.subscriptions.forEach((sub, key) => {
      if (sub.metadata.channel === channel) {
        channelSubs.push({ key, ...sub });
      }
    });
    
    return channelSubs;
  }

  /**
   * Unsubscribe from inactive channels
   */
  cleanupInactiveChannels(maxInactiveMs = 300000) {
    const now = Date.now();
    const channelActivity = new Map();
    
    // Track channel activity
    this.subscriptions.forEach((sub, key) => {
      const channel = sub.metadata.channel;
      if (channel) {
        const currentActivity = channelActivity.get(channel) || 0;
        channelActivity.set(channel, Math.max(currentActivity, sub.lastActivity));
      }
    });
    
    // Find inactive channels
    const inactiveChannels = [];
    channelActivity.forEach((lastActivity, channel) => {
      if (now - lastActivity > maxInactiveMs) {
        inactiveChannels.push(channel);
      }
    });
    
    // Remove subscriptions for inactive channels
    if (inactiveChannels.length > 0) {
      inactiveChannels.forEach(channel => {
        this.removeByPattern(channel);
      });
    }
  }

  // ============================================================================
  // STATISTICS AND MONITORING
  // ============================================================================

  /**
   * Get detailed statistics
   */
  getDetailedStats() {
    const stats = {
      total: this.subscriptions.size,
      max: this.maxSubscriptions,
      utilizationPercent: (this.subscriptions.size / this.maxSubscriptions) * 100,
      batchQueueSize: this.batchQueue.length,
      channels: new Map(),
      components: new Map(),
      priorities: new Map()
    };

    this.subscriptions.forEach((sub, key) => {
      // Track by channel
      const channel = sub.metadata.channel || 'unknown';
      stats.channels.set(channel, (stats.channels.get(channel) || 0) + 1);
      
      // Track by component
      const component = sub.metadata.component || 'unknown';
      stats.components.set(component, (stats.components.get(component) || 0) + 1);
      
      // Track by priority
      const priority = sub.metadata.priority || 0;
      stats.priorities.set(priority, (stats.priorities.get(priority) || 0) + 1);
    });

    return stats;
  }

  /**
   * Log subscription statistics
   */
  logStats() {
    const stats = this.getDetailedStats();console.groupEnd();
  }
}

// Create singleton instance
const subscriptionManager = new SubscriptionManager();

// React hook for managing subscriptions
export const useSubscription = (key, subscriptionFn, dependencies = []) => {
  const React = require('react');
  
  React.useEffect(() => {
    let subscription = null;
    let cleanup = null;

    const setup = async () => {
      try {
        subscription = await subscriptionFn();
        
        if (subscription) {
          cleanup = subscriptionManager.add(key, subscription, {
            component: 'useSubscription',
            dependencies: dependencies.length
          });
        }
      } catch (error) {
        logError(error, { context: 'useSubscription', key });
      }
    };

    setup();

    // Cleanup on unmount or dependency change
    return () => {
      if (cleanup) {
        cleanup();
      } else if (subscription) {
        subscriptionManager.remove(key);
      }
    };
  }, dependencies);

  // Update activity on render
  React.useEffect(() => {
    subscriptionManager.updateActivity(key);
  });
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    subscriptionManager.removeAll();
  });

  // Cleanup on visibility change (tab hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Cleanup inactive subscriptions when tab is hidden
      setTimeout(() => {
        if (document.hidden) {
          subscriptionManager.cleanupInactive(60000);
        }
      }, 60000); // After 1 minute of being hidden
    }
  });
}

// Export functions
export const addSubscription = (key, subscription, metadata) => 
  subscriptionManager.add(key, subscription, metadata);

export const removeSubscription = (key) => 
  subscriptionManager.remove(key);

export const removeAllSubscriptions = () => 
  subscriptionManager.removeAll();

export const removeSubscriptionsByPattern = (pattern) => 
  subscriptionManager.removeByPattern(pattern);

export const getSubscriptionInfo = () => 
  subscriptionManager.getInfo();

export const updateSubscriptionActivity = (key) => 
  subscriptionManager.updateActivity(key);

// New exports for enhanced features
export const queueUpdate = (key, data) => 
  subscriptionManager.queueUpdate(key, data);

export const flushBatch = () => 
  subscriptionManager.flushBatch();

export const setPriority = (key, priority) => 
  subscriptionManager.setPriority(key, priority);

export const getChannelSubscriptions = (channel) => 
  subscriptionManager.getChannelSubscriptions(channel);

export const getDetailedStats = () => 
  subscriptionManager.getDetailedStats();

export const logSubscriptionStats = () => 
  subscriptionManager.logStats();

export const setMaxSubscriptions = (max) => 
  subscriptionManager.setMaxSubscriptions(max);

export default subscriptionManager;
