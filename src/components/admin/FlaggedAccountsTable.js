import React, { useState } from 'react';
import { FaCheck, FaBan, FaExclamationTriangle, FaEye } from 'react-icons/fa';

// Mock data
const mockFlaggedUsers = [
    { id: 1, username: 'bot_user_99', reason: 'Suspicious Device Fingerprint', score: 15, date: '2023-10-25', status: 'pending' },
    { id: 2, username: 'spammer_x', reason: 'Rate Limit Exceeded (Comments)', score: 25, date: '2023-10-26', status: 'pending' },
    { id: 3, username: 'impersonator_1', reason: 'Profile Authenticity Flag', score: 40, date: '2023-10-26', status: 'reviewed' },
];

const FlaggedAccountsTable = () => {
    const [users, setUsers] = useState(mockFlaggedUsers);

    const handleAction = (id, action) => {
        console.log(`${action} user ${id}`);
        // In real app, update state or refetch
    };

    return (
        <div style={styles.container}>
            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>User</th>
                        <th style={styles.th}>Reason</th>
                        <th style={styles.th}>Trust Score</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} style={styles.tr}>
                            <td style={styles.td}>
                                <div style={styles.userCell}>
                                    <div style={styles.avatar}>{user.username[0]}</div>
                                    {user.username}
                                </div>
                            </td>
                            <td style={styles.td}>
                                <span style={styles.reason}>
                                    <FaExclamationTriangle size={12} style={{ marginRight: '6px' }} />
                                    {user.reason}
                                </span>
                            </td>
                            <td style={styles.td}>
                                <span style={{ ...styles.score, color: user.score < 30 ? '#ef4444' : '#eab308' }}>
                                    {user.score}
                                </span>
                            </td>
                            <td style={styles.td}>
                                <span style={{
                                    ...styles.status,
                                    background: user.status === 'pending' ? '#fef3c7' : '#e2e8f0',
                                    color: user.status === 'pending' ? '#d97706' : '#64748b'
                                }}>
                                    {user.status}
                                </span>
                            </td>
                            <td style={styles.td}>
                                <div style={styles.actions}>
                                    <button style={styles.actionBtn} title="Review"><FaEye /></button>
                                    <button style={{ ...styles.actionBtn, color: '#166534' }} title="Clear"><FaCheck /></button>
                                    <button style={{ ...styles.actionBtn, color: '#991b1b' }} title="Ban"><FaBan /></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const styles = {
    container: {
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        overflow: 'hidden'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    th: {
        textAlign: 'left',
        padding: '16px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        color: '#64748b',
        fontWeight: '600'
    },
    tr: {
        borderBottom: '1px solid #f1f5f9'
    },
    td: {
        padding: '16px',
        color: '#334155'
    },
    userCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontWeight: '500'
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        color: '#64748b'
    },
    reason: {
        display: 'flex',
        alignItems: 'center',
        color: '#ef4444'
    },
    score: {
        fontWeight: '700'
    },
    status: {
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    actions: {
        display: 'flex',
        gap: '8px'
    },
    actionBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: 'white',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        transition: 'all 0.2s'
    }
};

export default FlaggedAccountsTable;
