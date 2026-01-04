import React, { useState } from 'react';
import AdminStatsOverview from '../../components/admin/AdminStatsOverview';
import FlaggedAccountsTable from '../../components/admin/FlaggedAccountsTable';
import TrustScoreAdjuster from '../../components/admin/TrustScoreAdjuster';
import VerificationReviewPanel from '../../components/admin/VerificationReviewPanel';
import BotDetectionMetrics from '../../components/admin/BotDetectionMetrics';
import { FaShieldAlt, FaUserSlash, FaChartLine, FaCheckDouble, FaRobot } from 'react-icons/fa';

const AdminTrustShield = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <AdminStatsOverview />;
            case 'flagged':
                return <FlaggedAccountsTable />;
            case 'scores':
                return <TrustScoreAdjuster />;
            case 'verifications':
                return <VerificationReviewPanel />;
            case 'bots':
                return <BotDetectionMetrics />;
            default:
                return <AdminStatsOverview />;
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.sidebar}>
                <div style={styles.logo}>
                    <FaShieldAlt size={24} color="#4f46e5" />
                    <span>Trust Shield</span>
                </div>
                <nav style={styles.nav}>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'overview' ? '#e0e7ff' : 'transparent' }}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaChartLine /> Overview
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'flagged' ? '#e0e7ff' : 'transparent' }}
                        onClick={() => setActiveTab('flagged')}
                    >
                        <FaUserSlash /> Flagged Accounts
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'scores' ? '#e0e7ff' : 'transparent' }}
                        onClick={() => setActiveTab('scores')}
                    >
                        <FaShieldAlt /> Trust Scores
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'verifications' ? '#e0e7ff' : 'transparent' }}
                        onClick={() => setActiveTab('verifications')}
                    >
                        <FaCheckDouble /> Verifications
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'bots' ? '#e0e7ff' : 'transparent' }}
                        onClick={() => setActiveTab('bots')}
                    >
                        <FaRobot /> Bot Detection
                    </button>
                </nav>
            </div>

            <div style={styles.main}>
                <header style={styles.header}>
                    <h2 style={styles.pageTitle}>
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    </h2>
                </header>
                <div style={styles.content}>
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        background: '#f1f5f9'
    },
    sidebar: {
        width: '240px',
        background: 'white',
        borderRight: '1px solid #e2e8f0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '20px',
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: '40px',
        padding: '0 10px'
    },
    nav: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        color: '#475569',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.2s'
    },
    main: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
    },
    header: {
        background: 'white',
        padding: '20px 32px',
        borderBottom: '1px solid #e2e8f0'
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#1e293b',
        margin: 0
    },
    content: {
        padding: '32px',
        flex: 1,
        overflowY: 'auto'
    }
};

export default AdminTrustShield;
