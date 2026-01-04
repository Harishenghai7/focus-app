/**
 * Formats a username for display.
 * @param {string} username - The username.
 * @returns {string}
 * @example
 * formatUsername('john_doe');
 */
export function formatUsername(username) {
  return '@' + username.replace(/\s+/g, '').toLowerCase();
}
