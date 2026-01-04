import React, { useState } from 'react';
import { FaSearch, FaEdit } from 'react-icons/fa';

const TrustScoreManager = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [newScore, setNewScore] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        // Mock search
        if (searchTerm) {
            setSelectedUser({
                id: 'user_123',
                username: searchTerm,
                currentScore: 45,
                tier: 'Limited'
            });
            setNewScore(45);
        }
    };

    const handleUpdate = () => {
        // Mock update
        alert(`Updated score for ${selectedUser.username} to ${newScore}`);
        setSelectedUser({ ...selectedUser, currentScore: parseInt(newScore) });
    };

    return (
        <div>
            <h3 style={styles.title}>Manage Trust Scores</h3>

            <form onSubmit={handleSearch} style={styles.searchForm}>
                <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={styles.input}
                />
                <button type="submit" style={styles.searchBtn}>
                    <FaSearch /> Search
                </button>
            </form>

            {selectedUser && (
                <div style={styles.resultCard}>
                    <div style={styles.userInfo}>
                        <div style={styles.userHeader}>
                            <h4 style={styles.username}>{selectedUser.username}</h4>
                            <span style={styles.idBadge}>ID: {selectedUser.id}</span>
                        </div>
                        <div style={styles.currentStats}>
                            <div style={styles.stat}>
                                <span style={styles.label}>Current Score</span>
                                <span style={styles.value}>{selectedUser.currentScore}</span>
                            </div>
                            <div style={styles.stat}>
                                <span style={styles.label}>Tier</span>
                                <span style={styles.value}>{selectedUser.tier}</span>
                            </div>
                        </div>
                    </div>

                    <div style={styles.editSection}>
                        <label style={styles.label}>Override Score</label>
                        <div style={styles.inputGroup}>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={newScore}
                                onChange={(e) => setNewScore(e.target.value)}
                                style={styles.scoreInput}
                            />
                            <button onClick={handleUpdate} style={styles.updateBtn}>
                                <FaEdit style={{ marginRight: '6px' }} /> Update Score
                            </button>
                        </div>
                        <p style={styles.helper}>
                            Manually adjusting the score will override the calculated value.
                        </p>
                    </div>
                </div>
            )}
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
    searchForm: {
        display: 'flex',
        gap: '12px',
        marginBottom: '32px'
    },
    input: {
        flex: 1,
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '14px'
    },
    searchBtn: {
        padding: '10px 20px',
        background: '#4f46e5',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    resultCard: {
        background: '#f8fafc',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e2e8f0'
    },
    userHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
    },
    username: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#0f172a',
        margin: 0
    },
    idBadge: {
        fontSize: '12px',
        color: '#64748b',
        background: '#e2e8f0',
        padding: '2px 8px',
        borderRadius: '12px'
    },
    currentStats: {
        display: 'flex',
        gap: '32px',
        marginBottom: '24px',
        paddingBottom: '24px',
        borderBottom: '1px solid #e2e8f0'
    },
    stat: {
        display: 'flex',
        flexDirection: 'column'
    },
    label: {
        fontSize: '12px',
        color: '#64748b',
        marginBottom: '4px',
        fontWeight: '600'
    },
    value: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1e293b'
    },
    editSection: {
        maxWidth: '300px'
    },
    inputGroup: {
        display: 'flex',
        gap: '12px',
        marginBottom: '8px'
    },
    scoreInput: {
        width: '80px',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #cbd5e1',
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center'
    },
    updateBtn: {
        flex: 1,
        padding: '10px',
        background: '#0f172a',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    helper: {
        fontSize: '12px',
        color: '#94a3b8',
        margin: 0
    }
};

export default TrustScoreManager;
