import React from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const VerificationCard = ({ verifications = {}, onVerify }) => {
    const items = [
        { id: 'email', label: 'Email', verified: verifications.email },
        { id: 'phone', label: 'Phone', verified: verifications.phone },
        { id: 'identity', label: 'Identity', verified: verifications.identity },
    ];

    const completedCount = items.filter(i => i.verified).length;
    const totalCount = items.length;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h4 style={styles.title}>Verifications</h4>
                <span style={styles.count}>{completedCount}/{totalCount}</span>
            </div>

            <div style={styles.list}>
                {items.map(item => (
                    <div key={item.id} style={styles.item}>
                        <span style={styles.label}>{item.label}</span>
                        {item.verified ? (
                            <FaCheckCircle color="#22c55e" />
                        ) : (
                            <FaTimesCircle color="#e2e8f0" />
                        )}
                    </div>
                ))}
            </div>

            <button onClick={onVerify} style={styles.button}>
                Manage Verifications
            </button>
        </div>
    );
};

const styles = {
    container: {
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
    },
    title: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1e293b',
        margin: 0
    },
    count: {
        fontSize: '12px',
        color: '#64748b',
        background: '#f1f5f9',
        padding: '2px 8px',
        borderRadius: '10px'
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        marginBottom: '16px'
    },
    item: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: '#475569'
    },
    button: {
        width: '100%',
        padding: '8px',
        background: 'none',
        border: '1px solid #e2e8f0',
        borderRadius: '6px',
        color: '#4f46e5',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    }
};

export default VerificationCard;
