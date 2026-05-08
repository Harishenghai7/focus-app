import React from 'react';
import styles from './BoltzEmptyState.module.css';
import { Zap } from 'lucide-react';

const BoltzEmptyState = () => (
    <div className={styles.container}>
        <div className={styles.glowOrb} />
        <div className={styles.iconContainer}>
            <Zap size={40} className={styles.icon} />
            <div className={styles.pulse} />
        </div>
        <h2 className={styles.title}>Your Boltz Feed is Brewing</h2>
        <p className={styles.subtitle}>
            Follow creators or explore trending content to fill your feed with amazing short videos.
        </p>
        <div className={styles.hints}>
            <span className={styles.hint}>📚 Learning</span>
            <span className={styles.hint}>🎨 Creative</span>
            <span className={styles.hint}>✨ Inspiration</span>
            <span className={styles.hint}>💡 Tech</span>
        </div>
    </div>
);

export default BoltzEmptyState;
