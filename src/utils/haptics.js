/**
 * Haptic Feedback Utility
 * Provides haptic feedback for mobile devices
 */

/**
 * Trigger haptic feedback
 * @param {string} type - Type of haptic feedback: 'light', 'medium', 'heavy', 'success', 'warning', 'error'
 */
export const triggerHaptic = (type = 'light') => {
  // Check if vibration API is supported
  if (!navigator.vibrate) {
    return;
  }

  // Vibration patterns in milliseconds
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30],
    success: [10, 50, 10],
    warning: [20, 100, 20],
    error: [30, 100, 30, 100, 30]
  };

  const pattern = patterns[type] || patterns.light;
  navigator.vibrate(pattern);
};

/**
 * Trigger haptic feedback for button press
 */
export const hapticButtonPress = () => {
  triggerHaptic('light');
};

/**
 * Trigger haptic feedback for success action
 */
export const hapticSuccess = () => {
  triggerHaptic('success');
};

/**
 * Trigger haptic feedback for error
 */
export const hapticError = () => {
  triggerHaptic('error');
};

/**
 * Trigger haptic feedback for warning
 */
export const hapticWarning = () => {
  triggerHaptic('warning');
};

/**
 * Check if haptic feedback is supported
 * @returns {boolean}
 */
export const isHapticSupported = () => {
  return 'vibrate' in navigator;
};

// Default export for backward compatibility
const HapticFeedback = {
  trigger: triggerHaptic,
  buttonPress: hapticButtonPress,
  success: hapticSuccess,
  error: hapticError,
  warning: hapticWarning,
  isSupported: isHapticSupported,
  light: () => triggerHaptic('light'),
  medium: () => triggerHaptic('medium'),
  heavy: () => triggerHaptic('heavy')
};

export default HapticFeedback;
