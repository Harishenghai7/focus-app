/**
 * profanityFilter
 * Block inappropriate content (simple word list).
 * @param {string} text
 * @returns {boolean} clean
 * @example profanityFilter('badword')
 */
const badWords = ['badword','offensive','curse'];
export default function profanityFilter(text) {
  return !badWords.some(w => text.toLowerCase().includes(w));
}
