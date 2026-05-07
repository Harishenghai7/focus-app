import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { TRUST_SCORE_WEIGHTS } from '../../utils/trustScoreCalculator';
import styles from './TrustScoreBreakdown.module.css';

const TrustScoreBreakdown = ({ breakdown }) => {
    const items = [
        { label: 'Trust Shield', value: breakdown.trustShield, max: TRUST_SCORE_WEIGHTS.TRUST_SHIELD, icon: null, highlight: true },
        { label: 'Base Score', value: breakdown.base, max: TRUST_SCORE_WEIGHTS.BASE, icon: null },
        { label: 'Email Verified', value: breakdown.email, max: TRUST_SCORE_WEIGHTS.EMAIL_VERIFIED, icon: null },
        { label: 'OAuth Linked', value: breakdown.oauth, max: TRUST_SCORE_WEIGHTS.OAUTH_LINKED, icon: null },
        { label: 'Biometric Verified', value: breakdown.biometric, max: TRUST_SCORE_WEIGHTS.BIOMETRIC, icon: null },
        { label: 'Profile Complete', value: breakdown.profile, max: TRUST_SCORE_WEIGHTS.PROFILE_COMPLETE, icon: null },
        { label: 'Account Age', value: breakdown.age, max: TRUST_SCORE_WEIGHTS.ACCOUNT_AGE, icon: null },
        { label: 'Positive Interactions', value: breakdown.interactions, max: TRUST_SCORE_WEIGHTS.POSITIVE_INTERACTIONS, icon: null },
        { label: 'No Reports', value: breakdown.reports, max: TRUST_SCORE_WEIGHTS.NO_REPORTS, icon: null },
    ];

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Score Breakdown</h3>
            <div className={styles.list}>
                {items.map((item, index) => {
                    const isComplete = item.value === item.max;
                    return (
                        <div key={index} className={styles.item}>
                            <div className={styles.itemLeft}>
                                {isComplete ? (
                                    <FaCheckCircle color="#22c55e" size={16} />
                                ) : (
                                    <FaTimesCircle color="var(--border-default)" size={16} />
                                )}
                                <span className={styles.label}>{item.label}</span>
                            </div>
                            <div className={styles.itemRight}>
                                <span
                                    className={styles.value}
                                    style={{ color: isComplete ? '#22c55e' : 'var(--text-muted)' }}
                                >
                                    +{item.value}
                                </span>
                                <span className={styles.max}>/{item.max}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TrustScoreBreakdown;
