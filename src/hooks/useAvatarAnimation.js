import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Avatar animation states
 */
export const ANIMATION_STATES = {
    IDLE: 'idle',
    WAVE: 'wave',
    JUMP: 'jump',
    DANCE: 'dance',
    THINK: 'think',
    NOD: 'nod',
    SHAKE: 'shake',
    POINT: 'point'
};

/**
 * Avatar expressions
 */
export const EXPRESSIONS = {
    NEUTRAL: 'neutral',
    HAPPY: 'happy',
    SAD: 'sad',
    EXCITED: 'excited',
    SURPRISED: 'surprised',
    THINKING: 'thinking',
    LOVE: 'love',
    CONFUSED: 'confused'
};

/**
 * Custom hook for avatar animation management
 * Handles animation states, expressions, and transitions
 */
export const useAvatarAnimation = () => {
    const [currentAnimation, setCurrentAnimation] = useState(ANIMATION_STATES.IDLE);
    const [currentExpression, setCurrentExpression] = useState(EXPRESSIONS.NEUTRAL);
    const [isBlinking, setIsBlinking] = useState(false);
    const [animationQueue, setAnimationQueue] = useState([]);
    const animationTimeoutRef = useRef(null);
    const blinkIntervalRef = useRef(null);

    // Setup idle animations (blinking)
    useEffect(() => {
        // Random blinking every 3-5 seconds
        const setupBlinking = () => {
            const blinkDelay = 3000 + Math.random() * 2000; // 3-5 seconds

            blinkIntervalRef.current = setTimeout(() => {
                setIsBlinking(true);

                // Blink duration: 150ms
                setTimeout(() => {
                    setIsBlinking(false);
                    setupBlinking(); // Schedule next blink
                }, 150);
            }, blinkDelay);
        };

        setupBlinking();

        return () => {
            if (blinkIntervalRef.current) {
                clearTimeout(blinkIntervalRef.current);
            }
        };
    }, []);

    // Process animation queue
    useEffect(() => {
        if (animationQueue.length > 0 && currentAnimation === ANIMATION_STATES.IDLE) {
            const nextAnimation = animationQueue[0];
            playAnimation(nextAnimation.name, nextAnimation.duration);
            setAnimationQueue(prev => prev.slice(1));
        }
    }, [animationQueue, currentAnimation]);

    /**
     * Play an animation
     * @param {string} animationName - Animation to play
     * @param {number} duration - Duration in milliseconds
     */
    const playAnimation = useCallback((animationName, duration = 1000) => {
        // Clear any existing animation timeout
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }

        setCurrentAnimation(animationName);

        // Return to idle after duration
        animationTimeoutRef.current = setTimeout(() => {
            setCurrentAnimation(ANIMATION_STATES.IDLE);
        }, duration);
    }, []);

    /**
     * Queue an animation
     * @param {string} animationName - Animation to queue
     * @param {number} duration - Duration in milliseconds
     */
    const queueAnimation = useCallback((animationName, duration = 1000) => {
        setAnimationQueue(prev => [...prev, { name: animationName, duration }]);
    }, []);

    /**
     * Set expression
     * @param {string} expression - Expression to set
     * @param {number} duration - Duration (0 = permanent until changed)
     */
    const setExpression = useCallback((expression, duration = 0) => {
        setCurrentExpression(expression);

        if (duration > 0) {
            setTimeout(() => {
                setCurrentExpression(EXPRESSIONS.NEUTRAL);
            }, duration);
        }
    }, []);

    /**
     * Wave animation
     */
    const wave = useCallback(() => {
        playAnimation(ANIMATION_STATES.WAVE, 1500);
    }, [playAnimation]);

    /**
     * Jump animation (for excitement/achievement)
     */
    const jump = useCallback(() => {
        playAnimation(ANIMATION_STATES.JUMP, 800);
    }, [playAnimation]);

    /**
     * Dance animation (for celebration)
     */
    const dance = useCallback(() => {
        playAnimation(ANIMATION_STATES.DANCE, 2000);
    }, [playAnimation]);

    /**
     * Think animation
     */
    const think = useCallback(() => {
        playAnimation(ANIMATION_STATES.THINK, 1500);
    }, [playAnimation]);

    /**
     * Nod animation (yes)
     */
    const nod = useCallback(() => {
        playAnimation(ANIMATION_STATES.NOD, 800);
    }, [playAnimation]);

    /**
     * Shake animation (no)
     */
    const shake = useCallback(() => {
        playAnimation(ANIMATION_STATES.SHAKE, 800);
    }, [playAnimation]);

    /**
     * Point animation
     */
    const point = useCallback(() => {
        playAnimation(ANIMATION_STATES.POINT, 1200);
    }, [playAnimation]);

    /**
     * React to emotion
     * @param {string} emotion - Emotion to react to
     */
    const reactToEmotion = useCallback((emotion) => {
        const reactions = {
            happy: () => {
                setExpression(EXPRESSIONS.HAPPY, 3000);
                jump();
            },
            excited: () => {
                setExpression(EXPRESSIONS.EXCITED, 3000);
                dance();
            },
            sad: () => {
                setExpression(EXPRESSIONS.SAD, 3000);
            },
            surprised: () => {
                setExpression(EXPRESSIONS.SURPRISED, 2000);
            },
            thinking: () => {
                setExpression(EXPRESSIONS.THINKING, 2000);
                think();
            },
            love: () => {
                setExpression(EXPRESSIONS.LOVE, 3000);
            },
            confused: () => {
                setExpression(EXPRESSIONS.CONFUSED, 2000);
            }
        };

        const reaction = reactions[emotion];
        if (reaction) {
            reaction();
        }
    }, [setExpression, jump, dance, think]);

    /**
     * Greeting animation
     */
    const greet = useCallback(() => {
        setExpression(EXPRESSIONS.HAPPY, 2000);
        wave();
    }, [setExpression, wave]);

    /**
     * Celebration animation
     */
    const celebrate = useCallback(() => {
        setExpression(EXPRESSIONS.EXCITED, 3000);
        dance();
    }, [setExpression, dance]);

    /**
     * Clear animation queue
     */
    const clearQueue = useCallback(() => {
        setAnimationQueue([]);
    }, []);

    /**
     * Reset to idle state
     */
    const reset = useCallback(() => {
        if (animationTimeoutRef.current) {
            clearTimeout(animationTimeoutRef.current);
        }
        setCurrentAnimation(ANIMATION_STATES.IDLE);
        setCurrentExpression(EXPRESSIONS.NEUTRAL);
        setAnimationQueue([]);
    }, []);

    return {
        currentAnimation,
        currentExpression,
        isBlinking,
        playAnimation,
        queueAnimation,
        setExpression,
        wave,
        jump,
        dance,
        think,
        nod,
        shake,
        point,
        reactToEmotion,
        greet,
        celebrate,
        clearQueue,
        reset,
        ANIMATION_STATES,
        EXPRESSIONS
    };
};

export default useAvatarAnimation;
