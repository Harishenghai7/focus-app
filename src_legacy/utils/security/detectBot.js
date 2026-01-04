/**
 * detectBot
 * Bot detection logic (simple heuristics).
 * @param {string} userAgent
 * @returns {boolean} isBot
 * @example detectBot('Mozilla/5.0 ...')
 */
function detectBot(userAgent) {
  return /bot|crawl|spider|slurp|bing|duckduckgo|baidu|yandex/i.test(userAgent);
}

export { detectBot };
export default detectBot;
