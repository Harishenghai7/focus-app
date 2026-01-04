import React from 'react';
import { motion } from 'framer-motion';
import { TRUST_TIERS } from '../../utils/trustScoreCalculator';
import styles from './TrustProgress.module.css';

const TrustProgress = ({ score }) => {
    let nextMilestone = 100;
    let nextLabel = 'Max Trust';

    if (score < TRUST_TIERS.LIMITED.min) {
        nextMilestone = TRUST_TIERS.LIMITED.min;
        nextLabel = 'Limited Tier';
    } else if (score < TRUST_TIERS.TRUSTED.min) {
        nextMilestone = TRUST_TIERS.TRUSTED.min;
        nextLabel = 'Trusted Tier';
    } else if (score < TRUST_TIERS.HIGHLY_TRUSTED.min) {
        nextMilestone = TRUST_TIERS.HIGHLY_TRUSTED.min;
        nextLabel = 'Highly Trusted';
    }

    const progress = Math.min((score / nextMilestone) * 100, 100);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.label}>Next: {nextLabel}</span>
                <span className={styles.value}>{score} / {nextMilestone}</span>
            </div>
            <div className={styles.track}>
                <motion.div
                    className={styles.bar}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
        </div>
    );
};

export default TrustProgress;
