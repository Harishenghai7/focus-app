import React from 'react';
import TaglineCarousel from './TaglineCarousel';
import styles from './BrandPanel.module.css';

const BrandPanel = () => {
    return (
        <div className={styles.brandPanel}>
            <div className={styles.backgroundEffect}></div>
            <div className={styles.content}>
                <div className={styles.logoContainer}>
                    <div className={styles.logoGlow}></div>
                    <h1 className={styles.logoText}>Focus</h1>
                </div>
                <TaglineCarousel />
            </div>
        </div>
    );
};

export default BrandPanel;
