/**
 * Extract hashtags from text
 * Regex: /#(\w+)/g
 * @param {string} text - Input text containing hashtags (e.g., "Love this #photo #nature")
 * @returns {string[]} Array of hashtags without # symbol (e.g., ["photo", "nature"])
 * @example
 * extractHashtags("Love this #photo #nature")
 * // Returns: ["photo", "nature"]
 */
export default function extractHashtags(text) {
  // Validate input
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Use regex /#(\w+)/g to match #hashtags
  // Returns array of hashtags without # symbol
  return (text.match(/#(\w+)/g) || []).map(h => h.slice(1));
}
