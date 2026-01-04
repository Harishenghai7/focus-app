/**
 * SmartPreloader Utility
 * Preloads media based on hover and scroll prediction
 */

class SmartPreloader {
    constructor() {
        this.cache = new Map();
        this.MAX_CACHE_SIZE = 50; // LRU cache limit
        this.preloadQueue = [];
        this.isPreloading = false;
    }

    /**
     * Preload image
     * @param {string} url - Image URL
     * @returns {Promise} - Preload promise
     */
    preloadImage(url) {
        if (this.cache.has(url)) {
            return Promise.resolve(this.cache.get(url));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.addToCache(url, img);
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    /**
     * Preload video
     * @param {string} url - Video URL
     */
    preloadVideo(url) {
        if (this.cache.has(url)) {
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                this.addToCache(url, video);
                resolve();
            };
            video.src = url;
        });
    }

    /**
     * Add to cache with LRU eviction
     */
    addToCache(url, resource) {
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            // Remove oldest entry (LRU)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(url, resource);
    }

    /**
     * Preload post media
     * @param {Object} post - Post object
     */
    async preloadPost(post) {
        if (!post.media_urls || post.media_urls.length === 0) return;

        const mediaType = post.media_types?.[0] || 'image';
        const url = post.media_urls[0];

        try {
            if (mediaType === 'video') {
                await this.preloadVideo(url);
            } else {
                await this.preloadImage(url);
            }
        } catch (error) {
            console.warn('Preload failed:', url, error);
        }
    }

    /**
     * Preload multiple posts
     * @param {Array} posts - Array of posts
     */
    async preloadPosts(posts) {
        if (this.isPreloading) return;

        this.isPreloading = true;
        const promises = posts.map(post => this.preloadPost(post));
        await Promise.allSettled(promises);
        this.isPreloading = false;
    }

    /**
     * Preload on hover
     * @param {Object} post - Post to preload
     */
    onHover(post) {
        // Debounce hover preloading
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => {
            this.preloadPost(post);
        }, 200);
    }

    /**
     * Preload next posts on scroll
     * @param {Array} posts - All posts
     * @param {number} currentIndex - Current post index
     * @param {number} lookahead - Number of posts to preload ahead
     */
    preloadAhead(posts, currentIndex, lookahead = 3) {
        const startIndex = currentIndex + 1;
        const endIndex = Math.min(startIndex + lookahead, posts.length);
        const postsToPreload = posts.slice(startIndex, endIndex);

        this.preloadPosts(postsToPreload);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }
}

// Export singleton instance
export const smartPreloader = new SmartPreloader();
export default smartPreloader;
