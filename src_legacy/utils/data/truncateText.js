/**
 * truncateText
 * Smart text truncation with ellipsis.
 * @param {string} text
 * @param {number} maxLength
 * @returns {string} truncated
 * @example truncateText('Hello world', 5)
 */
export default function truncateText(text, maxLength) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}
