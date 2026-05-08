import React, { useState, useEffect, useCallback } from 'react';
import styles from './TaglineCarousel.module.css';

const taglines = [
    { text: 'Meet the real people, not fake profiles.', accent: 'identity' },
    { text: 'Trust-first. Always.', accent: 'trust' },
    { text: 'Social media that respects your mind.', accent: 'wellbeing' },
    { text: 'Verified humans. Meaningful connections.', accent: 'identity' },
    { text: 'Built for safety. Designed for warmth.', accent: 'trust' },
    { text: 'Where authenticity is the standard.', accent: 'wellbeing' },
];

const TaglineCarousel = () => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const advance = useCallback(() => {
        setIsTransitioning(true);
        setTimeout(() => {
            setActiveIndex(prev => (prev + 1) % taglines.length);
            setIsTransitioning(false);
        }, 400);
    }, []);

    useEffect(() => {
        const interval = setInterval(advance, 4500);
        return () => clearInterval(interval);
    }, [advance]);

    return (
        <div className={styles.container}>
            <div className={styles.quoteIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                        d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"
                        fill="currentColor"
                        opacity="0.3"
                    />
                    <path
                        d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"
                        fill="currentColor"
                        opacity="0.3"
                    />
                </svg>
            </div>
            <div className={styles.textWrapper}>
                <p
                    className={`${styles.tagline} ${isTransitioning ? styles.taglineExit : styles.taglineEnter}`}
                    data-accent={taglines[activeIndex].accent}
                >
                    {taglines[activeIndex].text}
                </p>
            </div>
            <div className={styles.dots}>
                {taglines.map((_, i) => (
                    <button
                        key={i}
                        className={`${styles.dot} ${i === activeIndex ? styles.dotActive : ''}`}
                        onClick={() => {
                            if (i !== activeIndex) {
                                setIsTransitioning(true);
                                setTimeout(() => {
                                    setActiveIndex(i);
                                    setIsTransitioning(false);
                                }, 400);
                            }
                        }}
                        aria-label={`Tagline ${i + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default TaglineCarousel;
