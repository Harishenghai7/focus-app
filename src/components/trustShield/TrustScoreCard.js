import React from 'react';
import { motion } from 'framer-motion';
import { getTrustTier } from '../../utils/trustScoreCalculator';
import { FaShieldAlt } from 'react-icons/fa';
import styles from './TrustScoreCard.module.css';

const TrustScoreCard = ({ score, loading }) => {
    const tier = getTrustTier(score);

    // Calculate circumference for circle progress
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={`${styles.skeleton} animate-pulse`} style={{ height: '200px' }}></div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Trust Score</h3>
                <FaShieldAlt size={20} color={tier.color} />
            </div>

            <div className={styles.scoreContainer}>
                <svg width="140" height="140" className={styles.svg}>
                    {/* Background Circle */}
                    <circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="transparent"
                        stroke="var(--border-default)"
                        strokeWidth="10"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx="70"
                        cy="70"
                        r={radius}
                        fill="transparent"
                        stroke={tier.color}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference} // Start empty
                        animate={{ strokeDashoffset: offset }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        strokeLinecap="round"
                        transform="rotate(-90 70 70)"
                    />
                </svg>
                <div className={styles.scoreTextContainer}>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.scoreValue}
                        style={{ color: tier.color }}
                    >
                        {score}
                    </motion.span>
                    <span className={styles.scoreLabel}>/ 100</span>
                </div>
            </div>

            <div className={styles.tierInfo}>
                <span className={styles.tierBadge} style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                    {tier.label}
                </span>
                <p className={styles.tierDescription}>
                    {tier.label === 'Restricted' && 'Your account has limited access.'}
                    {tier.label === 'Limited' && 'Complete verification to unlock features.'}
                    {tier.label === 'Trusted' && 'You have full access to the platform.'}
                    {tier.label === 'Highly Trusted' && 'You are a top-tier community member!'}
                </p>
            </div>
        </div>
    );
};

export default TrustScoreCard;

