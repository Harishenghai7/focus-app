/**
 * State Deduplicator - Prevents duplicate state updates and race conditions
 */
class StateDeduplicator {
  constructor() {
    this.pendingUpdates = new Map();
    this.recentUpdates = new Map();
    this.updateQueue = [];
    this.isProcessing = false;
  }

  // Deduplicate like actions
  debounceLike(postId, liked, callback) {
    const key = `like-${postId}`;
    
    // Clear existing timeout
    if (this.pendingUpdates.has(key)) {
      clearTimeout(this.pendingUpdates.get(key));
    }
    
    // Set new timeout
    const timeoutId = setTimeout(() => {
      this.pendingUpdates.delete(key);
      callback(postId, liked);
    }, 300); // 300ms debounce
    
    this.pendingUpdates.set(key, timeoutId);
  }

  // Deduplicate follow actions
  debounceFollow(userId, following, callback) {
    const key = `follow-${userId}`;
    
    if (this.pendingUpdates.has(key)) {
      clearTimeout(this.pendingUpdates.get(key));
    }
    
    const timeoutId = setTimeout(() => {
      this.pendingUpdates.delete(key);
      callback(userId, following);
    }, 500); // 500ms debounce for follows
    
    this.pendingUpdates.set(key, timeoutId);
  }

  // Check if update is duplicate
  isDuplicateUpdate(type, id, value) {
    const key = `${type}-${id}`;
    const recent = this.recentUpdates.get(key);
    
    if (recent && recent.value === value && (Date.now() - recent.timestamp) < 2000) {
      return true;
    }
    
    this.recentUpdates.set(key, {
      value,
      timestamp: Date.now()
    });
    
    return false;
  }

  // Queue state updates to prevent race conditions
  queueUpdate(updateFn) {
    this.updateQueue.push(updateFn);
    
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    this.isProcessing = true;
    
    while (this.updateQueue.length > 0) {
      const updateFn = this.updateQueue.shift();
      try {
        await updateFn();
      } catch (error) {
        console.error('State update error:', error);
      }
      
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.isProcessing = false;
  }

  // Clean up old entries
  cleanup() {
    const now = Date.now();
    const maxAge = 10000; // 10 seconds
    
    for (const [key, update] of this.recentUpdates.entries()) {
      if (now - update.timestamp > maxAge) {
        this.recentUpdates.delete(key);
      }
    }
  }

  // Clear all pending updates
  clearAll() {
    for (const timeoutId of this.pendingUpdates.values()) {
      clearTimeout(timeoutId);
    }
    this.pendingUpdates.clear();
    this.recentUpdates.clear();
    this.updateQueue.length = 0;
  }
}

// Create singleton instance
export const stateDeduplicator = new StateDeduplicator();

// Auto cleanup every 30 seconds
setInterval(() => {
  stateDeduplicator.cleanup();
}, 30000);

export default StateDeduplicator;