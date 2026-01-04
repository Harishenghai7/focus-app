/**
 * Logs an error event for analytics.
 * @param {Error|string} error - The error object or message.
 * @param {object} [context] - Additional context.
 * @example
 * logError(new Error('Network failed'), { url: '/api/data' });
 */
export function logError(error, context = {}) {
  // Integrate with analytics provider here
  console.error(`[Analytics] Error:`, error, context);
}
