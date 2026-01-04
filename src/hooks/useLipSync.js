import { useState, useEffect, useCallback, useRef } from 'react';
import { generateLipSyncTimeline, getCurrentViseme, getVisemeFromBoundary, estimateSpeechDuration, VISEMES } from '../utils/lipSyncHelper';

/**
 * Custom hook for lip sync animation
 * Syncs avatar mouth movements with speech
 */
export const useLipSync = (text, isPlaying = false, speechRate = 1) => {
    const [currentViseme, setCurrentViseme] = useState(VISEMES.NEUTRAL);
    const [timeline, setTimeline] = useState([]);
    const animationFrameRef = useRef(null);
    const startTimeRef = useRef(null);

    // Generate lip sync timeline when text changes
    useEffect(() => {
        if (text) {
            const duration = estimateSpeechDuration(text, speechRate);
            const newTimeline = generateLipSyncTimeline(text, duration);
            setTimeline(newTimeline);
        } else {
            setTimeline([]);
            setCurrentViseme(VISEMES.NEUTRAL);
        }
    }, [text, speechRate]);

    // Animate lip sync when playing
    useEffect(() => {
        if (isPlaying && timeline.length > 0) {
            startTimeRef.current = Date.now();

            const animate = () => {
                if (!isPlaying) {
                    setCurrentViseme(VISEMES.NEUTRAL);
                    return;
                }

                const elapsed = Date.now() - startTimeRef.current;
                const viseme = getCurrentViseme(timeline, elapsed);
                setCurrentViseme(viseme);

                // Check if animation is complete
                const lastFrame = timeline[timeline.length - 1];
                if (elapsed < lastFrame.time) {
                    animationFrameRef.current = requestAnimationFrame(animate);
                } else {
                    setCurrentViseme(VISEMES.NEUTRAL);
                }
            };

            animationFrameRef.current = requestAnimationFrame(animate);

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        } else {
            setCurrentViseme(VISEMES.NEUTRAL);
        }
    }, [isPlaying, timeline]);

    /**
     * Handle speech boundary event
     * @param {SpeechSynthesisEvent} event - Boundary event
     */
    const handleBoundary = useCallback((event) => {
        if (text) {
            const viseme = getVisemeFromBoundary(event, text);
            setCurrentViseme(viseme);
        }
    }, [text]);

    /**
     * Reset to neutral
     */
    const reset = useCallback(() => {
        setCurrentViseme(VISEMES.NEUTRAL);
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    }, []);

    return {
        currentViseme,
        timeline,
        handleBoundary,
        reset,
        VISEMES
    };
};

export default useLipSync;
