import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTrustScore } from '../hooks/useTrustScore';
import { useDeviceFingerprint } from '../hooks/useDeviceFingerprint';
import TrustScoreGauge from '../components/trustShield/TrustScoreGauge';
import TrustScoreBreakdown from '../components/trustShield/TrustScoreBreakdown';
import TrustProgress from '../components/trustShield/TrustProgress';
import DeviceList from '../components/trustShield/DeviceList';
import SecurityEventLog from '../components/trustShield/SecurityEventLog';
import { TrustBadgeList } from '../components/trustShield/TrustBadge';
import { FaShieldAlt, FaUserShield, FaHistory, FaLock } from 'react-icons/fa';
import styles from './SecurityCenter.module.css';

const SecurityCenter = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { score, tier, breakdown, loading: scoreLoading } = useTrustScore(user);
    const { fingerprint } = useDeviceFingerprint(user);

    if (authLoading) return <div className={styles.loading}>Loading...</div>;
    if (!user) return <Navigate to="/auth" replace />;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Security Center</h1>
                <p className={styles.subtitle}>Manage your account security and trust score</p>
            </div>

            <div className={styles.grid}>
                {/* Left Column */}
                <div className={styles.column}>
                    <div className={styles.card}>
                        <TrustScoreGauge score={score} loading={scoreLoading} />
                        <div className={styles.actions}>
                            <button
                                className={styles.primaryButton}
                                onClick={() => navigate('/verification-center')}
                            >
                                Improve Score
                            </button>
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <FaUserShield style={{ marginRight: '8px' }} />
                            Badges
                        </h3>
                        <div style={{ padding: '10px 0' }}>
                            <TrustBadgeList score={score} userMetadata={user.user_metadata} />
                        </div>
                        <button
                            className={styles.linkButton}
                            onClick={() => navigate('/badge-center')}
                        >
                            View All Badges
                        </button>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <FaHistory style={{ marginRight: '8px' }} />
                            Recent Activity
                        </h3>
                        <SecurityEventLog limit={3} />
                    </div>
                </div>

                {/* Right Column */}
                <div className={styles.column}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Trust Progress</h3>
                        <TrustProgress score={score} />
                        <p className={styles.tip}>
                            Tip: Complete more verification steps to reach the next tier!
                        </p>
                    </div>

                    <TrustScoreBreakdown breakdown={breakdown} />

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <FaLock style={{ marginRight: '8px' }} />
                            Device Management
                        </h3>
                        <p className={styles.deviceInfo}>
                            Current Device ID: <span className={styles.code}>{fingerprint?.visitorId?.substring(0, 12)}...</span>
                        </p>
                        <DeviceList userId={user.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecurityCenter;
