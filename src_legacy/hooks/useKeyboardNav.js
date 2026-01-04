import { useEffect, useCallback } from 'react';

export const useKeyboardNav = (handlers = {}) => {
  const {
    onNext,
    onPrev,
    onEscape,
    onEnter,
    onSave,
    enabled = true
  } = handlers;

  const handleKeyDown = useCallback((event) => {
    if (!enabled) return;

    // Cmd/Ctrl + Arrow Right - Next
    if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowRight' && onNext) {
      event.preventDefault();
      onNext();
    }

    // Cmd/Ctrl + Arrow Left - Previous
    if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowLeft' && onPrev) {
      event.preventDefault();
      onPrev();
    }

    // Escape key
    if (event.key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
    }

    // Enter key (with Cmd/Ctrl for submit)
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && onEnter) {
      event.preventDefault();
      onEnter();
    }

    // Cmd/Ctrl + S - Save draft
    if ((event.metaKey || event.ctrlKey) && event.key === 's' && onSave) {
      event.preventDefault();
      onSave();
    }
  }, [onNext, onPrev, onEscape, onEnter, onSave, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
};
