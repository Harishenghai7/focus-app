/**
 * sanitizeHTML
 * Remove dangerous HTML tags.
 * @param {string} html
 * @returns {string} sanitized
 * @example sanitizeHTML('<script>alert(1)</script>')
 */
export default function sanitizeHTML(html) {
  return html.replace(/<script.*?>.*?<\/script>/gi, '').replace(/on\w+=".*?"/gi, '');
}
