/**
 * decryptData
 * Decrypt encrypted data (mocked for demo).
 * @param {string} data
 * @returns {string} decrypted
 * @example decryptData('c2VjcmV0')
 */
export default function decryptData(data) {
  return atob(data);
}
