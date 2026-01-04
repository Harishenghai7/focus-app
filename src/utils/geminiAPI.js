import { getSmartFallback } from './smartFallbacks';

/**
 * Gemini API Client
 * Communicates with the proxy server to get AI responses
 */

const PROXY_URL = process.env.REACT_APP_PROXY_URL || 'http://localhost:3001';

/**
 * System prompt that defines Focusly's personality and behavior
 */
const FOCUSLY_SYSTEM_PROMPT = `You are Focusly, an energetic and friendly AI companion lion who helps users stay focused and productive.`;

/**
 * Generate AI response from Gemini via proxy
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages for context
 * @param {Object} context - Additional context (current page, user mood, etc.)
 * @returns {Promise<string>} AI response
 */
export const generateResponse = async (userMessage, conversationHistory = [], context = {}) => {
    try {
        console.log('🤖 Sending request to Gemini Proxy...');

        const response = await fetch(`${PROXY_URL}/api/chat/simple`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: userMessage,
                conversationHistory,
                context
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Received response from Gemini');
        return data.response || getSmartFallback(userMessage);

    } catch (error) {
        console.error('❌ Gemini API error:', error);

        // Use smart fallback if proxy fails
        return getSmartFallback(userMessage);
    }
};

/**
 * Generate streaming response (for real-time feedback)
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Previous messages
 * @param {Object} context - Additional context
 * @param {Function} onChunk - Callback for each chunk of text
 * @returns {Promise<string>} Complete response
 */
export const generateStreamingResponse = async (userMessage, conversationHistory = [], context = {}, onChunk) => {
    try {
        console.log('🤖 Sending streaming request to Gemini Proxy...');

        const response = await fetch(`${PROXY_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: userMessage,
                conversationHistory,
                context
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    if (data === '[DONE]') {
                        console.log('✅ Streaming response complete');
                        return fullText.trim();
                    }

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.text) {
                            fullText += parsed.text;
                            if (onChunk) onChunk(parsed.text);
                        } else if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                    } catch (e) {
                        // Skip malformed JSON
                    }
                }
            }
        }

        return fullText.trim() || getSmartFallback(userMessage);

    } catch (error) {
        console.error('❌ Gemini streaming error:', error);

        const fallback = getSmartFallback(userMessage);
        if (onChunk) onChunk(fallback);
        return fallback;
    }
};

/**
 * Get context-aware suggestions for the current page
 * @param {string} pageName - Current page name
 * @returns {Array<string>} Suggested prompts
 */
export const getContextSuggestions = (pageName) => {
    const suggestions = {
        home: [
            "What's new on my feed?",
            "How do I create a post?",
            "Tell me about Focus features",
            "Give me a productivity tip"
        ],
        explore: [
            "How does Explore work?",
            "What are trending topics?",
            "How do I find new people?",
            "Show me popular content"
        ],
        create: [
            "How do I create a post?",
            "What's a Boltz video?",
            "How do I add media?",
            "Give me content ideas"
        ],
        boltz: [
            "What are Boltz videos?",
            "How do I create a Boltz?",
            "How do I interact with videos?",
            "Tell me about video features"
        ],
        profile: [
            "How do I edit my profile?",
            "What are badges?",
            "How do I view my stats?",
            "Tell me about highlights"
        ],
        messages: [
            "How do I send a message?",
            "What are message features?",
            "How do I share media?",
            "Tell me about group chats"
        ],
        settings: [
            "How do I change my settings?",
            "What privacy options do I have?",
            "How do I customize my experience?",
            "Tell me about notifications"
        ],
        notifications: [
            "What notifications do I have?",
            "How do I manage notifications?",
            "What do notification types mean?",
            "How do I mute notifications?"
        ]
    };

    return suggestions[pageName.toLowerCase()] || [
        "What can you help me with?",
        "Tell me about Focus app",
        "Give me a productivity tip",
        "Let's play a game!"
    ];
};

/**
 * Analyze user message for intent
 * @param {string} message - User's message
 * @returns {Object} Intent analysis
 */
export const analyzeIntent = (message) => {
    const lowerMessage = message.toLowerCase();

    const intents = {
        greeting: /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i.test(message),
        help: /(help|assist|guide|how|what|explain|show me)/i.test(message),
        emotional: /(sad|happy|excited|frustrated|tired|stressed|anxious|worried)/i.test(message),
        feature: /(feature|function|work|use|create|post|message|profile|setting)/i.test(message),
        game: /(game|play|fun|riddle|quiz|trivia|joke)/i.test(message),
        motivation: /(motivate|inspire|encourage|tip|advice|focus|productive)/i.test(message),
        farewell: /(bye|goodbye|see you|later|thanks|thank you)/i.test(message)
    };

    const detectedIntents = Object.keys(intents).filter(key => intents[key]);
    const primaryIntent = detectedIntents[0] || 'general';

    return {
        primary: primaryIntent,
        all: detectedIntents,
        isQuestion: message.includes('?'),
        requiresAction: /(show|open|go to|navigate|create)/i.test(message)
    };
};

export default {
    generateResponse,
    generateStreamingResponse,
    getContextSuggestions,
    analyzeIntent
};
