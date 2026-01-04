/* ═══════════════════════════════════════════════════════════════════════
   SMART SUGGESTIONS - AI-powered message suggestions
   Phase 5: Future Enhancements
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Generate smart reply suggestions based on message content
 */
export const generateSmartReplies = (message) => {
    const content = message.content?.toLowerCase() || '';

    // Question patterns
    if (content.includes('how are you') || content.includes('how r u')) {
        return ["I'm good, thanks!", "Doing great! How about you?", "Pretty good! 😊"];
    }

    if (content.includes('what are you doing') || content.includes('wyd')) {
        return ["Just chilling", "Not much, you?", "Working on something"];
    }

    if (content.includes('where are you')) {
        return ["At home", "Out and about", "On my way"];
    }

    // Greeting patterns
    if (content.match(/^(hi|hey|hello|sup)/)) {
        return ["Hey! 👋", "Hi there!", "Hello! 😊"];
    }

    // Thanks patterns
    if (content.includes('thank') || content.includes('thx')) {
        return ["You're welcome!", "No problem!", "Anytime! 😊"];
    }

    // Apology patterns
    if (content.includes('sorry')) {
        return ["It's okay!", "No worries!", "All good! 👍"];
    }

    // Agreement patterns
    if (content.match(/\?$/)) {
        return ["Yes", "No", "Maybe", "Sure!"];
    }

    // Default suggestions
    return ["👍", "😊", "Okay", "Sure!", "Thanks!"];
};

/**
 * Suggest emojis based on message content
 */
export const suggestEmojis = (text) => {
    const content = text.toLowerCase();
    const suggestions = [];

    // Emotion-based
    if (content.match(/happy|great|awesome|amazing/)) {
        suggestions.push('😊', '🎉', '✨');
    }
    if (content.match(/sad|sorry|bad/)) {
        suggestions.push('😢', '💔', '😔');
    }
    if (content.match(/love|heart/)) {
        suggestions.push('❤️', '💜', '💕');
    }
    if (content.match(/funny|lol|haha/)) {
        suggestions.push('😂', '🤣', '😆');
    }

    // Activity-based
    if (content.match(/food|eat|hungry/)) {
        suggestions.push('🍕', '🍔', '🍜');
    }
    if (content.match(/coffee|tea/)) {
        suggestions.push('☕', '🍵');
    }
    if (content.match(/party|celebrate/)) {
        suggestions.push('🎉', '🥳', '🎊');
    }
    if (content.match(/work|study/)) {
        suggestions.push('💼', '📚', '💻');
    }

    // Default
    if (suggestions.length === 0) {
        suggestions.push('👍', '😊', '🔥');
    }

    return suggestions.slice(0, 5);
};

/**
 * Auto-complete common phrases
 */
export const autoCompletePhrase = (text) => {
    const phrases = {
        'good m': 'Good morning',
        'good n': 'Good night',
        'good e': 'Good evening',
        'see you': 'See you later',
        'talk to': 'Talk to you later',
        'on my': 'On my way',
        'be right': 'Be right back',
        'let me': 'Let me know',
        'thank you': 'Thank you so much',
        'sounds g': 'Sounds good',
        'no prob': 'No problem',
    };

    const lower = text.toLowerCase();
    for (const [key, value] of Object.entries(phrases)) {
        if (lower.endsWith(key)) {
            return value;
        }
    }

    return null;
};

/**
 * Detect message intent
 */
export const detectIntent = (message) => {
    const content = message.content?.toLowerCase() || '';

    if (content.match(/\?$/)) return 'question';
    if (content.match(/^(hi|hey|hello)/)) return 'greeting';
    if (content.includes('thank')) return 'gratitude';
    if (content.includes('sorry')) return 'apology';
    if (content.match(/!$/)) return 'exclamation';

    return 'statement';
};
