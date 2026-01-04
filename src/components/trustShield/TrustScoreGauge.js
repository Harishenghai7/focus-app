import React from 'react';
import { motion } from 'framer-motion';
import { getTrustTier } from '../../utils/trustScoreCalculator';
import styles from './TrustScoreGauge.module.css';

const TrustScoreGauge = ({ score, loading }) => {
    const tier = getTrustTier(score);

    // Gauge parameters
    const radius = 80;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const safeScore = isNaN(score) ? 0 : score;
    const strokeDashoffset = circumference - (safeScore / 100) * circumference;

    if (loading) return <div className={styles.loading} />;

    return (
        <div className={styles.container}>
            <div className={styles.gauge}>
                <svg
                    height={radius * 2}
                    width={radius * 2}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    <circle
                        stroke="var(--border-default)"
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                    />
                    <motion.circle
                        stroke={tier.color}
                        strokeWidth={stroke}
                        fill="transparent"
                        r={normalizedRadius}
                        cx={radius}
                        cy={radius}
                        strokeDasharray={circumference + ' ' + circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                    />
                </svg>
                <div className={styles.content}>
                    <motion.span
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={styles.score}
                        style={{ color: tier.color }}
                    >
                        {safeScore}
                    </motion.span>
                    <span className={styles.label}>Trust Score</span>
                </div>
            </div>
            <div className={styles.tierBadge}>
                <span
                    className={styles.badge}
                    style={{ background: `${tier.color}20`, color: tier.color }}
                >
                    {tier.label}
                </span>
            </div>
        </div>
    );
};

export default TrustScoreGauge;
