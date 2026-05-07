import React from 'react';
import BrandPanel from './BrandPanel';
import FloatingParticles from '../ui/FloatingParticles';
import styles from './AuthLayout.module.css';

const AuthLayout = ({ children }) => {
    return (
        <div className={styles.container}>
            {/* Ambient particle system — fills the entire auth screen */}
            <div className={styles.particleLayer}>
                <FloatingParticles
                    count={40}
                    color="167, 139, 250"
                    maxSize={2.5}
                    speed={0.2}
                    opacity={0.35}
                    connectDistance={100}
                    showConnections={true}
                />
            </div>
            <BrandPanel />
            <div className={styles.formPanel}>
                <div className={styles.formPanelGlow} />
                <div className={styles.formContent}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
