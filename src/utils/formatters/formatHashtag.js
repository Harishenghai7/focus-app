/**
 * Formats a hashtag for display.
 * @param {string} tag - The hashtag.
 * @returns {string}
 * @example
 * formatHashtag('FocusApp');
 */
export function formatHashtag(tag) {
  return '#' + tag.replace(/\s+/g, '').toLowerCase();
}
