/**
 * Accessibility helper utilities
 */

export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(announcement);
  announcement.textContent = message;
  
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
  }, 1000);
};

export const setFocusWithDelay = (element, delay = 100) => {
  if (!element) return;
  
  setTimeout(() => {
    if (element.focus) {
      element.focus();
    }
  }, delay);
};

export const trapFocus = (container) => {
  if (!container) return () => {};
  
  const focusableElements = container.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          lastFocusable?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          firstFocusable?.focus();
          e.preventDefault();
        }
      }
    }
    
    if (e.key === 'Escape') {
      container.dispatchEvent(new CustomEvent('focustrap:escape'));
    }
  };
  
  container.addEventListener('keydown', handleKeyDown);
  firstFocusable?.focus();
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
};

export const getAriaLabel = (element) => {
  if (!element) return '';
  
  return element.getAttribute('aria-label') ||
         element.getAttribute('aria-labelledby') ||
         element.getAttribute('title') ||
         element.textContent ||
         '';
};

export const setAriaLabel = (element, label) => {
  if (!element) return;
  element.setAttribute('aria-label', label);
};

export const toggleAriaExpanded = (element) => {
  if (!element) return;
  
  const isExpanded = element.getAttribute('aria-expanded') === 'true';
  element.setAttribute('aria-expanded', (!isExpanded).toString());
  return !isExpanded;
};

export const setAriaExpanded = (element, expanded) => {
  if (!element) return;
  element.setAttribute('aria-expanded', expanded.toString());
};

export const updateAriaPressed = (element, pressed) => {
  if (!element) return;
  element.setAttribute('aria-pressed', pressed.toString());
};

export const setAriaHidden = (element, hidden) => {
  if (!element) return;
  element.setAttribute('aria-hidden', hidden.toString());
  
  if (hidden) {
    element.setAttribute('tabindex', '-1');
  } else {
    element.removeAttribute('tabindex');
  }
};

export const addAriaDescription = (element, description) => {
  if (!element || !description) return;
  
  const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
  const descElement = document.createElement('div');
  descElement.id = descId;
  descElement.className = 'sr-only';
  descElement.textContent = description;
  descElement.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  
  document.body.appendChild(descElement);
  element.setAttribute('aria-describedby', descId);
  
  return () => {
    if (descElement.parentNode) {
      descElement.parentNode.removeChild(descElement);
    }
    element.removeAttribute('aria-describedby');
  };
};

export const isElementVisible = (element) => {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return rect.width > 0 &&
         rect.height > 0 &&
         style.visibility !== 'hidden' &&
         style.display !== 'none' &&
         style.opacity !== '0';
};

export const getNextFocusableElement = (currentElement, container = document.body) => {
  const focusableElements = Array.from(container.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  )).filter(isElementVisible);
  
  const currentIndex = focusableElements.indexOf(currentElement);
  const nextIndex = (currentIndex + 1) % focusableElements.length;
  
  return focusableElements[nextIndex];
};

export const getPreviousFocusableElement = (currentElement, container = document.body) => {
  const focusableElements = Array.from(container.querySelectorAll(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  )).filter(isElementVisible);
  
  const currentIndex = focusableElements.indexOf(currentElement);
  const previousIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
  
  return focusableElements[previousIndex];
};

export const createSkipLink = (targetId, text = 'Skip to main content') => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
    border-radius: 0 0 4px 4px;
  `;
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0';
  });
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });
  
  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  return skipLink;
};

export const ensureContrastRatio = (foregroundColor, backgroundColor, targetRatio = 4.5) => {
  const contrast = calculateContrastRatio(foregroundColor, backgroundColor);
  
  if (contrast >= targetRatio) {
    return { foregroundColor, backgroundColor, contrast };
  }
  
  // Try to adjust the foreground color
  const adjustedForeground = adjustColorForContrast(foregroundColor, backgroundColor, targetRatio);
  
  return {
    foregroundColor: adjustedForeground,
    backgroundColor,
    contrast: calculateContrastRatio(adjustedForeground, backgroundColor)
  };
};

const calculateContrastRatio = (color1, color2) => {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

const getLuminance = (color) => {
  const rgb = hexToRgb(color);
  if (!rgb) return 0;
  
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const adjustColorForContrast = (color, backgroundColor, targetRatio) => {
  // Simple implementation - in practice, you'd want more sophisticated color adjustment
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  // Try making the color darker or lighter
  const adjustedRgb = { ...rgb };
  const contrast = calculateContrastRatio(color, backgroundColor);
  
  if (contrast < targetRatio) {
    // Make darker
    adjustedRgb.r = Math.max(0, adjustedRgb.r - 50);
    adjustedRgb.g = Math.max(0, adjustedRgb.g - 50);
    adjustedRgb.b = Math.max(0, adjustedRgb.b - 50);
  }
  
  return `#${adjustedRgb.r.toString(16).padStart(2, '0')}${adjustedRgb.g.toString(16).padStart(2, '0')}${adjustedRgb.b.toString(16).padStart(2, '0')}`;
};

export default {
  announceToScreenReader,
  setFocusWithDelay,
  trapFocus,
  getAriaLabel,
  setAriaLabel,
  toggleAriaExpanded,
  setAriaExpanded,
  updateAriaPressed,
  setAriaHidden,
  addAriaDescription,
  isElementVisible,
  getNextFocusableElement,
  getPreviousFocusableElement,
  createSkipLink,
  ensureContrastRatio
};
