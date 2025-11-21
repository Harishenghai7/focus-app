/**
 * Tracks a custom event for analytics.
 * @param {string} eventName - The name of the event.
 * @param {object} [params] - Additional event parameters.
 * @example
 * trackEvent('like_post', { postId: '123' });
 */
export function trackEvent(eventName, params = {}) {
  // Integrate with analytics provider here
  console.log(`[Analytics] Event: ${eventName}`, params);
}
