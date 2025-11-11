/**
 * Color Contrast Utility
 * Provides functions to check and ensure WCAG color contrast requirements
 */

/**
 * Convert hex color to RGB
 */
export const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Calculate relative luminance
 */
export const getLuminance = (r, g, b) => {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1, color2) => {
  // Convert colors to RGB if they're hex
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if contrast ratio meets WCAG standards
 * @param {number} ratio - Contrast ratio
 * @param {string} level - 'AA' or 'AAA'
 * @param {string} size - 'normal' or 'large' (18pt+ or 14pt+ bold)
 */
export const meetsWCAG = (ratio, level = 'AA', size = 'normal') => {
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  // AA level (default)
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Check if two colors have sufficient contrast
 */
export const hasGoodContrast = (foreground, background, level = 'AA', size = 'normal') => {
  const ratio = getContrastRatio(foreground, background);
  return meetsWCAG(ratio, level, size);
};

/**
 * Get contrast level description
 */
export const getContrastLevel = (ratio) => {
  if (ratio >= 7) return 'AAA (Enhanced)';
  if (ratio >= 4.5) return 'AA (Minimum)';
  if (ratio >= 3) return 'AA Large Text';
  return 'Fail';
};

/**
 * Suggest accessible color based on background
 */
export const suggestAccessibleColor = (backgroundColor, preferredColor, level = 'AA', size = 'normal') => {
  const ratio = getContrastRatio(preferredColor, backgroundColor);
  
  if (meetsWCAG(ratio, level, size)) {
    return preferredColor;
  }
  
  // If preferred color doesn't meet standards, suggest black or white
  const bgRgb = typeof backgroundColor === 'string' ? hexToRgb(backgroundColor) : backgroundColor;
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Use white text on dark backgrounds, black on light backgrounds
  return bgLuminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Validate color palette for accessibility
 */
export const validateColorPalette = (palette) => {
  const results = [];
  
  // Check common combinations
  const combinations = [
    { fg: palette.text, bg: palette.background, name: 'Text on Background' },
    { fg: palette.textSecondary, bg: palette.background, name: 'Secondary Text on Background' },
    { fg: palette.primary, bg: palette.background, name: 'Primary on Background' },
    { fg: palette.white, bg: palette.primary, name: 'White on Primary' },
    { fg: palette.text, bg: palette.card, name: 'Text on Card' },
  ];
  
  combinations.forEach(({ fg, bg, name }) => {
    if (!fg || !bg) return;
    
    const ratio = getContrastRatio(fg, bg);
    const passesAA = meetsWCAG(ratio, 'AA', 'normal');
    const passesAAA = meetsWCAG(ratio, 'AAA', 'normal');
    
    results.push({
      name,
      foreground: fg,
      background: bg,
      ratio: ratio.toFixed(2),
      passesAA,
      passesAAA,
      level: getContrastLevel(ratio)
    });
  });
  
  return results;
};

/**
 * High contrast color palette
 */
export const highContrastPalette = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#1a1a1a',
    primary: '#0000FF',
    primaryHover: '#0000CC',
    secondary: '#008000',
    error: '#CC0000',
    warning: '#FF8C00',
    success: '#006400',
    border: '#000000',
    card: '#FFFFFF',
    hover: '#F0F0F0',
    focus: '#0000FF',
  },
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#E0E0E0',
    primary: '#00BFFF',
    primaryHover: '#1E90FF',
    secondary: '#00FF00',
    error: '#FF4444',
    warning: '#FFD700',
    success: '#00FF00',
    border: '#FFFFFF',
    card: '#1a1a1a',
    hover: '#2a2a2a',
    focus: '#00BFFF',
  }
};

/**
 * Apply high contrast mode
 */
export const applyHighContrastMode = (isDarkMode = false) => {
  const palette = isDarkMode ? highContrastPalette.dark : highContrastPalette.light;
  const root = document.documentElement;
  
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Add high contrast class
  document.body.classList.add('high-contrast-mode');
};

/**
 * Remove high contrast mode
 */
export const removeHighContrastMode = () => {
  document.body.classList.remove('high-contrast-mode');
  
  // Reset CSS variables to default
  const root = document.documentElement;
  const defaultStyles = getComputedStyle(document.body);
  
  // This will revert to the original theme
  root.removeAttribute('style');
};

/**
 * Check if user prefers high contrast
 */
export const prefersHighContrast = () => {
  return window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Listen for contrast preference changes
 */
export const watchContrastPreference = (callback) => {
  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  
  const handler = (e) => {
    callback(e.matches);
  };
  
  // Modern browsers
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }
  
  // Fallback for older browsers
  mediaQuery.addListener(handler);
  return () => mediaQuery.removeListener(handler);
};

export default {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsWCAG,
  hasGoodContrast,
  getContrastLevel,
  suggestAccessibleColor,
  validateColorPalette,
  highContrastPalette,
  applyHighContrastMode,
  removeHighContrastMode,
  prefersHighContrast,
  watchContrastPreference,
};
