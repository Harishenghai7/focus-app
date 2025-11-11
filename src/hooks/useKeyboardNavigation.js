import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for keyboard navigation and shortcuts
 * Provides keyboard accessibility for common actions
 */
export const useKeyboardNavigation = (options = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    enabled = true,
    trapFocus = false,
    containerRef
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);
      const isContentEditable = e.target.isContentEditable;

      if (isInputField || isContentEditable) {
        // Allow Escape to blur input fields
        if (e.key === 'Escape' && onEscape) {
          e.target.blur();
          onEscape(e);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (onEscape) {
            e.preventDefault();
            onEscape(e);
          }
          break;
        case 'Enter':
          if (onEnter) {
            e.preventDefault();
            onEnter(e);
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
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);

  // Focus trap for modals
  useEffect(() => {
    if (!trapFocus || !containerRef?.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [trapFocus, containerRef]);
};

/**
 * Hook for global keyboard shortcuts
 */
export const useKeyboardShortcuts = (enabled = true) => {
  const navigate = useNavigate();
  const shortcutsRef = useRef(new Map());

  const registerShortcut = useCallback((key, modifiers, callback, description) => {
    const shortcutKey = createShortcutKey(key, modifiers);
    shortcutsRef.current.set(shortcutKey, { callback, description });
  }, []);

  const unregisterShortcut = useCallback((key, modifiers) => {
    const shortcutKey = createShortcutKey(key, modifiers);
    shortcutsRef.current.delete(shortcutKey);
  }, []);

  const createShortcutKey = (key, modifiers = {}) => {
    const parts = [];
    if (modifiers.ctrl) parts.push('ctrl');
    if (modifiers.alt) parts.push('alt');
    if (modifiers.shift) parts.push('shift');
    if (modifiers.meta) parts.push('meta');
    parts.push(key.toLowerCase());
    return parts.join('+');
  };

  useEffect(() => {
    if (!enabled) return;

    // Register default shortcuts
    const shortcuts = [
      { key: 'h', modifiers: { alt: true }, action: () => navigate('/home'), description: 'Go to Home' },
      { key: 'e', modifiers: { alt: true }, action: () => navigate('/explore'), description: 'Go to Explore' },
      { key: 'c', modifiers: { alt: true }, action: () => navigate('/create'), description: 'Create Post' },
      { key: 'b', modifiers: { alt: true }, action: () => navigate('/boltz'), description: 'Go to Boltz' },
      { key: 'p', modifiers: { alt: true }, action: () => navigate('/profile'), description: 'Go to Profile' },
      { key: 'm', modifiers: { alt: true }, action: () => navigate('/messages'), description: 'Go to Messages' },
      { key: 'n', modifiers: { alt: true }, action: () => navigate('/notifications'), description: 'Go to Notifications' },
      { key: 's', modifiers: { alt: true }, action: () => navigate('/settings'), description: 'Go to Settings' },
      { key: '/', modifiers: {}, action: () => {
        const searchInput = document.querySelector('.search-input');
        searchInput?.focus();
      }, description: 'Focus Search' },
    ];

    shortcuts.forEach(({ key, modifiers, action, description }) => {
      registerShortcut(key, modifiers, action, description);
    });

    const handleKeyPress = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      const shortcutKey = createShortcutKey(e.key, {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey
      });

      const shortcut = shortcutsRef.current.get(shortcutKey);
      if (shortcut) {
        e.preventDefault();
        shortcut.callback(e);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      shortcutsRef.current.clear();
    };
  }, [enabled, navigate, registerShortcut]);

  const getAllShortcuts = useCallback(() => {
    return Array.from(shortcutsRef.current.entries()).map(([key, { description }]) => ({
      key,
      description
    }));
  }, []);

  return {
    registerShortcut,
    unregisterShortcut,
    getAllShortcuts
  };
};

/**
 * Hook for managing focus within a component
 */
export const useFocusManagement = (containerRef, options = {}) => {
  const {
    autoFocus = false,
    restoreFocus = true,
    initialFocusRef
  } = options;

  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!containerRef?.current) return;

    // Store previous focus
    if (restoreFocus) {
      previousFocusRef.current = document.activeElement;
    }

    // Auto focus
    if (autoFocus) {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const firstFocusable = containerRef.current.querySelector(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }

    return () => {
      // Restore previous focus
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [containerRef, autoFocus, restoreFocus, initialFocusRef]);

  const focusFirst = useCallback(() => {
    if (!containerRef?.current) return;
    const firstFocusable = containerRef.current.querySelector(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [containerRef]);

  const focusLast = useCallback(() => {
    if (!containerRef?.current) return;
    const focusableElements = containerRef.current.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const lastFocusable = focusableElements[focusableElements.length - 1];
    lastFocusable?.focus();
  }, [containerRef]);

  return {
    focusFirst,
    focusLast
  };
};

/**
 * Hook for roving tabindex (for lists and grids)
 */
export const useRovingTabIndex = (containerRef, options = {}) => {
  const {
    direction = 'vertical', // 'vertical', 'horizontal', or 'both'
    loop = true,
    selector = '[role="option"], [role="menuitem"], [role="tab"]'
  } = options;

  const currentIndexRef = useRef(0);

  useEffect(() => {
    if (!containerRef?.current) return;

    const container = containerRef.current;

    const handleKeyDown = (e) => {
      const items = Array.from(container.querySelectorAll(selector));
      if (items.length === 0) return;

      const currentIndex = items.findIndex(item => item === document.activeElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      const isVertical = direction === 'vertical' || direction === 'both';
      const isHorizontal = direction === 'horizontal' || direction === 'both';

      if (isVertical && e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1;
        }
      } else if (isVertical && e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0;
        }
      } else if (isHorizontal && e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1;
        }
      } else if (isHorizontal && e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0;
        }
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = items.length - 1;
      }

      if (nextIndex !== currentIndex) {
        items[nextIndex]?.focus();
        currentIndexRef.current = nextIndex;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, direction, loop, selector]);
};

export default useKeyboardNavigation;
