/**
 * encryptData
 * Encrypt sensitive data (mocked for demo).
 * @param {string} data
 * @returns {string} encrypted
 * @example encryptData('secret')
 */
export default function encryptData(data) {
  return btoa(data);
}
