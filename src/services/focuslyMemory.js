/**
 * Focusly Memory Service - Persistent User Memory System
 * Remembers user details, preferences, and conversation context
 */

import { supabase } from '../lib/supabaseClient';

/**
 * Store a memory about the user
 * @param {string} userId - User ID
 * @param {string} memoryType - Type: 'fact', 'preference', 'event', 'emotion', 'achievement'
 * @param {string} memoryContent - Memory content
 * @param {number} importance - Importance level (1-10)
 * @returns {Promise<Object>}
 */
export const storeMemory = async (userId, memoryType, memoryContent, importance = 5) => {
  try {
    const { data, error } = await supabase
      .from('focusly_memory')
      .insert({
        user_id: userId,
        memory_type: memoryType,
        content: memoryContent,
        importance: importance,
        created_at: new Date().toISOString(),
        last_accessed: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error storing memory:', error);
      return null;
    }
    
    return data;
  } catch (err) {
    console.error('Memory storage error:', err);
    return null;
  }
};

/**
 * Retrieve relevant memories for context
 * @param {string} userId - User ID
 * @param {number} limit - Maximum memories to retrieve
 * @returns {Promise<Array>}
 */
export const retrieveMemories = async (userId, limit = 20) => {
  try {
    const { data, error } = await supabase
      .from('focusly_memory')
      .select('*')
      .eq('user_id', userId)
      .order('importance', { ascending: false })
      .order('last_accessed', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error retrieving memories:', error);
      return [];
    }
    
    // Update last_accessed timestamps
    if (data && data.length > 0) {
      const memoryIds = data.map(m => m.id);
      await supabase
        .from('focusly_memory')
        .update({ last_accessed: new Date().toISOString() })
        .in('id', memoryIds);
    }
    
    return data || [];
  } catch (err) {
    console.error('Memory retrieval error:', err);
    return [];
  }
};

/**
 * Get structured user profile from memories
 * @param {string} userId - User ID
 * @returns {Promise<Object>}
 */
export const getUserProfile = async (userId) => {
  const memories = await retrieveMemories(userId);
  
  const profile = {
    name: null,
    age: null,
    interests: [],
    recentTopics: [],
    achievements: [],
    preferences: {},
  };
  
  memories.forEach(memory => {
    try {
      const content = typeof memory.content === 'string' 
        ? JSON.parse(memory.content) 
        : memory.content;
      
      switch (memory.memory_type) {
        case 'fact':
          if (content.name) profile.name = content.name;
          if (content.age) profile.age = content.age;
          if (content.interest) profile.interests.push(content.interest);
          break;
        case 'preference':
          Object.assign(profile.preferences, content);
          break;
        case 'achievement':
          profile.achievements.push(content);
          break;
        case 'event':
          profile.recentTopics.push(content.topic || content);
          break;
      }
    } catch (e) {
      // Handle plain text memories
      if (memory.memory_type === 'fact') {
        profile.recentTopics.push(memory.content);
      }
    }
  });
  
  // Keep only unique interests
  profile.interests = [...new Set(profile.interests)];
  profile.recentTopics = [...new Set(profile.recentTopics)].slice(0, 5);
  
  return profile;
};

/**
 * Extract key facts from user message
 * @param {string} userMessage - User's message
 * @returns {Object} Extracted facts
 */
export const extractFacts = (userMessage) => {
  const facts = {};
  const lowerMsg = userMessage.toLowerCase();
  
  // Name detection
  const namePatterns = [
    /my name is (\w+)/i,
    /i'?m (\w+)/i,
    /call me (\w+)/i,
    /this is (\w+)/i,
  ];
  
  for (const pattern of namePatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1].length > 1) {
      facts.name = match[1];
      break;
    }
  }
  
  // Age detection
  const ageMatch = userMessage.match(/I(?:'m| am) (\d+) years? old/i);
  if (ageMatch) {
    facts.age = parseInt(ageMatch[1]);
  }
  
  // Interest detection
  const interestPatterns = [
    /I (love|like|enjoy|am interested in) (.+?)(?:\.|!|$)/i,
    /my (?:favorite|fav) (?:thing|hobby) is (.+?)(?:\.|!|$)/i,
  ];
  
  for (const pattern of interestPatterns) {
    const match = userMessage.match(pattern);
    if (match) {
      facts.interest = match[match.length - 1].trim();
      break;
    }
  }
  
  // Goal detection
  if (/I want to|I plan to|my goal is/i.test(userMessage)) {
    facts.goal = userMessage;
  }
  
  return facts;
};

/**
 * Calculate importance of a memory
 * @param {string} content - Memory content
 * @returns {number} Importance score (1-10)
 */
export const calculateImportance = (content) => {
  const text = typeof content === 'string' ? content.toLowerCase() : JSON.stringify(content).toLowerCase();
  
  // High importance keywords
  const highPriority = ['name', 'birthday', 'goal', 'dream', 'family', 'love'];
  const mediumPriority = ['favorite', 'like', 'enjoy', 'hate', 'fear'];
  
  if (highPriority.some(word => text.includes(word))) return 9;
  if (mediumPriority.some(word => text.includes(word))) return 7;
  
  return 5; // Default importance
};

/**
 * Update or create a user fact
 * @param {string} userId - User ID
 * @param {string} factKey - Fact key (e.g., 'name', 'age')
 * @param {any} factValue - Fact value
 */
export const updateUserFact = async (userId, factKey, factValue) => {
  // Check if fact exists
  const { data: existing } = await supabase
    .from('focusly_memory')
    .select('*')
    .eq('user_id', userId)
    .eq('memory_type', 'fact')
    .ilike('content', `%"${factKey}"%`)
    .single();
  
  if (existing) {
    // Update existing fact
    const content = JSON.parse(existing.content);
    content[factKey] = factValue;
    
    await supabase
      .from('focusly_memory')
      .update({ 
        content: JSON.stringify(content),
        last_accessed: new Date().toISOString()
      })
      .eq('id', existing.id);
  } else {
    // Create new fact
    await storeMemory(userId, 'fact', JSON.stringify({ [factKey]: factValue }), 8);
  }
};

/**
 * Clear old, low-importance memories (cleanup function)
 * @param {string} userId - User ID
 * @param {number} daysOld - Delete memories older than this many days
 */
export const cleanOldMemories = async (userId, daysOld = 90) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  await supabase
    .from('focusly_memory')
    .delete()
    .eq('user_id', userId)
    .lt('importance', 5)
    .lt('last_accessed', cutoffDate.toISOString());
};

export default {
  storeMemory,
  retrieveMemories,
  getUserProfile,
  extractFacts,
  calculateImportance,
  updateUserFact,
  cleanOldMemories,
};
