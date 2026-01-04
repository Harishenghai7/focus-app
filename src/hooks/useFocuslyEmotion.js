import { useState, useCallback } from 'react';
import { saveMood, getCurrentMood, getMoodTrend } from '../utils/focuslyContextMemory';

/**
 * Emotion keywords for sentiment analysis
 */
const EMOTION_KEYWORDS = {
    happy: ['happy', 'great', 'awesome', 'wonderful', 'excellent', 'good', 'love', 'amazing', 'fantastic', 'joy', 'glad', 'pleased', 'excited', 'yay', '😊', '😄', '🎉', '❤️'],
    sad: ['sad', 'unhappy', 'depressed', 'down', 'upset', 'disappointed', 'hurt', 'crying', 'tears', 'miserable', '😢', '😭', '💔'],
    excited: ['excited', 'pumped', 'thrilled', 'stoked', 'hyped', 'can\'t wait', 'woohoo', 'yay', '🎉', '🔥', '⚡'],
    frustrated: ['frustrated', 'annoyed', 'irritated', 'angry', 'mad', 'furious', 'upset', 'hate', '😠', '😤'],
    anxious: ['anxious', 'worried', 'nervous', 'stressed', 'concerned', 'afraid', 'scared', 'panic', '😰', '😟'],
    tired: ['tired', 'exhausted', 'sleepy', 'fatigue', 'drained', 'worn out', '😴'],
    confused: ['confused', 'lost', 'don\'t understand', 'unclear', 'puzzled', '🤔', '❓'],
    grateful: ['thank', 'thanks', 'grateful', 'appreciate', 'thankful', '🙏'],
    motivated: ['motivated', 'inspired', 'determined', 'focused', 'driven', '💪', '🎯']
};

/**
 * Custom hook for emotion detection and mood tracking
 */
export const useFocuslyEmotion = () => {
    const [detectedEmotion, setDetectedEmotion] = useState('neutral');
    const [confidence, setConfidence] = useState(0);

    /**
     * Analyze text for emotional content
     * @param {string} text - Text to analyze
     * @returns {Object} Emotion analysis result
     */
    const analyzeEmotion = useCallback((text) => {
        if (!text) {
            return { emotion: 'neutral', confidence: 0 };
        }

        const lowerText = text.toLowerCase();
        const emotionScores = {};

        // Count keyword matches for each emotion
        Object.keys(EMOTION_KEYWORDS).forEach(emotion => {
            const keywords = EMOTION_KEYWORDS[emotion];
            let score = 0;

            keywords.forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    score += 1;
                }
            });

            if (score > 0) {
                emotionScores[emotion] = score;
            }
        });

        // Find dominant emotion
        if (Object.keys(emotionScores).length === 0) {
            return { emotion: 'neutral', confidence: 0 };
        }

        const dominantEmotion = Object.keys(emotionScores).reduce((a, b) =>
            emotionScores[a] > emotionScores[b] ? a : b
        );

        const maxScore = emotionScores[dominantEmotion];
        const totalWords = text.split(/\s+/).length;
        const confidenceScore = Math.min(maxScore / totalWords, 1);

        return {
            emotion: dominantEmotion,
            confidence: confidenceScore,
            allScores: emotionScores
        };
    }, []);

    /**
     * Detect and save emotion from text
     * @param {string} text - Text to analyze
     * @returns {Object} Detected emotion
     */
    const detectEmotion = useCallback((text) => {
        const result = analyzeEmotion(text);
        setDetectedEmotion(result.emotion);
        setConfidence(result.confidence);

        // Save to mood history if confidence is high enough
        if (result.confidence > 0.3) {
            saveMood(result.emotion, result.confidence);
        }

        return result;
    }, [analyzeEmotion]);

    /**
     * Get appropriate response tone based on emotion
     * @param {string} emotion - Detected emotion
     * @returns {string} Response tone
     */
    const getResponseTone = useCallback((emotion) => {
        const tones = {
            happy: 'enthusiastic',
            excited: 'energetic',
            sad: 'empathetic',
            frustrated: 'supportive',
            anxious: 'calming',
            tired: 'gentle',
            confused: 'clarifying',
            grateful: 'warm',
            motivated: 'encouraging',
            neutral: 'friendly'
        };

        return tones[emotion] || 'friendly';
    }, []);

    /**
     * Get empathetic response prefix
     * @param {string} emotion - Detected emotion
     * @returns {string} Response prefix
     */
    const getEmpatheticPrefix = useCallback((emotion) => {
        const prefixes = {
            happy: "That's wonderful! 😊 ",
            excited: "I love your energy! 🎉 ",
            sad: "I'm here for you. 💜 ",
            frustrated: "I understand that's frustrating. ",
            anxious: "Take a deep breath. It's okay. ",
            tired: "You deserve a break. ",
            confused: "Let me help clarify that. ",
            grateful: "You're very welcome! 🙏 ",
            motivated: "That's the spirit! 💪 ",
            neutral: ""
        };

        return prefixes[emotion] || "";
    }, []);

    /**
     * Map emotion to avatar expression
     * @param {string} emotion - Detected emotion
     * @returns {string} Avatar expression
     */
    const getAvatarExpression = useCallback((emotion) => {
        const expressionMap = {
            happy: 'happy',
            excited: 'excited',
            sad: 'sad',
            frustrated: 'sad',
            anxious: 'thinking',
            tired: 'neutral',
            confused: 'confused',
            grateful: 'love',
            motivated: 'excited',
            neutral: 'neutral'
        };

        return expressionMap[emotion] || 'neutral';
    }, []);

    /**
     * Get current user mood
     * @returns {Object|null} Current mood
     */
    const getUserMood = useCallback(() => {
        return getCurrentMood();
    }, []);

    /**
     * Get mood trend over time
     * @returns {Object} Mood statistics
     */
    const getMoodStats = useCallback(() => {
        return getMoodTrend();
    }, []);

    /**
     * Check if user needs support
     * @returns {boolean} True if user might need emotional support
     */
    const needsSupport = useCallback(() => {
        const negativeMoods = ['sad', 'frustrated', 'anxious'];
        return negativeMoods.includes(detectedEmotion) && confidence > 0.5;
    }, [detectedEmotion, confidence]);

    /**
     * Get supportive message
     * @returns {string} Supportive message
     */
    const getSupportiveMessage = useCallback(() => {
        const messages = {
            sad: "I'm here for you. Remember, it's okay to feel this way. Want to talk about it? 💜",
            frustrated: "I can sense you're frustrated. Take a deep breath. You've got this! 💪",
            anxious: "Feeling anxious? Let's take it one step at a time. I'm here to help. 🌟",
            tired: "You sound tired. Maybe it's time for a break? Self-care is important! ✨"
        };

        return messages[detectedEmotion] || "How can I help you today? 😊";
    }, [detectedEmotion]);

    return {
        detectedEmotion,
        confidence,
        analyzeEmotion,
        detectEmotion,
        getResponseTone,
        getEmpatheticPrefix,
        getAvatarExpression,
        getUserMood,
        getMoodStats,
        needsSupport,
        getSupportiveMessage
    };
};

export default useFocuslyEmotion;
