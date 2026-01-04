/**
 * UndoManager Utility
 * Manages undo operations with configurable timeout window
 */

class UndoManager {
    constructor() {
        this.queue = [];
        this.defaultTimeout = 3000; // Default 3 seconds
    }

    /**
     * Execute an action with undo capability
     * @param {Function} action - The action to execute
     * @param {Function} undoAction - The undo action
     * @param {Object} options - Configuration options
     * @returns {Object} - Undo control object
     */
    executeWithUndo(action, undoAction, options = {}) {
        const {
            timeout = this.defaultTimeout,
            onUndo = () => { },
            onTimeout = () => { },
            metadata = {}
        } = options;

        // Execute the action immediately
        const actionResult = action();

        // Create undo item
        const undoItem = {
            id: `undo_${Date.now()}_${Math.random()}`,
            undoAction,
            metadata,
            timestamp: Date.now(),
            timeoutId: null,
            onUndo,
            onTimeout
        };

        // Set timeout to auto-commit
        undoItem.timeoutId = setTimeout(() => {
            this.commit(undoItem.id);
            onTimeout();
        }, timeout);

        // Add to queue
        this.queue.push(undoItem);

        // Return control object
        return {
            id: undoItem.id,
            undo: () => this.undo(undoItem.id),
            cancel: () => this.commit(undoItem.id)
        };
    }

    /**
     * Undo a specific action
     * @param {string} id - The undo item ID
     */
    undo(id) {
        const index = this.queue.findIndex(item => item.id === id);
        if (index === -1) return false;

        const item = this.queue[index];

        // Clear timeout
        if (item.timeoutId) {
            clearTimeout(item.timeoutId);
        }

        // Execute undo action
        item.undoAction();
        item.onUndo();

        // Remove from queue
        this.queue.splice(index, 1);

        return true;
    }

    /**
     * Commit an action (remove from undo queue)
     * @param {string} id - The undo item ID
     */
    commit(id) {
        const index = this.queue.findIndex(item => item.id === id);
        if (index === -1) return false;

        const item = this.queue[index];

        // Clear timeout
        if (item.timeoutId) {
            clearTimeout(item.timeoutId);
        }

        // Remove from queue
        this.queue.splice(index, 1);

        return true;
    }

    /**
     * Clear all pending undo actions
     */
    clearAll() {
        this.queue.forEach(item => {
            if (item.timeoutId) {
                clearTimeout(item.timeoutId);
            }
        });
        this.queue = [];
    }

    /**
     * Get pending undo count
     */
    getPendingCount() {
        return this.queue.length;
    }

    /**
     * Set default timeout
     * @param {number} timeout - Timeout in milliseconds
     */
    setDefaultTimeout(timeout) {
        this.defaultTimeout = timeout;
    }
}

// Export singleton instance
export const undoManager = new UndoManager();
export default undoManager;
