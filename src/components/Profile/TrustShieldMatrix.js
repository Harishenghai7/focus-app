import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './TrustShieldMatrix.module.css';

const TRUST_TIERS = [
    { level: 0, label: 'Starter', color: 'var(--focusid-0-color)', icon: '○' },
    { level: 1, label: 'Real', color: 'var(--focusid-1-color)', icon: '📱' },
    { level: 2, label: 'Confirmed', color: 'var(--focusid-2-color)', icon: '✓' },
    { level: 3, label: 'Trusted', color: 'var(--focusid-3-color)', icon: '★' },
    { level: 4, label: 'Verified', color: 'var(--focusid-4-color)', icon: '🛡️' },
];

const VERIFICATION_CHECKS = [
    { key: 'phone', label: 'Phone Verified', icon: '📱' },
    { key: 'photo', label: 'Photo Verified', icon: '📸' },
    { key: 'liveness', label: 'Liveness Check', icon: '🔐' },
    { key: 'community', label: 'Community Trusted', icon: '🤝' },
];

const TrustShieldMatrix = ({ profile, isOwnProfile }) => {
    const trustLevel = profile?.trust_level || 0;
    const isVerified = profile?.is_verified || false;
    const trustScore = Math.min(100, Math.round((trustLevel / 4) * 100));

    const verificationStatus = useMemo(() => ({
        phone: trustLevel >= 1,
        photo: trustLevel >= 1,
        liveness: trustLevel >= 4,
        community: trustLevel >= 3,
    }), [trustLevel]);

    const currentTier = TRUST_TIERS[Math.min(trustLevel, 4)];

    // Don't show for unverified users viewing other profiles
    if (!isOwnProfile && trustLevel === 0) return null;

    return (
        <motion.section
            className={styles.matrix}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Trust Shield"
        >
            <div className={styles.header}>
                <div className={styles.shieldIcon}>
                    <span className={styles.shieldEmoji}>🛡️</span>
                    {isVerified && <div className={styles.shieldHalo} />}
                </div>
                <div className={styles.headerInfo}>
                    <h3 className={styles.title}>Trust Shield</h3>
                    <span
                        className={styles.tierBadge}
                        style={{ color: currentTier.color, borderColor: currentTier.color }}
                    >
                        {currentTier.icon} {currentTier.label}
                    </span>
                </div>
                <div className={styles.scoreRing}>
                    <svg viewBox="0 0 80 80" className={styles.scoreSvg}>
                        <circle
                            cx="40" cy="40" r="34"
                            fill="none"
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="5"
                        />
                        <motion.circle
                            cx="40" cy="40" r="34"
                            fill="none"
                            stroke={currentTier.color}
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 34}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                            animate={{
                                strokeDashoffset: 2 * Math.PI * 34 * (1 - trustScore / 100),
                            }}
                            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            style={{
                                transformOrigin: '50% 50%',
                                transform: 'rotate(-90deg)',
                                filter: `drop-shadow(0 0 6px ${currentTier.color})`,
                            }}
                        />
                    </svg>
                    <span className={styles.scoreValue}>{trustScore}</span>
                </div>
            </div>

            {/* Trust Level Progress */}
            <div className={styles.progressTrack}>
                {TRUST_TIERS.map((tier, i) => (
                    <div
                        key={tier.level}
                        className={`${styles.progressNode} ${i <= trustLevel ? styles.progressNodeActive : ''}`}
                        style={{
                            '--tier-color': tier.color,
                        }}
                    >
                        <div className={styles.progressDot} />
                        <span className={styles.progressLabel}>{tier.label}</span>
                    </div>
                ))}
                <div className={styles.progressBar}>
                    <motion.div
                        className={styles.progressFill}
                        initial={{ width: 0 }}
                        animate={{ width: `${(trustLevel / 4) * 100}%` }}
                        transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        style={{
                            background: `linear-gradient(90deg, var(--focusid-1-color), ${currentTier.color})`,
                        }}
                    />
                </div>
            </div>

            {/* Verification Checks */}
            <div className={styles.checks}>
                {VERIFICATION_CHECKS.map((check, idx) => {
                    const passed = verificationStatus[check.key];
                    return (
                        <motion.div
                            key={check.key}
                            className={`${styles.checkItem} ${passed ? styles.checkPassed : styles.checkPending}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 + idx * 0.1 }}
                        >
                            <span className={styles.checkIcon}>
                                {passed ? '✓' : '○'}
                            </span>
                            <span className={styles.checkLabel}>{check.label}</span>
                        </motion.div>
                    );
                })}
            </div>
        </motion.section>
    );
};

export default TrustShieldMatrix;
