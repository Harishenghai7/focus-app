/**
 * Logs a performance metric for analytics.
 * @param {string} metricName - The name of the metric.
 * @param {number} value - The value of the metric.
 * @example
 * logPerformance('load_time', 1200);
 */
export function logPerformance(metricName, value) {
  // Integrate with analytics provider here
  console.log(`[Analytics] Performance: ${metricName} = ${value}`);
}
