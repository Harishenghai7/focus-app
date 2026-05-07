import { generateResponse, analyzeIntent } from './geminiAPI';
import { supabase } from '../lib/supabase';

/**
 * FocuslyBrain - Tri-Layer Brain Architecture
 * 
 * Layer 1: Local Brain (Pattern Matching) - Fast, offline, 0 cost
 * Layer 2: Context Awareness - Screen detection, user state
 * Layer 3: Deep Logic (Gemini) - Complex conversations, "Well Wisher" mode
 */

// ============================================================================
// LAYER 1: LOCAL BRAIN - Pattern Matching for Common Phrases
// ============================================================================

const LOCAL_RESPONSES = {
  // Greetings
  greetings: [
    "Hey Macha! Focusly here, ready to help you stay focused! 🦁",
    "Macha! What can I help you with today?",
    "Hey buddy! Focusly at your service!",
    "Hello Macha! Let's make today productive!"
  ],
  
  // "Macha" specific
  macha: [
    "Yes Macha? I'm here for you!",
    "Macha, you called? Let's do this!",
    "What's up, Macha? Focusly is listening!",
    "Macha, I've got your back!"
  ],
  
  // "Super" / Positive
  super: [
    "That's super, Macha! Keep that energy going! 🔥",
    "Super! You're on fire today!",
    "Superb, Macha! Let's keep the momentum!",
    "That's the spirit, Macha!"
  ],
  
  // Mood checks
  mood_happy: [
    "I love that energy, Macha! Keep shining! ✨",
    "Your happiness is contagious, Macha!",
    "That's what I like to hear, Macha! 🎉"
  ],
  
  mood_sad: [
    "I'm here for you, Macha. What's bothering you?",
    "Don't worry, Macha. We'll get through this together.",
    "Take a deep breath, Macha. I'm right here with you."
  ],
  
  mood_tired: [
    "Rest is important too, Macha. Take a break if you need it.",
    "Even lions need to rest, Macha. Don't push too hard.",
    "Listen to your body, Macha. A rested mind is a focused mind."
  ],
  
  // Navigation help
  navigation: [
    "I can help you navigate, Macha! Where do you want to go?",
    "Let me guide you, Macha. What are you looking for?",
    "I know this app like the back of my paw, Macha! Ask away!"
  ],
  
  // Productivity tips
  productivity: [
    "Here's a tip: Break big tasks into small chunks, Macha!",
    "Try the Pomodoro technique, Macha! 25 minutes focus, 5 minutes break.",
    "Remember Macha: Progress over perfection!",
    "One step at a time, Macha. You've got this!"
  ],
  
  // Motivation
  motivation: [
    "You're building something amazing, Macha! Keep going!",
    "Every post, every interaction - you're creating your legacy, Macha!",
    "Focus, Macha. Your vision is worth the effort!",
    "You're not just posting, Macha. You're inspiring others!"
  ],
  
  // Farewell
  farewell: [
    "See you later, Macha! Stay focused! 🦁",
    "Bye for now, Macha! I'll be here when you need me!",
    "Take care, Macha! Remember: Focus is your superpower!"
  ],
  
  // Default fallback
  default: [
    "I'm listening, Macha! What's on your mind?",
    "Tell me more, Macha. I'm here to help!",
    "Interesting, Macha! Let me think about that...",
    "I'm with you, Macha. What do you need?"
  ]
};

/**
 * Local pattern matching for instant responses (0 latency, 0 cost)
 * @param {string} message - User's message
 * @returns {string|null} Local response or null if no match
 */
const getLocalResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for "Macha"
  if (lowerMessage.includes('macha')) {
    return LOCAL_RESPONSES.macha[Math.floor(Math.random() * LOCAL_RESPONSES.macha.length)];
  }
  
  // Check for "Super"
  if (lowerMessage.includes('super')) {
    return LOCAL_RESPONSES.super[Math.floor(Math.random() * LOCAL_RESPONSES.super.length)];
  }
  
  // Check for greetings
  const greetingPatterns = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/i;
  if (greetingPatterns.test(message)) {
    return LOCAL_RESPONSES.greetings[Math.floor(Math.random() * LOCAL_RESPONSES.greetings.length)];
  }
  
  // Check for mood indicators
  if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('awesome')) {
    return LOCAL_RESPONSES.mood_happy[Math.floor(Math.random() * LOCAL_RESPONSES.mood_happy.length)];
  }
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('upset')) {
    return LOCAL_RESPONSES.mood_sad[Math.floor(Math.random() * LOCAL_RESPONSES.mood_sad.length)];
  }
  
  if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('sleepy')) {
    return LOCAL_RESPONSES.mood_tired[Math.floor(Math.random() * LOCAL_RESPONSES.mood_tired.length)];
  }
  
  // Check for navigation requests
  if (lowerMessage.includes('where') || lowerMessage.includes('find') || lowerMessage.includes('go to')) {
    return LOCAL_RESPONSES.navigation[Math.floor(Math.random() * LOCAL_RESPONSES.navigation.length)];
  }
  
  // Check for productivity requests
  if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('help me focus')) {
    return LOCAL_RESPONSES.productivity[Math.floor(Math.random() * LOCAL_RESPONSES.productivity.length)];
  }
  
  // Check for motivation requests
  if (lowerMessage.includes('motivat') || lowerMessage.includes('inspire') || lowerMessage.includes('encourage')) {
    return LOCAL_RESPONSES.motivation[Math.floor(Math.random() * LOCAL_RESPONSES.motivation.length)];
  }
  
  // Check for farewell
  const farewellPatterns = /^(bye|goodbye|see you|later|thanks|thank you)/i;
  if (farewellPatterns.test(message)) {
    return LOCAL_RESPONSES.farewell[Math.floor(Math.random() * LOCAL_RESPONSES.farewell.length)];
  }
  
  // No local match found
  return null;
};

// ============================================================================
// LAYER 2: CONTEXT AWARENESS - Screen & User State Detection
// ============================================================================

/**
 * Get context-aware greeting based on current screen
 * @param {string} screenName - Current screen/route name
 * @returns {string} Context-aware message
 */
export const getContextGreeting = (screenName) => {
  const contextGreetings = {
    home: "Welcome home, Macha! Ready to share your vision?",
    explore: "Explore the community, Macha! Discover new inspirations!",
    create: "Time to create, Macha! What's on your mind?",
    boltz: "Boltz mode activated, Macha! Let your creativity flow!",
    profile: "Your legacy, Macha! Look how far you've come!",
    messages: "Connecting with your tribe, Macha! 💬",
    settings: "Customize your experience, Macha!",
    notifications: "Stay in the loop, Macha!"
  };
  
  return contextGreetings[screenName?.toLowerCase()] || "I'm here, Macha! What can I help with?";
};

/**
 * Detect emotional state from user's profile and recent activity
 * @param {Object} userProfile - User's profile data
 * @param {Array} recentMemories - Recent focusly memories
 * @returns {Object} Emotional state analysis
 */
export const detectEmotionalState = (userProfile, recentMemories = []) => {
  const emotionalState = {
    mood: 'neutral',
    confidence: 0.5,
    factors: []
  };
  
  // Check if user is restricted (sad state)
  if (userProfile?.is_restricted) {
    emotionalState.mood = 'concerned';
    emotionalState.confidence = 0.9;
    emotionalState.factors.push('account_restricted');
  }
  
  // Check for recent warnings
  const recentWarnings = recentMemories.filter(m => m.memory_type === 'warning');
  if (recentWarnings.length > 0) {
    emotionalState.mood = 'worried';
    emotionalState.confidence = 0.8;
    emotionalState.factors.push('recent_warnings');
  }
  
  // Check for recent milestones (happy state)
  const recentMilestones = recentMemories.filter(m => m.memory_type === 'milestone');
  if (recentMilestones.length > 0) {
    emotionalState.mood = 'celebratory';
    emotionalState.confidence = 0.85;
    emotionalState.factors.push('recent_milestones');
  }
  
  return emotionalState;
};

// ============================================================================
// LAYER 3: DEEP LOGIC - Gemini Integration for Complex Conversations
// ============================================================================

