/**
 * validateURL
 * URL format validation.
 * @param {string} url
 * @returns {boolean} valid
 * @example validateURL('https://example.com')
 */
export default function validateURL(url) {
  return /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/\S*)?$/.test(url);
}
