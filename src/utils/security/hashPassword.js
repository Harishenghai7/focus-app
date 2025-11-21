import sha256 from 'crypto-js/sha256';

/**
 * hashPassword
 * Client-side password hashing.
 * @param {string} password
 * @returns {string} hash
 * @example hashPassword('mypassword')
 */
export default function hashPassword(password) {
  return sha256(password).toString();
}
