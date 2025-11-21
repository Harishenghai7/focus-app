/**
 * Format large numbers with K, M, B suffixes
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumber(1234) // "1.2K"
 * formatNumber(1234567) // "1.2M"
 * formatNumber(1234567890) // "1.2B"
 * formatNumber(1234, 2) // "1.23K"
 */
export const formatNumber = (num, decimals = 1) => {
  // Handle edge cases
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  // Convert to number if string
  const number = typeof num === 'string' ? parseFloat(num) : num;

  // Handle zero
  if (number === 0) {
    return '0';
  }

  // Handle negative numbers
  const isNegative = number < 0;
  const absNumber = Math.abs(number);

  // Define thresholds and suffixes
  const suffixes = [
    { value: 1e9, suffix: 'B' },  // Billion
    { value: 1e6, suffix: 'M' },  // Million
    { value: 1e3, suffix: 'K' },  // Thousand
  ];

  // Find appropriate suffix
  for (const { value, suffix } of suffixes) {
    if (absNumber >= value) {
      const formatted = (absNumber / value).toFixed(decimals);
      return `${isNegative ? '-' : ''}${formatted}${suffix}`;
    }
  }

  // Return as-is for numbers less than 1000
  return number.toString();
};

/**
 * Format number with custom configuration
 * @param {number} num - The number to format
 * @param {Object} options - Configuration options
 * @param {number} options.decimals - Number of decimal places (default: 1)
 * @param {boolean} options.removeTrailingZeros - Remove trailing zeros (default: false)
 * @param {string} options.separator - Thousands separator for small numbers (default: ',')
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumberAdvanced(1234567, { decimals: 2 }) // "1.23M"
 * formatNumberAdvanced(1200000, { decimals: 1, removeTrailingZeros: true }) // "1.2M"
 * formatNumberAdvanced(1000, { decimals: 2, removeTrailingZeros: true }) // "1K"
 */
export const formatNumberAdvanced = (num, options = {}) => {
  const {
    decimals = 1,
    removeTrailingZeros = false,
    separator = ','
  } = options;

  // Handle edge cases
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const number = typeof num === 'string' ? parseFloat(num) : num;

  if (number === 0) {
    return '0';
  }

  const isNegative = number < 0;
  const absNumber = Math.abs(number);

  const suffixes = [
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' },
  ];

  // Find appropriate suffix
  for (const { value, suffix } of suffixes) {
    if (absNumber >= value) {
      let formatted = (absNumber / value).toFixed(decimals);
      
      // Remove trailing zeros if requested
      if (removeTrailingZeros) {
        formatted = parseFloat(formatted).toString();
      }
      
      return `${isNegative ? '-' : ''}${formatted}${suffix}`;
    }
  }

  // Format small numbers with separator
  if (separator && absNumber >= 1000) {
    const formatted = absNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);
    return `${isNegative ? '-' : ''}${formatted}`;
  }

  return number.toString();
};

/**
 * Format number with compact notation (Intl.NumberFormat)
 * @param {number} num - The number to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @param {Object} options - Additional Intl.NumberFormat options
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumberCompact(1234) // "1.2K"
 * formatNumberCompact(1234567) // "1.2M"
 * formatNumberCompact(1234567, 'de-DE') // "1,2 Mio."
 */
export const formatNumberCompact = (num, locale = 'en-US', options = {}) => {
  // Handle edge cases
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const number = typeof num === 'string' ? parseFloat(num) : num;

  if (number === 0) {
    return '0';
  }

  try {
    return new Intl.NumberFormat(locale, {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
      ...options
    }).format(number);
  } catch (error) {
    // Fallback to basic formatting if Intl is not supported
    return formatNumber(number);
  }
};

/**
 * Get numeric value from formatted string
 * @param {string} formattedNum - The formatted number string (e.g., "1.2K")
 * @returns {number} Numeric value
 * 
 * @example
 * parseFormattedNumber("1.2K") // 1200
 * parseFormattedNumber("2.5M") // 2500000
 * parseFormattedNumber("3.7B") // 3700000000
 */
export const parseFormattedNumber = (formattedNum) => {
  if (!formattedNum || typeof formattedNum !== 'string') {
    return 0;
  }

  const suffixMap = {
    'K': 1e3,
    'M': 1e6,
    'B': 1e9,
  };

  const match = formattedNum.match(/^(-?[\d.]+)([KMB])?$/i);
  
  if (!match) {
    return parseFloat(formattedNum) || 0;
  }

  const [, numStr, suffix] = match;
  const number = parseFloat(numStr);
  const multiplier = suffix ? suffixMap[suffix.toUpperCase()] || 1 : 1;

  return number * multiplier;
};

/**
 * Format number with exact precision
 * @param {number} num - The number to format
 * @param {number} precision - Number of significant figures
 * @returns {string} Formatted number string
 * 
 * @example
 * formatNumberPrecise(1234567, 2) // "1.2M"
 * formatNumberPrecise(1234567, 3) // "1.23M"
 */
export const formatNumberPrecise = (num, precision = 2) => {
  if (num === null || num === undefined || isNaN(num)) {
    return '0';
  }

  const number = typeof num === 'string' ? parseFloat(num) : num;

  if (number === 0) {
    return '0';
  }

  const isNegative = number < 0;
  const absNumber = Math.abs(number);

  const suffixes = [
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' },
  ];

  for (const { value, suffix } of suffixes) {
    if (absNumber >= value) {
      const divided = absNumber / value;
      const formatted = divided.toPrecision(precision);
      return `${isNegative ? '-' : ''}${formatted}${suffix}`;
    }
  }

  return number.toPrecision(precision);
};

export default formatNumber;
