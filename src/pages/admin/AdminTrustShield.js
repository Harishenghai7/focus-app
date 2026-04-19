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
                        style={{ ...styles.navItem, background: activeTab === 'overview' ? 'rgba(124,58,237,0.2)' : 'transparent' }}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaChartLine /> Overview
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'flagged' ? 'rgba(124,58,237,0.2)' : 'transparent' }}
                        onClick={() => setActiveTab('flagged')}
                    >
                        <FaUserSlash /> Flagged Accounts
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'scores' ? 'rgba(124,58,237,0.2)' : 'transparent' }}
                        onClick={() => setActiveTab('scores')}
                    >
                        <FaShieldAlt /> Trust Scores
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'verifications' ? 'rgba(124,58,237,0.2)' : 'transparent' }}
                        onClick={() => setActiveTab('verifications')}
                    >
                        <FaCheckDouble /> Verifications
                    </button>
                    <button
                        style={{ ...styles.navItem, background: activeTab === 'bots' ? 'rgba(124,58,237,0.2)' : 'transparent' }}
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
                    {activeTab === 'flagged' && (
                        <p style={styles.pageSubTitle}>Global ban updates tear down live access instantly.</p>
                    )}
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
        background: 'var(--bg-primary)'
    },
    sidebar: {
        width: '240px',
        background: 'rgba(126, 87, 194, 0.1)',
        backdropFilter: 'blur(25px)',
        borderRight: '1px solid rgba(255,255,255,0.15)',
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
        color: '#fff',
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
        color: '#d8c7ff',
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
        background: 'rgba(126, 87, 194, 0.08)',
        backdropFilter: 'blur(25px)',
        padding: '20px 32px',
        borderBottom: '1px solid rgba(255,255,255,0.15)'
    },
    pageTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#fff',
        margin: 0
    },
    pageSubTitle: {
        margin: '8px 0 0 0',
        color: '#c4b5fd',
        fontSize: '0.85rem',
    },
    content: {
        padding: '32px',
        flex: 1,
        overflowY: 'auto'
    }
};

export default AdminTrustShield;
