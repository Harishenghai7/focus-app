/**
 * Extract mentions from text
 * Regex: /@(\w+)/g
 * @param {string} text - Input text containing mentions (e.g., "Hello @john and @jane")
 * @returns {string[]} Array of mentioned usernames without @ symbol (e.g., ["john", "jane"])
 * @example
 * extractMentions("Hello @john and @jane")
 * // Returns: ["john", "jane"]
 */
export default function extractMentions(text) {
  // Validate input
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Use regex /@(\w+)/g to match @mentions
  // Returns array of usernames without @ symbol
  return (text.match(/@(\w+)/g) || []).map(m => m.slice(1));
}
