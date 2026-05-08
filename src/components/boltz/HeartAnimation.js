import React from 'react';
import styles from './HeartAnimation.module.css';

const HeartAnimation = () => (
    <div className={styles.container}>
        {[...Array(8)].map((_, i) => (
            <div
                key={i}
                className={styles.heart}
                style={{
                    '--i': i,
                    '--size': `${20 + Math.random() * 30}px`,
                    '--x': `${35 + Math.random() * 30}%`,
                    '--delay': `${Math.random() * 0.2}s`,
                }}
            >
                ❤️
            </div>
        ))}
    </div>
);

export default HeartAnimation;
