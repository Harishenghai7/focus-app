/**
 * extractPhoneNumbers
 * Extract phone numbers from text.
 * @param {string} text
 * @returns {Array<string>} phoneNumbers
 * @example extractPhoneNumbers('Call +1-555-123-4567')
 */
export default function extractPhoneNumbers(text) {
  return (text.match(/\+?\d[\d\s\-]{7,}\d/g) || []);
}
