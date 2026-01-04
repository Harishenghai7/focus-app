import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const SuspiciousActivityAlert = ({ alerts = [] }) => {
    if (alerts.length === 0) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <FaExclamationTriangle color="#ef4444" />
                <h4 style={styles.title}>Suspicious Activity Detected</h4>
            </div>
            <div style={styles.list}>
                {alerts.map((alert, index) => (
                    <div key={index} style={styles.alertItem}>
                        <span style={styles.alertType}>{alert.type}</span>
                        <span style={styles.alertTime}>
                            {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                        <p style={styles.alertDetails}>{alert.details}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: {
        background: '#fef2f2',
        border: '1px solid #fee2e2',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '20px'
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
    },
    title: {
        color: '#991b1b',
        fontSize: '14px',
        fontWeight: '600',
        margin: 0
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    alertItem: {
        fontSize: '13px',
        color: '#7f1d1d'
    },
    alertType: {
        fontWeight: '600',
        marginRight: '8px'
    },
    alertTime: {
        color: '#b91c1c',
        fontSize: '12px'
    },
    alertDetails: {
        margin: '4px 0 0 0',
        color: '#991b1b'
    }
};

export default SuspiciousActivityAlert;
