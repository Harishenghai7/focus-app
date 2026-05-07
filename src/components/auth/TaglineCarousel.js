import React, { useState, useEffect } from 'react';
import styles from './TaglineCarousel.module.css';

const taglines = [
    'Identity-first communities with real trust signals',
    'Healthy discovery designed for meaningful interaction',
    'Private by default, premium by experience, human by intent',
    'Social connection with calmer systems and stronger safety'
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
            }, 280);
        }, 4400);

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
