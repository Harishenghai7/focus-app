/**
 * validatePhoneNumber
 * Phone number validation.
 * @param {string} phone
 * @returns {boolean} valid
 * @example validatePhoneNumber('+1-555-123-4567')
 */
export default function validatePhoneNumber(phone) {
  return /^\+?\d[\d\s\-]{7,}\d$/.test(phone);
}
