import React from 'react';
import { FaShieldAlt, FaCheckCircle, FaStar, FaUserCheck, FaFingerprint } from 'react-icons/fa';
import { getTrustTier, TRUST_TIERS } from '../../utils/trustScoreCalculator';
import styles from './TrustBadge.module.css';

const TrustBadge = ({ type, size = 24 }) => {
    const badges = {
        TRUST_SHIELD: { icon: FaShieldAlt, color: '#22c55e', label: 'Trust Shield Active' },
        VERIFIED: { icon: FaCheckCircle, color: '#3b82f6', label: 'Verified Member' },
        HIGHLY_TRUSTED: { icon: FaStar, color: '#eab308', label: 'Highly Trusted' },
        FOUNDING: { icon: FaUserCheck, color: '#8b5cf6', label: 'Founding Member' },
        BIOMETRIC: { icon: FaFingerprint, color: '#ec4899', label: 'Biometric Secured' }
    };

    const badge = badges[type];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
        <div title={badge.label} className={styles.badgeWrapper}>
            <Icon size={size} color={badge.color} />
        </div>
    );
};

export const TrustBadgeList = ({ score, userMetadata }) => {
    const tier = getTrustTier(score);
    const badges = [];

    if (score >= 60) badges.push('TRUST_SHIELD');
    if (score >= 80) badges.push('VERIFIED');
    if (score >= 95) badges.push('HIGHLY_TRUSTED');
    if (userMetadata?.biometric_enabled) badges.push('BIOMETRIC');
    // Add more logic for other badges

    return (
        <div className={styles.badgeList}>
            {badges.map(type => (
                <TrustBadge key={type} type={type} size={20} />
            ))}
        </div>
    );
};

export default TrustBadge;

