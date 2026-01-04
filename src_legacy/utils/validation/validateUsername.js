/**
 * validateUsername
 * Username rules validation.
 * @param {string} username
 * @returns {boolean} valid
 * @example validateUsername('user_123')
 */
export default function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}
