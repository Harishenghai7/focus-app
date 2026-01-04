import React, { useState } from 'react';
import { FaCheck, FaBan, FaExclamationTriangle } from 'react-icons/fa';

// Mock data
const mockFlaggedUsers = [
    { id: 1, username: 'bot_user_99', reason: 'Suspicious Device Fingerprint', score: 15, date: '2023-10-25' },
    { id: 2, username: 'spammer_x', reason: 'Rate Limit Exceeded (Comments)', score: 25, date: '2023-10-26' },
    { id: 3, username: 'impersonator_1', reason: 'Profile Authenticity Flag', score: 40, date: '2023-10-26' },
];

const FlaggedAccountsQueue = () => {
    const [users, setUsers] = useState(mockFlaggedUsers);

    const handleAction = (id, action) => {
        // In real app: call API to ban or restore user
        console.log(`${action} user ${id}`);
        setUsers(users.filter(u => u.id !== id));
    };

    return (
        <div>
            <h3 style={styles.title}>Flagged Accounts Queue</h3>
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>User</th>
                            <th style={styles.th}>Reason</th>
                            <th style={styles.th}>Trust Score</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={styles.userCell}>
                                        <div style={styles.avatarPlaceholder}>{user.username[0].toUpperCase()}</div>
                                        {user.username}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.reasonBadge}>
                                        <FaExclamationTriangle size={12} style={{ marginRight: '4px' }} />
                                        {user.reason}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <span style={{ ...styles.score, color: user.score < 30 ? '#ef4444' : '#eab308' }}>
                                        {user.score}
                                    </span>
                                </td>
                                <td style={styles.td}>{user.date}</td>
                                <td style={styles.td}>
                                    <div style={styles.actions}>
                                        <button
                                            style={{ ...styles.btn, ...styles.btnRestore }}
                                            onClick={() => handleAction(user.id, 'restore')}
                                            title="Restore / Clear Flag"
                                        >
                                            <FaCheck />
                                        </button>
                                        <button
                                            style={{ ...styles.btn, ...styles.btnBan }}
                                            onClick={() => handleAction(user.id, 'ban')}
                                            title="Ban User"
                                        >
                                            <FaBan />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#94a3b8' }}>
                                    No flagged accounts. Good job!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    title: {
        fontSize: '18px',
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: '16px'
    },
    tableContainer: {
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px'
    },
    th: {
        textAlign: 'left',
        padding: '12px',
        borderBottom: '2px solid #e2e8f0',
        color: '#64748b',
        fontWeight: '600'
    },
    tr: {
        borderBottom: '1px solid #f1f5f9'
    },
    td: {
        padding: '12px',
        color: '#334155'
    },
    userCell: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontWeight: '500'
    },
    avatarPlaceholder: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#64748b'
    },
    reasonBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 8px',
        borderRadius: '12px',
        background: '#fef2f2',
        color: '#b91c1c',
        fontSize: '12px',
        fontWeight: '500'
    },
    score: {
        fontWeight: '700'
    },
    actions: {
        display: 'flex',
        gap: '8px'
    },
    btn: {
        width: '32px',
        height: '32px',
        borderRadius: '6px',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'opacity 0.2s'
    },
    btnRestore: {
        background: '#dcfce7',
        color: '#166534'
    },
    btnBan: {
        background: '#fee2e2',
        color: '#991b1b'
    }
};

export default FlaggedAccountsQueue;
