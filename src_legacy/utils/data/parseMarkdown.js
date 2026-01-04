import { marked } from 'marked';

/**
 * parseMarkdown
 * Convert markdown to HTML safely.
 * @param {string} markdown
 * @returns {string} html
 * @example parseMarkdown('# Title')
 */
export default function parseMarkdown(markdown) {
  return marked.parse(markdown, { sanitize: true });
}
