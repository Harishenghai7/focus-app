import React from 'react';
import BrandPanel from './BrandPanel';
import FloatingParticles from '../ui/FloatingParticles';
import styles from './AuthLayout.module.css';

const AuthLayout = ({ children }) => {
    return (
        <div className={styles.container}>
            {/* Cinematic ambient background layers */}
            <div className={styles.meshGradient} />
            <div className={styles.gridOverlay} />
            <div className={styles.orbLayer}>
                <div className={styles.orbPrimary} />
                <div className={styles.orbSecondary} />
                <div className={styles.orbTertiary} />
            </div>

            {/* Full-screen particle system */}
            <div className={styles.particleLayer}>
                <FloatingParticles
                    count={50}
                    color="167, 139, 250"
                    maxSize={2.2}
                    speed={0.15}
                    opacity={0.3}
                    connectDistance={120}
                    showConnections={true}
                />
            </div>

            {/* Brand Panel — left side (hidden on mobile) */}
            <BrandPanel />

            {/* Form Panel — right side */}
            <div className={styles.formPanel}>
                <div className={styles.formPanelBorder} />
                <div className={styles.formPanelGlow} />
                <div className={styles.formPanelGlowSecondary} />
                <div className={styles.formContent}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
