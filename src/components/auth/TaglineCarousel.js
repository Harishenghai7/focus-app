import React, { useState, useEffect } from 'react';
import styles from './TaglineCarousel.module.css';

const taglines = [
    "Meet the real people, not fake profiles",
    "We offer features, not distractions",
    "Your privacy, Your data, Your control",
    "We value your time",
    "Connect, Create, Inspire"
];

const TaglineCarousel = () => {
    const [index, setIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setIndex((prevIndex) => (prevIndex + 1) % taglines.length);
                setFade(true);
            }, 500); // Wait for fade out
        }, 4000); // Change every 4 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className={styles.carouselContainer}>
            <p className={`${styles.tagline} ${fade ? styles.fadeIn : styles.fadeOut}`}>
                {taglines[index]}
            </p>
            <div className={styles.indicators}>
                {taglines.map((_, i) => (
                    <span
                        key={i}
                        className={`${styles.indicator} ${i === index ? styles.active : ''}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default TaglineCarousel;
