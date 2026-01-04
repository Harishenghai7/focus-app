import React, { useState } from 'react';
import FlaggedAccountsQueue from './FlaggedAccountsQueue';
import TrustScoreManager from './TrustScoreManager';
import { FaShieldAlt, FaUserSlash, FaChartLine } from 'react-icons/fa';

const TrustShieldAdmin = () => {
    const [activeTab, setActiveTab] = useState('flagged');

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>
                    <FaShieldAlt style={{ marginRight: '10px', color: '#4f46e5' }} />
                    Trust Shield Admin
                </h1>
                <div style={styles.stats}>
                    <div style={styles.statCard}>
                        <span style={styles.statValue}>1,234</span>
                        <span style={styles.statLabel}>Active Users</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statValue}>23</span>
                        <span style={styles.statLabel}>Flagged</span>
                    </div>
                    <div style={styles.statCard}>
                        <span style={styles.statValue}>98%</span>
                        <span style={styles.statLabel}>Trust Health</span>
                    </div>
                </div>
            </div>

            <div style={styles.tabs}>
                <button
                    style={{ ...styles.tab, borderBottom: activeTab === 'flagged' ? '2px solid #4f46e5' : 'none' }}
                    onClick={() => setActiveTab('flagged')}
                >
                    <FaUserSlash style={{ marginRight: '6px' }} /> Flagged Accounts
                </button>
                <button
                    style={{ ...styles.tab, borderBottom: activeTab === 'scores' ? '2px solid #4f46e5' : 'none' }}
                    onClick={() => setActiveTab('scores')}
                >
                    <FaChartLine style={{ marginRight: '6px' }} /> Trust Score Manager
                </button>
            </div>

            <div style={styles.content}>
                {activeTab === 'flagged' && <FlaggedAccountsQueue />}
                {activeTab === 'scores' && <TrustScoreManager />}
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '32px',
        background: '#f8fafc',
        minHeight: '100vh'
    },
    header: {
        marginBottom: '32px'
    },
    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        marginBottom: '24px'
    },
    stats: {
        display: 'flex',
        gap: '20px'
    },
    statCard: {
        background: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column'
    },
    statValue: {
        fontSize: '24px',
        fontWeight: '700',
        color: '#0f172a'
    },
    statLabel: {
        fontSize: '14px',
        color: '#64748b'
    },
    tabs: {
        display: 'flex',
        gap: '24px',
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '24px'
    },
    tab: {
        padding: '12px 4px',
        background: 'none',
        border: 'none',
        fontSize: '16px',
        fontWeight: '600',
        color: '#475569',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center'
    },
    content: {
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
    }
};

export default TrustShieldAdmin;
