/**
 * useBoltzIntersection — Focus App v2.0
 *
 * IntersectionObserver-based video play/pause for the Boltz feed.
 * Replaces the swipe-index approach with viewport detection.
 *
 * Features:
 * - Auto-play when 65%+ of video is visible
 * - Auto-pause when card leaves viewport
 * - Pre-load N+1 and N+2 videos
 * - Release memory for N-3 and beyond
 *
 * Usage:
 *   const { registerRef, activeIndex } = useBoltzIntersection(boltz.length);
 *   // then: <div ref={el => registerRef(el, index)}>
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const VISIBLE_THRESHOLD = 0.65;
const PRELOAD_BUFFER = 2;
const RELEASE_BUFFER = 3;

export const useBoltzIntersection = (totalCount = 0, onActiveChange) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const refsMap = useRef(new Map()); // index → DOM element
    const observerRef = useRef(null);

    const registerRef = useCallback((el, index) => {
        if (el) {
            refsMap.current.set(index, el);
        } else {
            refsMap.current.delete(index);
        }
    }, []);

    useEffect(() => {
        // Clean up old observer
        if (observerRef.current) {
            observerRef.current.disconnect();
        }

        const observer = new IntersectionObserver(
            (entries) => {
                let mostVisible = null;
                let mostRatio = 0;

                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio > mostRatio) {
                        mostRatio = entry.intersectionRatio;
                        mostVisible = entry.target;
                    }
                });

                if (mostVisible && mostRatio >= VISIBLE_THRESHOLD) {
                    // Find index of the most visible element
                    for (const [idx, el] of refsMap.current.entries()) {
                        if (el === mostVisible) {
                            if (activeIndex !== idx) {
                                requestAnimationFrame(() => {
                                    setActiveIndex(idx);
                                    onActiveChange?.(idx);
                                });
                            }
                            break;
                        }
                    }
                }
            },
            {
                threshold: [0, 0.25, 0.5, VISIBLE_THRESHOLD, 0.8, 1.0],
                rootMargin: '0px',
            }
        );

        observerRef.current = observer;

        // Observe all registered elements
        refsMap.current.forEach((el) => {
            observer.observe(el);
        });

        return () => {
            observer.disconnect();
        };
    }, [totalCount, onActiveChange]);

    // Re-observe when refs change
    const activateObserver = useCallback(() => {
        if (!observerRef.current) return;
        observerRef.current.disconnect();
        refsMap.current.forEach((el) => {
            observerRef.current.observe(el);
        });
    }, []);

    // Helper: should this index be pre-loaded?
    const shouldPreload = useCallback((index) => {
        return index >= activeIndex && index <= activeIndex + PRELOAD_BUFFER;
    }, [activeIndex]);

    // Helper: should this index release its source to save memory?
    const shouldRelease = useCallback((index) => {
        return index < activeIndex - RELEASE_BUFFER;
    }, [activeIndex]);

    return {
        registerRef,
        activateObserver,
        activeIndex,
        shouldPreload,
        shouldRelease,
    };
};
