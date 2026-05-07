import React from 'react';
import { ShieldCheck } from 'lucide-react';
import styles from './VerifiedBadge.module.css';

const VerifiedBadge = ({ size = 18, trustShield = false }) => {
    return (
        <div className={`${styles.badgeContainer} ${trustShield ? styles.trustShield : ''}`}>
            <ShieldCheck
                size={size}
                className={`${styles.badge} ${trustShield ? styles.shimmer : ''}`}
                fill={trustShield ? 'var(--primary-lavender)' : 'var(--primary-lavender)'}
                color="white"
                strokeWidth={trustShield ? 1.5 : 2}
            />
            {trustShield && <div className={styles.pulseRing} />}
        </div>
    );
};

export default VerifiedBadge;
