import React from 'react';
import { CheckCircle } from 'lucide-react';
import styles from './VerifiedBadge.module.css';

const VerifiedBadge = ({ size = 16 }) => {
    return (
        <CheckCircle
            size={size}
            className={styles.badge}
            fill="var(--primary-lavender)"
            color="white"
        />
    );
};

export default VerifiedBadge;
