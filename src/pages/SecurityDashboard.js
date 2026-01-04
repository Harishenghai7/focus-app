import React from 'react';
import { useTrustScore } from '../hooks/useTrustScore';
import { useDeviceFingerprint } from '../hooks/useDeviceFingerprint';
import TrustScoreCard from '../components/trustShield/TrustScoreCard';
import TrustScoreBreakdown from '../components/trustShield/TrustScoreBreakdown';
import TrustScoreProgress from '../components/trustShield/TrustScoreProgress';
import DeviceList from '../components/trustShield/DeviceList';
import { TrustBadgeList } from '../components/trustShield/TrustBadge';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaUserShield, FaHistory } from 'react-icons/fa';
import styles from './SecurityDashboard.module.css';

// Mock user object - in real app this comes from AuthContext
const mockUser = {
    id: 'user_123',
    email: 'user@example.com',
    email_confirmed_at: '2023-01-01',
    user_metadata: {
        full_name: 'John Doe',
        avatar_url: 'https://via.placeholder.com/150',
        bio: 'Focus user',
        biometric_enabled: true
    },
    created_at: '2023-01-01'
};

const SecurityDashboard = () => {
    const navigate = useNavigate();
    // In real app: const { user } = useAuth();
    const user = mockUser;

    const { score, tier, breakdown, loading } = useTrustScore(user);
    const { fingerprint } = useDeviceFingerprint(user);

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Security Center</h1>
                <p className={styles.subtitle}>Manage your account security and trust score</p>
            </div>

            <div className={styles.grid}>
                {/* Left Column */}
                <div className={styles.column}>
                    <TrustScoreCard score={score} loading={loading} />

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <FaUserShield />
                            Badges
                        </h3>
                        <div className={styles.badgeList}>
                            <TrustBadgeList score={score} userMetadata={user.user_metadata} />
                        </div>
                    </div>

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <FaHistory />
                            Recent Activity
                        </h3>
                        <p className={styles.emptyText}>No suspicious activity detected recently.</p>
                    </div>
                </div>

                {/* Right Column */}
                <div className={styles.column}>
                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>Trust Progress</h3>
                        <TrustScoreProgress score={score} />
                        <button
                            className={styles.actionButton}
                            onClick={() => navigate('/verification-center')}
                        >
                            Go to Verification Center
                        </button>
                    </div>

                    <TrustScoreBreakdown breakdown={breakdown} />

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <FaLock />
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

export default SecurityDashboard;

