import { useEffect, useRef, useCallback } from 'react';

export const useSwipeNavigation = (onNext, onPrevious, enabled = true) => {
    const touchStartY = useRef(0);
    const touchStartX = useRef(0);
    const containerRef = useRef(null);

    const handleTouchStart = useCallback((e) => {
        if (!enabled) return;
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
    }, [enabled]);

    const handleTouchEnd = useCallback((e) => {
        if (!enabled) return;

        const touchEndY = e.changedTouches[0].clientY;
        const touchEndX = e.changedTouches[0].clientX;
        const diffY = touchStartY.current - touchEndY;
        const diffX = touchStartX.current - touchEndX;

        // Only trigger if vertical swipe is dominant
        if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
            if (diffY > 0) {
                onNext();
            } else {
                onPrevious();
            }
        }
    }, [enabled, onNext, onPrevious]);

    const handleWheel = useCallback((e) => {
        if (!enabled) return;
        e.preventDefault();

        if (e.deltaY > 0) {
            onNext();
        } else if (e.deltaY < 0) {
            onPrevious();
        }
    }, [enabled, onNext, onPrevious]);

    const handleKeyDown = useCallback((e) => {
        if (!enabled) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNext();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onPrevious();
        }
    }, [enabled, onNext, onPrevious]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });
        container.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('wheel', handleWheel);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleTouchStart, handleTouchEnd, handleWheel, handleKeyDown]);

    return containerRef;
};