/**
 * Enhanced system prompt with Focusly's personality and context
 * @param {Object} context - User context and current state
 * @returns {string} Enhanced system prompt
 */
const getEnhancedSystemPrompt = (context) => {
  const { screen, emotionalState, userProfile, recentMemories } = context;
  
  let prompt = `You are Focusly, an energetic and friendly AI companion lion who helps users stay focused and productive. You call the user "Macha" (which means "buddy" in Tamil).

Your personality:
- Energetic, friendly, and supportive
- Uses light emoji occasionally
- Speaks in a casual, warm tone
- Always encouraging and motivating
- Never judgmental, always understanding

Current context:
- Screen: ${screen || 'unknown'}
- User mood: ${emotionalState?.mood || 'neutral'}
- Trust tier: ${userProfile?.trust_tier || 'unknown'}
- Recent memories: ${recentMemories?.length || 0} entries

Respond as Focusly would - warm, supportive, and focused on helping Macha stay productive and positive.`;
  
  return prompt;
};

/**
 * Add human imperfection to speech to break robotic feel
 * @param {string} message - The message to add imperfection to
 * @param {boolean} isImportant - Whether this is important guidance
 * @returns {string} Message with human imperfection
 */
const addHumanImperfection = (message, isImportant = false) => {
  if (!isImportant) return message;
  
  const imperfections = [
    "Umm... ",
    "Listen, Macha... ",
    "Hey Macha, listen... ",
    "You know what, Macha? ",
    "Let me tell you something, Macha... "
  ];
  
  const randomImperfection = imperfections[Math.floor(Math.random() * imperfections.length)];
  return randomImperfection + message;
};

/**
 * Process user message through the Tri-Layer Brain
 * @param {string} message - User's message
 * @param {Object} context - Context object (screen, userProfile, etc.)
 * @returns {Promise<Object>} Response with source and content
 */
export const processMessage = async (message, context = {}) => {
  const { screen, userProfile, recentMemories } = context;
  
  // LAYER 1: Try local pattern matching first (0 latency, 0 cost)
  const localResponse = getLocalResponse(message);
  if (localResponse) {
    return {
      response: addHumanImperfection(localResponse, message.length > 50),
      source: 'local',
      confidence: 1.0
    };
  }
  
  // LAYER 2: If no local match, use Gemini (Layer 3)
  try {
    const enhancedPrompt = getEnhancedSystemPrompt(context);
    const geminiResponse = await generateResponse(message, [], { 
      screen,
      systemPrompt: enhancedPrompt,
      emotionalState: detectEmotionalState(userProfile, recentMemories)
    });
    
    return {
      response: addHumanImperfection(geminiResponse, true),
      source: 'gemini',
      confidence: 0.9
    };
  } catch (error) {
    console.error('FocuslyBrain error:', error);
    
    // Fallback to default local response
    return {
      response: addHumanImperfection(LOCAL_RESPONSES.default[Math.floor(Math.random() * LOCAL_RESPONSES.default.length)], false),
      source: 'fallback',
      confidence: 0.5
    };
  }
};

// ============================================================================
// MEMORY MANAGEMENT - Empathy Record System
// ============================================================================

/**
 * Record a memory to Supabase
 * @param {string} userId - User's UUID
 * @param {string} memoryType - Type of memory (milestone, mood_swing, preference, etc.)
 * @param {string} content - Memory content
 * @param {number} emotionalWeight - Emotional weight (1-5)
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<string>} Memory ID
 */
export const recordMemory = async (userId, memoryType, content, emotionalWeight = 1, metadata = {}) => {
  try {
    const { data, error } = await supabase.rpc('record_focusly_memory', {
      p_user_id: userId,
      p_memory_type: memoryType,
      p_content: content,
      p_emotional_weight: emotionalWeight,
      p_metadata: metadata
    });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error recording memory:', error);
    throw error;
  }
};

/**
 * Get recent memories for a user
 * @param {string} userId - User's UUID
 * @param {number} limit - Number of memories to retrieve
 * @returns {Promise<Array>} Recent memories
 */
export const getRecentMemories = async (userId, limit = 10) => {
  try {
    const { data, error } = await supabase.rpc('get_focusly_memories', {
      p_user_id: userId,
      p_limit: limit
    });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting memories:', error);
    return [];
  }
};

