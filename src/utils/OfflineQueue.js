/**
 * OfflineQueue Utility
 * Manages offline action queue with 50 action limit and auto-sync
 */

class OfflineQueue {
    constructor() {
        this.MAX_QUEUE_SIZE = 50;
        this.STORAGE_KEY = 'focus_offline_queue';
        this.queue = this.loadQueue();
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;

        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    /**
     * Load queue from localStorage
     */
    loadQueue() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Save queue to localStorage
     */
    saveQueue() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.queue));
        } catch (error) {
            console.error('Failed to save offline queue:', error);
        }
    }

    /**
     * Add action to queue
     * @param {Object} action - Action to queue
     * @returns {boolean} - Success status
     */
    enqueue(action) {
        if (this.queue.length >= this.MAX_QUEUE_SIZE) {
            console.warn('Offline queue is full');
            return false;
        }

        const queuedAction = {
            id: `offline_${Date.now()}_${Math.random()}`,
            ...action,
            timestamp: Date.now(),
            retries: 0
        };

        this.queue.push(queuedAction);
        this.saveQueue();
        return true;
    }

    /**
     * Get queue size
     */
    getQueueSize() {
        return this.queue.length;
    }

    /**
     * Check if queue is full
     */
    isFull() {
        return this.queue.length >= this.MAX_QUEUE_SIZE;
    }

    /**
     * Clear queue
     */
    clear() {
        this.queue = [];
        this.saveQueue();
    }

    /**
     * Handle online event
     */
    async handleOnline() {
        this.isOnline = true;
        console.log('📶 Back online! Syncing queued actions...');
        await this.syncQueue();
    }

    /**
     * Handle offline event
     */
    handleOffline() {
        this.isOnline = false;
        console.log('📴 Offline mode activated');
    }

    /**
     * Sync queued actions
     */
    async syncQueue() {
        if (this.syncInProgress || this.queue.length === 0) return;

        this.syncInProgress = true;
        const actionsToSync = [...this.queue];
        let successCount = 0;
        let failedActions = [];

        for (const action of actionsToSync) {
            try {
                await this.executeAction(action);
                successCount++;
            } catch (error) {
                console.error('Failed to sync action:', error);

                // Retry logic with exponential backoff
                action.retries = (action.retries || 0) + 1;
                if (action.retries < 3) {
                    failedActions.push(action);
                } else {
                    console.error('Action failed after 3 retries:', action);
                }
            }
        }

        // Update queue with failed actions
        this.queue = failedActions;
        this.saveQueue();
        this.syncInProgress = false;

        console.log(`✅ Synced ${successCount}/${actionsToSync.length} actions`);
        return { successCount, failedCount: failedActions.length };
    }

    /**
     * Execute a queued action
     * @param {Object} action - Action to execute
     */
    async executeAction(action) {
        const { type, payload } = action;

        switch (type) {
            case 'like':
                return await this.executeLike(payload);
            case 'save':
                return await this.executeSave(payload);
            case 'comment':
                return await this.executeComment(payload);
            case 'share':
                return await this.executeShare(payload);
            default:
                throw new Error(`Unknown action type: ${type}`);
        }
    }

    /**
     * Execute like action
     */
    async executeLike(payload) {
        const { supabase } = await import('../lib/supabase');
        const { postId, userId, isLike } = payload;

        if (isLike) {
            const { error } = await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: userId });
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .match({ post_id: postId, user_id: userId });
            if (error) throw error;
        }
    }

    /**
     * Execute save action
     */
    async executeSave(payload) {
        const { supabase } = await import('../lib/supabase');
        const { postId, userId, isSave } = payload;

        if (isSave) {
            const { error } = await supabase
                .from('post_saves')
                .insert({ post_id: postId, user_id: userId });
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('post_saves')
                .delete()
                .match({ post_id: postId, user_id: userId });
            if (error) throw error;
        }
    }

    /**
     * Execute comment action
     */
    async executeComment(payload) {
        const { supabase } = await import('../lib/supabase');
        const { postId, userId, content } = payload;

        const { error } = await supabase
            .from('post_comments')
            .insert({ post_id: postId, user_id: userId, content });
        if (error) throw error;
    }

    /**
     * Execute share action
     */
    async executeShare(payload) {
        const { supabase } = await import('../lib/supabase');
        const { postId, shareType } = payload;

        const { error } = await supabase.rpc('increment_post_shares', {
            post_uuid: postId,
            increment_value: 1
        });
        if (error) throw error;
    }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();
export default offlineQueue;
