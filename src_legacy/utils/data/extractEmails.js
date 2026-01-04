/**
 * extractEmails
 * Extract email addresses from text.
 * @param {string} text
 * @returns {Array<string>} emails
 * @example extractEmails('Contact me at test@example.com')
 */
export default function extractEmails(text) {
  return (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []);
}
