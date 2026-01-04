import React from 'react';
import { FaUserShield, FaUserSlash, FaRobot, FaExclamationTriangle } from 'react-icons/fa';

const AdminStatsOverview = () => {
    const stats = [
        { label: 'Total Users', value: '12,345', icon: FaUserShield, color: '#4f46e5' },
        { label: 'Flagged Accounts', value: '23', icon: FaUserSlash, color: '#ef4444' },
        { label: 'Bot Detection Rate', value: '1.2%', icon: FaRobot, color: '#eab308' },
        { label: 'Security Events (24h)', value: '156', icon: FaExclamationTriangle, color: '#f97316' },
    ];

    return (
        <div style={styles.grid}>
            {stats.map((stat, index) => (
                <div key={index} style={styles.card}>
                    <div style={{ ...styles.iconWrapper, background: `${stat.color}20` }}>
                        <stat.icon size={24} color={stat.color} />
                    </div>
                    <div>
                        <h3 style={styles.value}>{stat.value}</h3>
                        <p style={styles.label}>{stat.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
    },
    card: {
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    iconWrapper: {
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    value: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#1e293b',
        margin: '0 0 4px 0'
    },
    label: {
        fontSize: '14px',
        color: '#64748b',
        margin: 0
    }
};

export default AdminStatsOverview;
