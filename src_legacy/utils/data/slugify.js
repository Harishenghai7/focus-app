/**
 * slugify
 * Convert text to URL-friendly slug.
 * @param {string} text
 * @returns {string} slug
 * @example slugify('Hello World!')
 */
export default function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
