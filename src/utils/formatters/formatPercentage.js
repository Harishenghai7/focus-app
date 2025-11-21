/**
 * Formats a number as a percentage with specified decimal places.
 * @param {number} value - The value to format (0-100 or 0-1 depending on normalize param)
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places (default: 1)
 * @param {boolean} options.normalize - If true, treats input as 0-1 and multiplies by 100
 * @param {boolean} options.showSign - If true, shows + for positive values
 * @returns {string}
 * @example
 * formatPercentage(45.678); // "45.7%"
 * formatPercentage(0.456, { normalize: true }); // "45.6%"
 * formatPercentage(12.5, { showSign: true }); // "+12.5%"
 */
export function formatPercentage(value, options = {}) {
  const {
    decimals = 1,
    normalize = false,
    showSign = false
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  const normalizedValue = normalize ? value * 100 : value;
  const rounded = Number(normalizedValue.toFixed(decimals));
  const sign = showSign && rounded > 0 ? '+' : '';
  
  return `${sign}${rounded}%`;
}

/**
 * Formats a number in a compact way (1K, 1M, etc.)
 * @param {number} num - The number to format
 * @param {Object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places (default: 1)
 * @returns {string}
 * @example
 * formatCompactNumber(1500); // "1.5K"
 * formatCompactNumber(1500000); // "1.5M"
 */
export function formatCompactNumber(num, options = {}) {
  const { decimals = 1 } = options;

  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(decimals)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimals)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(decimals)}K`;
  }
  
  return num.toString();
}

/**
 * Calculates percentage change between two values
 * @param {number} oldValue - The original value
 * @param {number} newValue - The new value
 * @returns {number} The percentage change
 * @example
 * calculatePercentageChange(100, 150); // 50
 * calculatePercentageChange(200, 150); // -25
 */
export function calculatePercentageChange(oldValue, newValue) {
  if (!oldValue || oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  
  return ((newValue - oldValue) / oldValue) * 100;
}
