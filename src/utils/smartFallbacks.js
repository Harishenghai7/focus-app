/**
 * Smart Fallback Responses for Focusly AI
 * Works without Gemini API - uses pattern matching
 */

const FALLBACK_RESPONSES = {
    greetings: [
        "Hey there! 👋 I'm Focusly, your friendly AI companion! How can I help you stay focused today?",
        "Hi! 🦁 Great to see you! What would you like to do?",
        "Hello! 💜 Ready to crush some goals together?",
        "Hey! ✨ I'm here to help you stay productive!"
    ],

    help: [
        "I can help you with:\n• Navigating the Focus app\n• Productivity tips\n• Motivation and support\n• App features explanation\n\nWhat would you like to know?",
        "I'm here to guide you! Ask me about any feature, or just chat with me for motivation! 💪",
        "Need help? I can explain features, give tips, or just be your productivity buddy! What interests you?"
    ],

    features: {
        home: "The Home feed shows posts from people you follow! You can like, comment, and share. Want to create your own post? Head to the Create tab! 📱",
        explore: "Explore helps you discover new content and people! Check out trending topics, popular posts, and find awesome creators to follow! 🔍",
        create: "Ready to share? You can create regular posts with photos/videos, or make quick Boltz videos! Express yourself! 🎨",
        boltz: "Boltz are short, fun videos like TikTok or Reels! Swipe to watch, double-tap to like, and create your own! 🎬",
        profile: "Your profile shows your posts, stats, and badges! Customize it to show off your personality! ✨",
        messages: "Stay connected! Send messages, share media, and chat with friends. Group chats coming soon! 💬",
        settings: "Customize your experience! Change themes, privacy settings, notifications, and more! ⚙️"
    },

    motivation: [
        "You've got this! 💪 Every small step counts. Keep pushing forward!",
        "Remember: Progress over perfection! You're doing amazing! 🌟",
        "Take a deep breath. You're capable of incredible things! Believe in yourself! ✨",
        "One task at a time! You're building something great! Keep going! 🚀",
        "Feeling stuck? That's okay! Take a break, then come back stronger! 💜"
    ],

    productivity: [
        "💡 Tip: Try the Pomodoro Technique! Work for 25 minutes, break for 5. Repeat!",
        "💡 Tip: Start with the hardest task first. Everything else will feel easier!",
        "💡 Tip: Turn off notifications for deep focus time. Your future self will thank you!",
        "💡 Tip: Break big goals into tiny tasks. Small wins = big momentum!",
        "💡 Tip: Schedule breaks! Your brain needs rest to stay sharp!"
    ],

    emotional: {
        happy: "That's awesome! 😊 I love seeing you happy! Keep that positive energy flowing!",
        sad: "I'm here for you. 💜 It's okay to feel down sometimes. Want to talk about it or need a distraction?",
        excited: "Woohoo! 🎉 Your excitement is contagious! What's got you so pumped?",
        frustrated: "I get it. 😤 Frustration is tough. Take a breath. You're stronger than this challenge!",
        tired: "You sound exhausted. 😴 Maybe it's time for a break? Self-care isn't selfish!",
        stressed: "Stress is real. 😰 Let's tackle this together. What's weighing on you?",
        anxious: "Anxiety is hard. 💙 Remember: You've overcome challenges before. You can do this too!"
    },

    games: [
        "🎮 Let's play! Quick riddle: I speak without a mouth and hear without ears. What am I? (Answer: An echo!)",
        "🎮 Fun fact: A lion's roar can be heard from 5 miles away! Pretty cool, right? 🦁",
        "🎮 Brain teaser: What has keys but no locks, space but no room? (Answer: A keyboard!)",
        "🎮 Did you know? Honey never spoils! Archaeologists found 3000-year-old honey that's still edible! 🍯"
    ],

    farewell: [
        "See you soon! Keep being awesome! 👋",
        "Bye! Remember, I'm always here when you need me! 💜",
        "Later! Go crush those goals! 🚀",
        "Catch you later! Stay focused! ✨"
    ],

    default: [
        "That's interesting! Tell me more! 🤔",
        "I'm listening! What else is on your mind?",
        "Hmm, I'm not sure about that, but I'm here to chat! What would you like to talk about?",
        "Interesting question! While I figure that out, is there anything else I can help with?"
    ]
};

/**
 * Get smart fallback response based on user message
 */
export const getSmartFallback = (userMessage) => {
    const lower = userMessage.toLowerCase();

    // Greetings
    if (/^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|yo)/i.test(userMessage)) {
        return randomFrom(FALLBACK_RESPONSES.greetings);
    }

    // Help requests
    if (/(help|assist|guide|what can you|what do you)/i.test(lower)) {
        return randomFrom(FALLBACK_RESPONSES.help);
    }

    // Feature questions
    if (/home|feed/i.test(lower)) return FALLBACK_RESPONSES.features.home;
    if (/explore|discover|find/i.test(lower)) return FALLBACK_RESPONSES.features.explore;
    if (/create|post|share/i.test(lower)) return FALLBACK_RESPONSES.features.create;
    if (/boltz|video|reel/i.test(lower)) return FALLBACK_RESPONSES.features.boltz;
    if (/profile|account|bio/i.test(lower)) return FALLBACK_RESPONSES.features.profile;
    if (/message|chat|dm/i.test(lower)) return FALLBACK_RESPONSES.features.messages;
    if (/setting|preference|customize/i.test(lower)) return FALLBACK_RESPONSES.features.settings;

    // Emotional support
    if (/(happy|great|awesome|wonderful|excellent|amazing)/i.test(lower)) {
        return FALLBACK_RESPONSES.emotional.happy;
    }
    if (/(sad|unhappy|down|depressed|upset)/i.test(lower)) {
        return FALLBACK_RESPONSES.emotional.sad;
    }
    if (/(excited|pumped|thrilled|stoked)/i.test(lower)) {
        return FALLBACK_RESPONSES.emotional.excited;
    }
    if (/(frustrated|annoyed|angry|mad)/i.test(lower)) {
        return FALLBACK_RESPONSES.emotional.frustrated;
    }
    if (/(tired|exhausted|sleepy|drained)/i.test(lower)) {
        return FALLBACK_RESPONSES.emotional.tired;
    }
    if (/(stressed|overwhelmed|pressure)/i.test(lower)) {
        return FALLBACK_RESPONSES.emotional.stressed;
    }
    if (/(anxious|worried|nervous|afraid)/i.test(lower)) {
        return FALLBACK_RESPONSES.emotional.anxious;
    }

    // Motivation
    if (/(motivate|inspire|encourage|boost)/i.test(lower)) {
        return randomFrom(FALLBACK_RESPONSES.motivation);
    }

    // Productivity tips
    if (/(tip|advice|productive|focus|concentrate)/i.test(lower)) {
        return randomFrom(FALLBACK_RESPONSES.productivity);
    }

    // Games
    if (/(game|play|fun|riddle|joke|fact)/i.test(lower)) {
        return randomFrom(FALLBACK_RESPONSES.games);
    }

    // Farewell
    if (/(bye|goodbye|see you|later|thanks|thank you)/i.test(lower)) {
        return randomFrom(FALLBACK_RESPONSES.farewell);
    }

    // Default
    return randomFrom(FALLBACK_RESPONSES.default);
};

/**
 * Get random item from array
 */
const randomFrom = (array) => {
    return array[Math.floor(Math.random() * array.length)];
};

const _defaultModule = {
    getSmartFallback,
    FALLBACK_RESPONSES
};


export default _defaultModule;
