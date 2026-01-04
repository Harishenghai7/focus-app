/**
 * BatchActions Utility
 * Manages batch operations on multiple posts
 */

class BatchActions {
    constructor() {
        this.selectedPosts = new Set();
        this.batchMode = false;
        this.listeners = [];
    }

    /**
     * Toggle batch mode
     */
    toggleBatchMode() {
        this.batchMode = !this.batchMode;
        if (!this.batchMode) {
            this.clearSelection();
        }
        this.notifyListeners();
        return this.batchMode;
    }

    /**
     * Check if batch mode is active
     */
    isBatchMode() {
        return this.batchMode;
    }

    /**
     * Toggle post selection
     * @param {string} postId - Post ID
     */
    togglePost(postId) {
        if (this.selectedPosts.has(postId)) {
            this.selectedPosts.delete(postId);
        } else {
            this.selectedPosts.add(postId);
        }
        this.notifyListeners();
    }

    /**
     * Check if post is selected
     * @param {string} postId - Post ID
     */
    isSelected(postId) {
        return this.selectedPosts.has(postId);
    }

    /**
     * Select all posts
     * @param {Array} postIds - Array of post IDs
     */
    selectAll(postIds) {
        postIds.forEach(id => this.selectedPosts.add(id));
        this.notifyListeners();
    }

    /**
     * Clear selection
     */
    clearSelection() {
        this.selectedPosts.clear();
        this.notifyListeners();
    }

    /**
     * Get selected posts
     */
    getSelectedPosts() {
        return Array.from(this.selectedPosts);
    }

    /**
     * Get selection count
     */
    getSelectionCount() {
        return this.selectedPosts.size;
    }

    /**
     * Batch save posts
     * @param {Function} saveFn - Save function
     */
    async batchSave(saveFn) {
        const postIds = this.getSelectedPosts();
        const results = await Promise.allSettled(
            postIds.map(postId => saveFn(postId))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        this.clearSelection();

        return { successCount, totalCount: postIds.length };
    }

    /**
     * Batch delete posts
     * @param {Function} deleteFn - Delete function
     */
    async batchDelete(deleteFn) {
        const postIds = this.getSelectedPosts();
        const results = await Promise.allSettled(
            postIds.map(postId => deleteFn(postId))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        this.clearSelection();

        return { successCount, totalCount: postIds.length };
    }

    /**
     * Batch share posts
     * @param {Function} shareFn - Share function
     * @param {string} shareType - Share type
     */
    async batchShare(shareFn, shareType) {
        const postIds = this.getSelectedPosts();
        const results = await Promise.allSettled(
            postIds.map(postId => shareFn(postId, shareType))
        );

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        this.clearSelection();

        return { successCount, totalCount: postIds.length };
    }

    /**
     * Add listener for selection changes
     * @param {Function} listener - Listener function
     */
    addListener(listener) {
        this.listeners.push(listener);
        return () => this.removeListener(listener);
    }

    /**
     * Remove listener
     * @param {Function} listener - Listener function
     */
    removeListener(listener) {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    /**
     * Notify all listeners
     */
    notifyListeners() {
        this.listeners.forEach(listener => listener({
            batchMode: this.batchMode,
            selectedCount: this.getSelectionCount(),
            selectedPosts: this.getSelectedPosts()
        }));
    }
}

// Export singleton instance
export const batchActions = new BatchActions();
export default batchActions;
