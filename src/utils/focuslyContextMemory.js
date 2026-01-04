/**
 * Focusly Context Memory
 * Stores user interaction history, preferences, and mood tracking locally
 */

const STORAGE_KEYS = {
    CONVERSATION_HISTORY: 'focusly_conversation_history',
    USER_PREFERENCES: 'focusly_user_preferences',
    MOOD_HISTORY: 'focusly_mood_history',
    INTERACTION_STATS: 'focusly_interaction_stats',
    ONBOARDING_STATUS: 'focusly_onboarding_status',
    LAST_INTERACTION: 'focusly_last_interaction'
};

const MAX_CONVERSATION_HISTORY = 50; // Keep last 50 messages
const MAX_MOOD_HISTORY = 30; // Keep last 30 mood entries

/**
 * Save conversation message
 * @param {Object} message - Message object {role, content, timestamp}
 */
export const saveMessage = (message) => {
    try {
        const history = getConversationHistory();
        history.push({
            ...message,
            timestamp: message.timestamp || Date.now()
        });

        // Keep only recent messages
        const trimmed = history.slice(-MAX_CONVERSATION_HISTORY);
        localStorage.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save message:', error);
    }
};

/**
 * Get conversation history
 * @param {number} limit - Maximum number of messages to return
 * @returns {Array} Conversation history
 */
export const getConversationHistory = (limit = MAX_CONVERSATION_HISTORY) => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATION_HISTORY);
        const history = stored ? JSON.parse(stored) : [];
        return limit ? history.slice(-limit) : history;
    } catch (error) {
        console.error('Failed to get conversation history:', error);
        return [];
    }
};

/**
 * Clear conversation history
 */
export const clearConversationHistory = () => {
    try {
        localStorage.removeItem(STORAGE_KEYS.CONVERSATION_HISTORY);
    } catch (error) {
        console.error('Failed to clear conversation history:', error);
    }
};

/**
 * Save user mood
 * @param {string} mood - Detected mood
 * @param {number} confidence - Confidence score (0-1)
 */
export const saveMood = (mood, confidence = 0.5) => {
    try {
        const history = getMoodHistory();
        history.push({
            mood,
            confidence,
            timestamp: Date.now()
        });

        // Keep only recent moods
        const trimmed = history.slice(-MAX_MOOD_HISTORY);
        localStorage.setItem(STORAGE_KEYS.MOOD_HISTORY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to save mood:', error);
    }
};

/**
 * Get mood history
 * @returns {Array} Mood history
 */
export const getMoodHistory = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.MOOD_HISTORY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to get mood history:', error);
        return [];
    }
};

/**
 * Get current mood (most recent)
 * @returns {Object|null} Current mood
 */
export const getCurrentMood = () => {
    const history = getMoodHistory();
    return history.length > 0 ? history[history.length - 1] : null;
};

/**
 * Get mood trend over time
 * @returns {Object} Mood statistics
 */
export const getMoodTrend = () => {
    const history = getMoodHistory();

    if (history.length === 0) {
        return { dominant: 'neutral', distribution: {} };
    }

    const distribution = {};
    history.forEach(entry => {
        distribution[entry.mood] = (distribution[entry.mood] || 0) + 1;
    });

    const dominant = Object.keys(distribution).reduce((a, b) =>
        distribution[a] > distribution[b] ? a : b
    );

    return {
        dominant,
        distribution,
        recentMoods: history.slice(-5).map(e => e.mood)
    };
};

/**
 * Save user preferences
 * @param {Object} preferences - User preferences
 */
export const savePreferences = (preferences) => {
    try {
        const current = getPreferences();
        const updated = { ...current, ...preferences };
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save preferences:', error);
    }
};

/**
 * Get user preferences
 * @returns {Object} User preferences
 */
export const getPreferences = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
        return stored ? JSON.parse(stored) : getDefaultPreferences();
    } catch (error) {
        console.error('Failed to get preferences:', error);
        return getDefaultPreferences();
    }
};

/**
 * Get default preferences
 * @returns {Object} Default preferences
 */
const getDefaultPreferences = () => ({
    voicePack: 'energetic',
    voiceEnabled: true,
    soundEffectsEnabled: true,
    animationLevel: 'full', // full, reduced, minimal
    autoGreeting: true,
    proactiveTips: true,
    contextMemory: true,
    language: 'en-US'
});

/**
 * Update interaction statistics
 * @param {string} type - Interaction type
 */
export const trackInteraction = (type) => {
    try {
        const stats = getInteractionStats();
        stats.totalInteractions = (stats.totalInteractions || 0) + 1;
        stats[type] = (stats[type] || 0) + 1;
        stats.lastInteraction = Date.now();

        localStorage.setItem(STORAGE_KEYS.INTERACTION_STATS, JSON.stringify(stats));
        localStorage.setItem(STORAGE_KEYS.LAST_INTERACTION, Date.now().toString());
    } catch (error) {
        console.error('Failed to track interaction:', error);
    }
};

/**
 * Get interaction statistics
 * @returns {Object} Interaction stats
 */
export const getInteractionStats = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.INTERACTION_STATS);
        return stored ? JSON.parse(stored) : {
            totalInteractions: 0,
            messages: 0,
            voiceInputs: 0,
            games: 0,
            tips: 0
        };
    } catch (error) {
        console.error('Failed to get interaction stats:', error);
        return { totalInteractions: 0 };
    }
};

/**
 * Get last interaction timestamp
 * @returns {number|null} Timestamp
 */
