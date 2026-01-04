import { useState, useEffect, useCallback } from 'react';

/**
 * Focusly Conversation Memory Hook
 * Manages conversation history and context persistence
 */
const useFocuslyMemory = () => {
    const [conversationHistory, setConversationHistory] = useState([]);
    const [userContext, setUserContext] = useState({});
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [interactionCount, setInteractionCount] = useState(0);

    const STORAGE_KEY = 'focusly_conversation_history';
    const CONTEXT_KEY = 'focusly_user_context';
    const MAX_HISTORY_LENGTH = 20; // Keep last 20 messages
    const HISTORY_EXPIRY_DAYS = 7;

    // Load conversation history from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const storedContext = localStorage.getItem(CONTEXT_KEY);

            if (stored) {
                const parsed = JSON.parse(stored);

                // Check if history is expired
                const expiryTime = Date.now() - (HISTORY_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
                const validHistory = parsed.filter(msg =>
                    new Date(msg.timestamp).getTime() > expiryTime
                );

                setConversationHistory(validHistory);
            }

            if (storedContext) {
                setUserContext(JSON.parse(storedContext));
            }

            setSessionStartTime(Date.now());
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }, []);

    // Save conversation history to localStorage
    const saveHistory = useCallback((history) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }, []);

    // Save user context
    const saveContext = useCallback((context) => {
        try {
            localStorage.setItem(CONTEXT_KEY, JSON.stringify(context));
        } catch (error) {
            console.error('Error saving user context:', error);
        }
    }, []);

    /**
     * Add message to conversation history
     */
    const addMessage = useCallback((message, sender, metadata = {}) => {
        const newMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: message,
            sender, // 'user' or 'focusly'
            timestamp: new Date().toISOString(),
            metadata
        };

        setConversationHistory(prev => {
            const updated = [...prev, newMessage];
            // Keep only last MAX_HISTORY_LENGTH messages
            const trimmed = updated.slice(-MAX_HISTORY_LENGTH);
            saveHistory(trimmed);
            return trimmed;
        });

        if (sender === 'user') {
            setInteractionCount(prev => prev + 1);
        }

        return newMessage;
    }, [saveHistory]);

    /**
     * Get conversation context for AI
     */
    const getConversationContext = useCallback(() => {
        // Get last 10 messages for context
        const recentHistory = conversationHistory.slice(-10);

        return {
            history: recentHistory,
            userContext,
            sessionDuration: sessionStartTime ? Date.now() - sessionStartTime : 0,
            interactionCount,
            lastInteraction: conversationHistory.length > 0
                ? conversationHistory[conversationHistory.length - 1].timestamp
                : null
        };
    }, [conversationHistory, userContext, sessionStartTime, interactionCount]);

    /**
     * Update user context
     */
    const updateContext = useCallback((updates) => {
        setUserContext(prev => {
            const updated = { ...prev, ...updates };
            saveContext(updated);
            return updated;
        });
    }, [saveContext]);

    /**
     * Track user preferences
     */
    const trackPreference = useCallback((key, value) => {
        updateContext({
            preferences: {
                ...userContext.preferences,
                [key]: value
            }
        });
    }, [userContext, updateContext]);

    /**
     * Track user mood over time
     */
    const trackMood = useCallback((emotion, intensity) => {
        const moodHistory = userContext.moodHistory || [];
        const newMood = {
            emotion,
            intensity,
            timestamp: new Date().toISOString()
        };

        updateContext({
            moodHistory: [...moodHistory.slice(-10), newMood],
            currentMood: emotion
        });
    }, [userContext, updateContext]);

    /**
     * Get user's recent mood trend
     */
    const getMoodTrend = useCallback(() => {
        const moodHistory = userContext.moodHistory || [];
        if (moodHistory.length === 0) return 'neutral';

        const recentMoods = moodHistory.slice(-5);
        const negativeMoods = ['sad', 'angry', 'frustrated', 'anxious'];
        const positiveCount = recentMoods.filter(m =>
            !negativeMoods.includes(m.emotion)
        ).length;

        if (positiveCount >= 3) return 'positive';
        if (positiveCount <= 1) return 'negative';
        return 'mixed';
    }, [userContext]);

    /**
     * Clear conversation history
     */
    const clearHistory = useCallback(() => {
        setConversationHistory([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    /**
     * Clear all data
     */
    const clearAll = useCallback(() => {
        setConversationHistory([]);
        setUserContext({});
        setInteractionCount(0);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CONTEXT_KEY);
    }, []);

    /**
     * Get summary for context
     */
    const getSummary = useCallback(() => {
        return {
            messageCount: conversationHistory.length,
            interactionCount,
            sessionDuration: sessionStartTime ? Date.now() - sessionStartTime : 0,
            currentMood: userContext.currentMood || 'neutral',
            moodTrend: getMoodTrend(),
            preferences: userContext.preferences || {}
        };
    }, [conversationHistory, interactionCount, sessionStartTime, userContext, getMoodTrend]);

    /**
     * Check if user is returning
     */
    const isReturningUser = useCallback(() => {
        return conversationHistory.length > 5;
    }, [conversationHistory]);

    /**
     * Get personalized greeting
     */
    const getPersonalizedGreeting = useCallback(() => {
        const isReturning = isReturningUser();
        const mood = userContext.currentMood;
        const time = new Date().getHours();

        let greeting = '';

        // Time-based greeting
        if (time < 12) greeting = 'Good morning';
        else if (time < 18) greeting = 'Good afternoon';
        else greeting = 'Good evening';

        if (isReturning) {
            greeting += '! Welcome back';
        } else {
            greeting += '! Great to see you';
        }

        // Add mood-based message
        if (mood === 'sad' || mood === 'anxious') {
            greeting += '. I hope you\'re feeling better! 🦁';
        } else if (mood === 'happy' || mood === 'excited') {
            greeting += '. You seem to be in great spirits! 🎉';
        } else {
            greeting += '! 😊';
        }

        return greeting;
    }, [isReturningUser, userContext]);

    return {
        conversationHistory,
        userContext,
        interactionCount,
        addMessage,
        getConversationContext,
        updateContext,
        trackPreference,
        trackMood,
        getMoodTrend,
        clearHistory,
        clearAll,
        getSummary,
        isReturningUser,
        getPersonalizedGreeting
    };
};

export default useFocuslyMemory;
