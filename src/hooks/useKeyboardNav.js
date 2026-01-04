import { useEffect, useCallback } from 'react';

export const useKeyboardNav = (options = {}) => {
    const {
        onArrowUp,
        onArrowDown,
        onArrowLeft,
        onArrowRight,
        onEnter,
        onEscape,
        onTab,
        enabled = true
    } = options;

    const handleKeyDown = useCallback((e) => {
        if (!enabled) return;

        switch (e.key) {
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
            case 'Enter':
                if (onEnter) {
                    e.preventDefault();
                    onEnter(e);
                }
                break;
            case 'Escape':
                if (onEscape) {
                    e.preventDefault();
                    onEscape(e);
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
    }, [enabled, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape, onTab]);

    useEffect(() => {
        if (enabled) {
            window.addEventListener('keydown', handleKeyDown);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [enabled, handleKeyDown]);

    return { handleKeyDown };
};
