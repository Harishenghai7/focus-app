import React from 'react';
import { motion } from 'framer-motion';
import { TRUST_TIERS } from '../../utils/trustScoreCalculator';
import styles from './TrustScoreProgress.module.css';

const TrustScoreProgress = ({ score }) => {
    // Determine next milestone
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

    const progress = Math.min(score, 100);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.label}>Progress to {nextLabel}</span>
                <span className={styles.value}>{score} / {nextMilestone}</span>
            </div>
            <div className={styles.track}>
                <motion.div
                    className={styles.bar}
                    initial={{ width: 0 }}
                    animate={{ width: `${(score / nextMilestone) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            <p className={styles.tip}>
                Tip: Complete more verification steps to reach the next tier!
            </p>
        </div>
    );
};

export default TrustScoreProgress;