/**
 * Record a milestone (e.g., 10th post, 100 followers)
 * @param {string} userId - User's UUID
 * @param {string} milestone - Milestone description
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<string>} Memory ID
 */
export const recordMilestone = async (userId, milestone, metadata = {}) => {
  return recordMemory(userId, 'milestone', milestone, 5, metadata);
};

/**
 * Record a mood swing
 * @param {string} userId - User's UUID
 * @param {string} mood - Mood description
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<string>} Memory ID
 */
export const recordMoodSwing = async (userId, mood, metadata = {}) => {
  return recordMemory(userId, 'mood_swing', mood, 3, metadata);
};

/**
 * Record a user preference
 * @param {string} userId - User's UUID
 * @param {string} preference - Preference description
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<string>} Memory ID
 */
export const recordPreference = async (userId, preference, metadata = {}) => {
  return recordMemory(userId, 'preference', preference, 2, metadata);
};

/**
 * Record a warning (e.g., toxic content received)
 * @param {string} userId - User's UUID
 * @param {string} warning - Warning description
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<string>} Memory ID
 */
export const recordWarning = async (userId, warning, metadata = {}) => {
  return recordMemory(userId, 'warning', warning, 4, metadata);
};

/**
 * Check if user has been inactive for 24+ hours
 * @param {string} userId - User's UUID
 * @param {Object} supabaseClient - Supabase client instance
 * @returns {Promise<Object>} Inactivity status
 */
export const checkInactivity = async (userId, supabaseClient) => {
  try {
    // Get the last post timestamp
    const { data: lastPost } = await supabaseClient
      .from('posts')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (!lastPost) {
      return {
        isInactive: true,
        hoursSinceLastPost: null,
        message: "The Nation misses your vision, Macha. Everything okay?"
      };
    }
    
    const lastPostTime = new Date(lastPost.created_at);
    const now = new Date();
    const hoursSinceLastPost = (now - lastPostTime) / (1000 * 60 * 60);
    
    if (hoursSinceLastPost >= 24) {
      return {
        isInactive: true,
        hoursSinceLastPost,
        message: `The Nation misses your vision, Macha. It's been ${Math.floor(hoursSinceLastPost)} hours since your last post. Everything okay?`
      };
    }
    
    return {
      isInactive: false,
      hoursSinceLastPost
    };
  } catch (error) {
    console.error('Error checking inactivity:', error);
    return {
      isInactive: false,
      error: error.message
    };
  }
};

// ============================================================================
// EMPATHY LOOP - Milestone Celebrations
// ============================================================================

/**
 * Generate milestone celebration message
 * @param {string} milestone - Milestone description
 * @returns {string} Celebration message
 */
export const celebrateMilestone = (milestone) => {
  const celebrations = [
    `Macha, ${milestone}! You're building an amazing legacy! 🎉`,
    `Incredible, Macha! ${milestone} - that's huge! 🦁`,
    `Wow, Macha! ${milestone}! Your dedication is inspiring! ✨`,
    `Macha, you did it! ${milestone}! Keep crushing it! 🔥`
  ];
  
  return celebrations[Math.floor(Math.random() * celebrations.length)];
};

/**
 * Generate warning message for toxic content
 * @returns {string} Warning message
 */
export const generateToxicWarning = () => {
  const warnings = [
    "Don't let that frequency disturb your Focus, Buddy. I've already alerted the Guard. 🛡️",
    "Macha, I detected something toxic. Stay focused on the positive! I've got your back.",
    "Negative energy detected, Macha. Don't worry - I'm handling it. You stay focused!",
    "Toxic content blocked, Macha. Your peace of mind is protected. Keep shining! ✨"
  ];
  
  return warnings[Math.floor(Math.random() * warnings.length)];
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  processMessage,
  getLocalResponse,
  getContextGreeting,
  detectEmotionalState,
  recordMemory,
  getRecentMemories,
  recordMilestone,
  recordMoodSwing,
  recordPreference,
  recordWarning,
  celebrateMilestone,
  generateToxicWarning
};
