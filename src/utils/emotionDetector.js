/**
 * Advanced Emotion Detection System
 * Analyzes user messages for emotional content and sentiment
 */

/**
 * Emotion types
 */
export const EmotionType = {
    HAPPY: 'happy',
    SAD: 'sad',
    EXCITED: 'excited',
    ANGRY: 'angry',
    FRUSTRATED: 'frustrated',
    CONFUSED: 'confused',
    ANXIOUS: 'anxious',
    GRATEFUL: 'grateful',
    SURPRISED: 'surprised',
    NEUTRAL: 'neutral',
    CELEBRATING: 'celebrating',
    TIRED: 'tired',
    MOTIVATED: 'motivated'
};

/**
 * Emotion keywords and patterns
 */
const emotionPatterns = {
    [EmotionType.HAPPY]: {
        keywords: ['happy', 'joy', 'great', 'awesome', 'wonderful', 'amazing', 'good', 'love', 'excellent', 'fantastic', 'glad', 'pleased', 'delighted', 'cheerful'],
        patterns: [/😊|😄|😃|🙂|😁|😀/, /\byay\b/, /\bhappy\b/, /love it/, /so good/],
        intensity: 0.8
    },
    [EmotionType.SAD]: {
        keywords: ['sad', 'unhappy', 'down', 'depressed', 'upset', 'disappointed', 'hurt', 'lonely', 'miserable', 'blue', 'crying', 'tears'],
        patterns: [/😢|😭|😞|☹️|🙁/, /\bcry/, /feel bad/, /not okay/, /so sad/],
        intensity: 0.9
    },
    [EmotionType.EXCITED]: {
        keywords: ['excited', 'pumped', 'thrilled', 'hyped', 'energetic', 'can\'t wait', 'looking forward'],
        patterns: [/🎉|🥳|✨|⭐/, /!!+/, /omg/, /\bwow\b/, /amazing/],
        intensity: 0.9
    },
    [EmotionType.ANGRY]: {
        keywords: ['angry', 'mad', 'furious', 'annoyed', 'irritated', 'pissed', 'hate'],
        patterns: [/😠|😡|🤬/, /!!+/, /\bhate\b/, /so annoying/, /makes me mad/],
        intensity: 0.85
    },
    [EmotionType.FRUSTRATED]: {
        keywords: ['frustrated', 'stuck', 'annoying', 'difficult', 'struggling', 'can\'t figure', 'not working'],
        patterns: [/😤|😫|😩/, /ugh/, /argh/, /\bstuck\b/, /doesn't work/],
        intensity: 0.7
    },
    [EmotionType.CONFUSED]: {
        keywords: ['confused', 'lost', 'don\'t understand', 'unclear', 'puzzled', 'bewildered', 'what', 'how'],
        patterns: [/❓|🤔|😕/, /\?\?+/, /\bwhat\b/, /\bhow\b/, /don't get it/],
        intensity: 0.6
    },
    [EmotionType.ANXIOUS]: {
        keywords: ['anxious', 'worried', 'nervous', 'stressed', 'concerned', 'afraid', 'scared', 'panic'],
        patterns: [/😰|😨|😟|😧/, /\bworried\b/, /\bstressed\b/, /so nervous/],
        intensity: 0.8
    },
    [EmotionType.GRATEFUL]: {
        keywords: ['thank', 'thanks', 'grateful', 'appreciate', 'helpful', 'amazing help'],
        patterns: [/🙏|❤️|💙/, /\bthank/, /appreciate/, /you're the best/],
        intensity: 0.7
    },
    [EmotionType.SURPRISED]: {
        keywords: ['wow', 'omg', 'amazing', 'incredible', 'unbelievable', 'shocking', 'didn\'t expect'],
        patterns: [/😮|😲|🤯/, /\bomg\b/, /\bwow\b/, /no way/, /can't believe/],
        intensity: 0.8
    },
    [EmotionType.CELEBRATING]: {
        keywords: ['achieved', 'completed', 'finished', 'won', 'success', 'accomplished', 'done', 'made it', 'victory'],
        patterns: [/🎉|🥳|🎊|🏆|⭐/, /\byay\b/, /\bdone\b/, /achieved/, /completed/],
        intensity: 0.9
    },
    [EmotionType.TIRED]: {
        keywords: ['tired', 'exhausted', 'sleepy', 'worn out', 'drained', 'fatigued', 'burned out'],
        patterns: [/😴|🥱|😪/, /\btired\b/, /\bexhausted\b/, /need sleep/],
        intensity: 0.7
    },
    [EmotionType.MOTIVATED]: {
        keywords: ['motivated', 'determined', 'focused', 'ready', 'let\'s do this', 'inspired', 'driven'],
        patterns: [/💪|🔥|⚡/, /let's go/, /let's do/, /\bready\b/, /bring it on/],
        intensity: 0.8
    }
};

/**
 * Detect emotion from text
 * @param {string} text - User message
 * @returns {Object} Emotion analysis {emotion, confidence, intensity, secondary}
 */
export const detectEmotion = (text) => {
    if (!text || typeof text !== 'string') {
        return {
            emotion: EmotionType.NEUTRAL,
            confidence: 1.0,
            intensity: 0.5,
            secondary: null
        };
    }

    const lowerText = text.toLowerCase();
    const emotionScores = {};

    // Score each emotion
    Object.entries(emotionPatterns).forEach(([emotion, data]) => {
        let score = 0;

        // Check keywords
        data.keywords.forEach(keyword => {
            if (lowerText.includes(keyword)) {
                score += 1.0;
            }
        });

        // Check patterns
        data.patterns.forEach(pattern => {
            if (pattern.test(text)) {
                score += 1.5; // Patterns are stronger indicators
            }
        });

        // Apply intensity multiplier
        if (score > 0) {
            score *= data.intensity;
            emotionScores[emotion] = score;
        }
    });

    // No emotions detected
    if (Object.keys(emotionScores).length === 0) {
        return {
            emotion: EmotionType.NEUTRAL,
            confidence: 0.5,
            intensity: 0.5,
            secondary: null
        };
    }

    // Sort by score
    const sortedEmotions = Object.entries(emotionScores)
        .sort(([, a], [, b]) => b - a);

    const [primaryEmotion, primaryScore] = sortedEmotions[0];
    const secondaryEmotion = sortedEmotions.length > 1 ? sortedEmotions[1][0] : null;

    // Calculate confidence based on score
    const maxPossibleScore = 5.0;
    const confidence = Math.min(primaryScore / maxPossibleScore, 1.0);

    return {
        emotion: primaryEmotion,
        confidence,
        intensity: emotionPatterns[primaryEmotion].intensity,
        secondary: secondaryEmotion,
        allScores: emotionScores
    };
};

/**
 * Get appropriate avatar expression for emotion
 * @param {string} emotion - Detected emotion
 * @returns {string} Avatar expression/animation
 */
export const getAvatarExpression = (emotion) => {
    const expressionMap = {
        [EmotionType.HAPPY]: 'happy',
        [EmotionType.SAD]: 'sad',
        [EmotionType.EXCITED]: 'excited',
        [EmotionType.ANGRY]: 'angry',
        [EmotionType.FRUSTRATED]: 'thinking',
        [EmotionType.CONFUSED]: 'confused',
        [EmotionType.ANXIOUS]: 'sad',
        [EmotionType.GRATEFUL]: 'happy',
        [EmotionType.SURPRISED]: 'excited',
        [EmotionType.CELEBRATING]: 'celebrating',
        [EmotionType.TIRED]: 'sleepy',
        [EmotionType.MOTIVATED]: 'excited',
        [EmotionType.NEUTRAL]: 'idle'
    };

    return expressionMap[emotion] || 'idle';
};

/**
 * Get empathetic response prefix
 * @param {string} emotion - Detected emotion
 * @returns {string} Empathetic prefix
 */
export const getEmpatheticPrefix = (emotion) => {
    const prefixes = {
        [EmotionType.HAPPY]: '',
        [EmotionType.SAD]: 'I can see you\'re feeling down. ',
        [EmotionType.EXCITED]: 'I love your energy! ',
        [EmotionType.ANGRY]: 'I understand you\'re upset. ',
        [EmotionType.FRUSTRATED]: 'I know it can be frustrating. ',
        [EmotionType.CONFUSED]: 'Let me help clarify that! ',
        [EmotionType.ANXIOUS]: 'Take a deep breath. ',
        [EmotionType.GRATEFUL]: 'Aww, you\'re welcome! ',
        [EmotionType.SURPRISED]: 'Right?! ',
        [EmotionType.CELEBRATING]: '🎉 Congratulations! ',
        [EmotionType.TIRED]: 'You must be exhausted. ',
        [EmotionType.MOTIVATED]: 'That\'s the spirit! ',
        [EmotionType.NEUTRAL]: ''
    };

    return prefixes[emotion] || '';
};

/**
 * Determine if user needs support
 * @param {Object} emotionAnalysis - Result from detectEmotion
 * @returns {boolean}
 */
export const needsSupport = (emotionAnalysis) => {
    const supportEmotions = [
        EmotionType.SAD,
        EmotionType.ANXIOUS,
        EmotionType.FRUSTRATED,
        EmotionType.CONFUSED,
        EmotionType.ANGRY
    ];

    return supportEmotions.includes(emotionAnalysis.emotion) &&
        emotionAnalysis.confidence > 0.6;
};

/**
 * Get supportive message based on emotion
 * @param {string} emotion - Detected emotion
 * @returns {string}
 */
export const getSupportiveMessage = (emotion) => {
    const supportMessages = {
        [EmotionType.SAD]: "I'm here for you. Remember, every cloud has a silver lining. Want to talk about it?",
        [EmotionType.ANXIOUS]: "It's okay to feel worried sometimes. Let's take this one step at a time together.",
        [EmotionType.FRUSTRATED]: "I understand it's tough right now. You're doing great though! Need some help?",
        [EmotionType.CONFUSED]: "No worries! I'm here to make things clearer. What can I explain better?",
        [EmotionType.ANGRY]: "I get it, sometimes things get overwhelming. Want to tell me what's bothering you?"
    };

    return supportMessages[emotion] || "How can I help you feel better?";
};

/**
 * Analyze sentiment polarity
 * @param {string} text - User message
 * @returns {Object} {polarity: 'positive'|'negative'|'neutral', score: number}
 */
export const analyzeSentiment = (text) => {
    const positiveWords = ['good', 'great', 'awesome', 'love', 'happy', 'yes', 'nice', 'perfect', 'excellent'];
    const negativeWords = ['bad', 'hate', 'no', 'sad', 'angry', 'terrible', 'awful', 'worst', 'horrible'];

    let score = 0;
    const lowerText = text.toLowerCase();

    positiveWords.forEach(word => {
        if (lowerText.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
        if (lowerText.includes(word)) score -= 1;
    });

    let polarity = 'neutral';
    if (score > 0) polarity = 'positive';
    if (score < 0) polarity = 'negative';

    return { polarity, score };
};

export default {
    EmotionType,
    detectEmotion,
    getAvatarExpression,
    getEmpatheticPrefix,
    needsSupport,
    getSupportiveMessage,
    analyzeSentiment
};
