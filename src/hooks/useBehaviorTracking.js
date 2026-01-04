import { useEffect, useCallback } from 'react';
import { behaviorAnalyzer } from '../utils/behaviorAnalyzer';

export const useBehaviorTracking = (isActive = true) => {
    const handleMouseMove = useCallback((e) => {
        behaviorAnalyzer.trackMouseMove(e);
    }, []);

    const handleClick = useCallback(() => {
        behaviorAnalyzer.trackClick();
    }, []);

    const handleKeyPress = useCallback(() => {
        behaviorAnalyzer.trackKeyPress();
    }, []);

    useEffect(() => {
        if (!isActive) return;

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [isActive, handleMouseMove, handleClick, handleKeyPress]);

    const checkBotStatus = () => {
        return behaviorAnalyzer.analyze();
    };

    return { checkBotStatus };
};