export const getLastInteraction = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.LAST_INTERACTION);
        return stored ? parseInt(stored, 10) : null;
    } catch (error) {
        console.error('Failed to get last interaction:', error);
        return null;
    }
};

/**
 * Check if user is returning after a break
 * @returns {boolean} True if returning after 1+ hours
 */
export const isReturningUser = () => {
    const lastInteraction = getLastInteraction();
    if (!lastInteraction) return false;

    const hoursSinceLastInteraction = (Date.now() - lastInteraction) / (1000 * 60 * 60);
    return hoursSinceLastInteraction >= 1;
};

/**
 * Save onboarding status
 * @param {Object} status - Onboarding status
 */
export const saveOnboardingStatus = (status) => {
    try {
        const current = getOnboardingStatus();
        const updated = { ...current, ...status };
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_STATUS, JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to save onboarding status:', error);
    }
};

/**
 * Get onboarding status
 * @returns {Object} Onboarding status
 */
export const getOnboardingStatus = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_STATUS);
        return stored ? JSON.parse(stored) : {
            completed: false,
            currentStep: 0,
            skipped: false,
            completedAt: null
        };
    } catch (error) {
        console.error('Failed to get onboarding status:', error);
        return { completed: false, currentStep: 0 };
    }
};

/**
 * Check if this is first visit
 * @returns {boolean} True if first visit
 */
export const isFirstVisit = () => {
    const stats = getInteractionStats();
    return stats.totalInteractions === 0;
};

/**
 * Get context for current page
 * @param {string} pageName - Current page name
 * @returns {Object} Page context
 */
export const getPageContext = (pageName) => {
    const contexts = {
        home: {
            description: 'Home feed with posts from followed users',
            features: ['View posts', 'Like and comment', 'Share content', 'Create new posts'],
            tips: ['Scroll to see more posts', 'Double-tap to like', 'Swipe for quick actions']
        },
        explore: {
            description: 'Discover new content and users',
            features: ['Trending topics', 'Suggested users', 'Popular posts', 'Search'],
            tips: ['Use search to find specific content', 'Follow suggested users', 'Explore trending topics']
        },
        create: {
            description: 'Create and share your content',
            features: ['Text posts', 'Image posts', 'Video posts', 'Boltz videos'],
            tips: ['Add media to make posts engaging', 'Use hashtags for discoverability', 'Tag friends']
        },
        boltz: {
            description: 'Short-form video content',
            features: ['Swipe to browse', 'Like and comment', 'Share videos', 'Create Boltz'],
            tips: ['Swipe up for next video', 'Double-tap to like', 'Hold to pause']
        },
        profile: {
            description: 'Your personal profile and content',
            features: ['View your posts', 'Edit profile', 'Badges and achievements', 'Statistics'],
            tips: ['Tap edit to update profile', 'View your badges', 'Check your stats']
        },
        messages: {
            description: 'Private conversations',
            features: ['Send messages', 'Share media', 'Group chats', 'Voice messages'],
            tips: ['Swipe to reply', 'Long press for options', 'Share photos and videos']
        },
        settings: {
            description: 'Customize your experience',
            features: ['Account settings', 'Privacy controls', 'Notifications', 'Appearance'],
            tips: ['Customize your privacy', 'Manage notifications', 'Change theme']
        },
        notifications: {
            description: 'Stay updated with activity',
            features: ['Likes and comments', 'New followers', 'Mentions', 'Messages'],
            tips: ['Tap to view details', 'Swipe to dismiss', 'Filter by type']
        }
    };

    return contexts[pageName.toLowerCase()] || {
        description: 'Focus app',
        features: [],
        tips: []
    };
};

/**
 * Clear all Focusly data
 */
export const clearAllData = () => {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('Failed to clear data:', error);
    }
};

/**
 * Export all data (for backup/privacy)
 * @returns {Object} All stored data
 */
export const exportData = () => {
    return {
        conversationHistory: getConversationHistory(),
        moodHistory: getMoodHistory(),
        preferences: getPreferences(),
        interactionStats: getInteractionStats(),
        onboardingStatus: getOnboardingStatus(),
        exportedAt: Date.now()
    };
};

/**
 * Import data (from backup)
 * @param {Object} data - Data to import
 */
export const importData = (data) => {
    try {
        if (data.conversationHistory) {
            localStorage.setItem(STORAGE_KEYS.CONVERSATION_HISTORY, JSON.stringify(data.conversationHistory));
        }
        if (data.moodHistory) {
            localStorage.setItem(STORAGE_KEYS.MOOD_HISTORY, JSON.stringify(data.moodHistory));
        }
        if (data.preferences) {
            localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data.preferences));
        }
        if (data.interactionStats) {
            localStorage.setItem(STORAGE_KEYS.INTERACTION_STATS, JSON.stringify(data.interactionStats));
        }
        if (data.onboardingStatus) {
            localStorage.setItem(STORAGE_KEYS.ONBOARDING_STATUS, JSON.stringify(data.onboardingStatus));
        }
    } catch (error) {
        console.error('Failed to import data:', error);
    }
};

export default {
    saveMessage,
    getConversationHistory,
    clearConversationHistory,
    saveMood,
    getMoodHistory,
    getCurrentMood,
    getMoodTrend,
    savePreferences,
    getPreferences,
    trackInteraction,
    getInteractionStats,
    getLastInteraction,
    isReturningUser,
    saveOnboardingStatus,
    getOnboardingStatus,
    isFirstVisit,
    getPageContext,
    clearAllData,
    exportData,
    importData
};
