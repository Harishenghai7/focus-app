import { useState, useEffect } from 'react';

export const usePullToRefresh = (onRefresh) => {
    const [refreshing, setRefreshing] = useState(false);
    const [pullStartY, setPullStartY] = useState(0);
    const [dist, setDist] = useState(0);

    const DIST_THRESHOLD = 150;
    const MAX_DIST = 200;

    useEffect(() => {
        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                setPullStartY(e.touches[0].clientY);
            }
        };

        const handleTouchMove = (e) => {
            if (pullStartY === 0) return;
            const y = e.touches[0].clientY;
            const diff = y - pullStartY;

            if (diff > 0) {
                e.preventDefault();
                setDist(Math.min(diff * 0.5, MAX_DIST)); // Resistance
            }
        };

        const handleTouchEnd = async () => {
            if (dist > DIST_THRESHOLD) {
                setRefreshing(true);
                await onRefresh();
                setRefreshing(false);
            }
            setPullStartY(0);
            setDist(0);
        };

        window.addEventListener('touchstart', handleTouchStart, { passive: false });
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [pullStartY, dist, onRefresh, DIST_THRESHOLD, MAX_DIST]);

    return { refreshing, dist };
};
