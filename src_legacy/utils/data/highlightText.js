/**
 * highlightText
 * Highlight search terms in text.
 * @param {string} text
 * @param {string} term
 * @returns {string} html
 * @example highlightText('Hello world', 'world')
 */
export default function highlightText(text, term) {
  if (!term) return text;
  const re = new RegExp(`(${term})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}
