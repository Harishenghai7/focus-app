/**
 * Accessibility Utilities
 * Provides helper functions for ARIA labels, keyboard navigation, and screen reader support
 */

/**
 * Generate descriptive ARIA label for interactive elements
 */
export const generateAriaLabel = (type, context = {}) => {
  const labels = {
    like: (ctx) => `${ctx.isLiked ? 'Unlike' : 'Like'} ${ctx.contentType || 'post'}${ctx.count ? `, ${ctx.count} likes` : ''}`,
    comment: (ctx) => `Comment on ${ctx.contentType || 'post'}${ctx.count ? `, ${ctx.count} comments` : ''}`,
    share: (ctx) => `Share ${ctx.contentType || 'post'}`,
    save: (ctx) => `${ctx.isSaved ? 'Unsave' : 'Save'} ${ctx.contentType || 'post'}${ctx.count ? `, ${ctx.count} saves` : ''}`,
    follow: (ctx) => `${ctx.isFollowing ? 'Unfollow' : 'Follow'} ${ctx.username || 'user'}`,
    notification: (ctx) => `${ctx.unreadCount || 0} unread notifications`,
    message: (ctx) => `Messages${ctx.unreadCount ? `, ${ctx.unreadCount} unread` : ''}`,
    call: () => 'Make a call',
    settings: () => 'Open settings',
    darkMode: (ctx) => `Switch to ${ctx.darkMode ? 'light' : 'dark'} mode`,
    search: () => 'Search users, hashtags, and posts',
    profile: (ctx) => `View ${ctx.username || 'your'} profile`,
    post: (ctx) => `Post by ${ctx.username || 'user'}${ctx.caption ? `: ${ctx.caption.substring(0, 100)}` : ''}`,
    close: () => 'Close',
    back: () => 'Go back',
    menu: () => 'Open menu',
    play: () => 'Play video',
    pause: () => 'Pause video',
    mute: (ctx) => `${ctx.isMuted ? 'Unmute' : 'Mute'} audio`,
    delete: (ctx) => `Delete ${ctx.itemType || 'item'}`,
    edit: (ctx) => `Edit ${ctx.itemType || 'item'}`,
    submit: (ctx) => `Submit ${ctx.formType || 'form'}`,
    cancel: () => 'Cancel',
    confirm: () => 'Confirm',
  };

  const labelFn = labels[type];
  return labelFn ? labelFn(context) : '';
};

/**
 * Format count for screen readers
 */
export const formatCountForScreenReader = (count, singular, plural) => {
  if (count === 0) return `No ${plural}`;
  if (count === 1) return `1 ${singular}`;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)} million ${plural}`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)} thousand ${plural}`;
  return `${count} ${plural}`;
};

/**
 * Announce dynamic content changes to screen readers
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority); // 'polite' or 'assertive'
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Create skip navigation link
 */
export const createSkipLink = (targetId, text = 'Skip to main content') => {
  return {
    href: `#${targetId}`,
    className: 'skip-link',
    text,
    onClick: (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
};

/**
 * Check if element is keyboard accessible
 */
export const isKeyboardAccessible = (element) => {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const interactiveTags = ['a', 'button', 'input', 'select', 'textarea'];
  
  return (
    interactiveTags.includes(tagName) ||
    element.hasAttribute('tabindex') ||
    element.hasAttribute('role')
  );
};

/**
 * Add keyboard navigation to element
 */
export const addKeyboardNavigation = (element, handlers = {}) => {
  if (!element) return;
  
  const {
    onEnter,
    onSpace,
    onEscape,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab
  } = handlers;
  
  element.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'Enter':
        if (onEnter) {
          e.preventDefault();
          onEnter(e);
        }
        break;
      case ' ':
        if (onSpace) {
          e.preventDefault();
          onSpace(e);
        }
        break;
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape(e);
        }
        break;
      case 'ArrowUp':
        if (onArrowUp) {
          e.preventDefault();
          onArrowUp(e);
        }
        break;
      case 'ArrowDown':
        if (onArrowDown) {
          e.preventDefault();
          onArrowDown(e);
        }
        break;
      case 'ArrowLeft':
        if (onArrowLeft) {
          e.preventDefault();
          onArrowLeft(e);
        }
        break;
      case 'ArrowRight':
        if (onArrowRight) {
          e.preventDefault();
          onArrowRight(e);
        }
        break;
      case 'Tab':
        if (onTab) {
          onTab(e);
        }
        break;
      default:
        break;
    }
  });
};

/**
 * Trap focus within a modal or dialog
 */
export const trapFocus = (element) => {
  if (!element) return () => {};
  
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleTabKey);
  
  // Focus first element
  if (firstElement) {
    firstElement.focus();
  }
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

/**
 * Get color contrast ratio
 */
export const getContrastRatio = (color1, color2) => {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color contrast meets WCAG standards
 */
export const meetsContrastRequirements = (color1, color2, level = 'AA', size = 'normal') => {
  const ratio = getContrastRatio(color1, color2);
  
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
  
  // AA level (default)
  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
};

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export const generateUniqueId = (prefix = 'aria') => {
  idCounter++;
  return `${prefix}-${Date.now()}-${idCounter}`;
};

/**
 * Create ARIA live region for announcements
 */
export const createLiveRegion = (priority = 'polite') => {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', priority);
  region.setAttribute('aria-atomic', 'true');
  region.className = 'sr-only';
  document.body.appendChild(region);
  
  return {
    announce: (message) => {
      region.textContent = message;
    },
    destroy: () => {
      document.body.removeChild(region);
    }
  };
};

/**
 * Format time for screen readers
 */
export const formatTimeForScreenReader = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  if (minutes > 0) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  return 'just now';
};

/**
 * Keyboard shortcuts manager
 */
export class KeyboardShortcuts {
  constructor() {
    this.shortcuts = new Map();
    this.handleKeyPress = this.handleKeyPress.bind(this);
    document.addEventListener('keydown', this.handleKeyPress);
  }
  
  register(key, modifiers, callback, description) {
    const shortcutKey = this.createKey(key, modifiers);
    this.shortcuts.set(shortcutKey, { callback, description });
  }
  
  unregister(key, modifiers) {
    const shortcutKey = this.createKey(key, modifiers);
    this.shortcuts.delete(shortcutKey);
  }
  
  createKey(key, modifiers = {}) {
    const parts = [];
    if (modifiers.ctrl) parts.push('ctrl');
    if (modifiers.alt) parts.push('alt');
    if (modifiers.shift) parts.push('shift');
    if (modifiers.meta) parts.push('meta');
    parts.push(key.toLowerCase());
    return parts.join('+');
  }
  
  handleKeyPress(e) {
    // Don't trigger shortcuts when typing in inputs
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
      return;
    }
    
    const shortcutKey = this.createKey(e.key, {
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey
    });
    
    const shortcut = this.shortcuts.get(shortcutKey);
    if (shortcut) {
      e.preventDefault();
      shortcut.callback(e);
    }
  }
  
  getAll() {
    return Array.from(this.shortcuts.entries()).map(([key, { description }]) => ({
      key,
      description
    }));
  }
  
  destroy() {
    document.removeEventListener('keydown', this.handleKeyPress);
    this.shortcuts.clear();
  }
}
