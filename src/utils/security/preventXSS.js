/**
 * preventXSS
 * XSS attack prevention.
 * @param {string} input
 * @returns {string} safe
 * @example preventXSS('<img src=x onerror=alert(1)>')
 */
export default function preventXSS(input) {
  return input.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&#39;'}[c]));
}
