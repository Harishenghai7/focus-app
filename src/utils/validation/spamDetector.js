/**
 * spamDetector
 * Detect spam content (simple heuristics).
 * @param {string} text
 * @returns {boolean} notSpam
 * @example spamDetector('Buy now!')
 */
export default function spamDetector(text) {
  return !/(free|buy now|click here|visit)/i.test(text);
}
