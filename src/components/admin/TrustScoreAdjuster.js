import React, { useState } from 'react';
import { FaSearch, FaSave } from 'react-icons/fa';

const TrustScoreAdjuster = () => {
    const [search, setSearch] = useState('');
    const [user, setUser] = useState(null);
    const [score, setScore] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (search) {
            setUser({ id: '123', username: search, currentScore: 45 });
            setScore(45);
        }
    };

    const handleSave = () => {
        alert(`Updated score to ${score}`);
    };

    return (
        <div style={styles.container}>
            <h3 style={styles.title}>Manual Score Adjustment</h3>

            <form onSubmit={handleSearch} style={styles.search}>
                <input
                    type="text"
                    placeholder="Search user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={styles.input}
                />
                <button type="submit" style={styles.button}>
                    <FaSearch /> Search
                </button>
            </form>

            {user && (
                <div style={styles.result}>
                    <div style={styles.userInfo}>
                        <h4>{user.username}</h4>
                        <p>Current Score: <strong>{user.currentScore}</strong></p>
                    </div>

                    <div style={styles.adjust}>
                        <label style={styles.label}>New Score</label>
                        <div style={styles.inputGroup}>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={score}
                                onChange={(e) => setScore(e.target.value)}
                                style={styles.scoreInput}
                            />
                            <button onClick={handleSave} style={styles.saveBtn}>
                                <FaSave /> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    },
    title: {
        fontSize: '18px',
        fontWeight: '600',
        marginBottom: '20px'
    },
    search: {
        display: 'flex',
        gap: '12px',
        marginBottom: '32px'
    },
    input: {
        flex: 1,
        padding: '10px 16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
    },
    button: {
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
    result: {
        borderTop: '1px solid #e2e8f0',
        paddingTop: '24px'
    },
    userInfo: {
        marginBottom: '24px'
    },
    adjust: {
        maxWidth: '300px'
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600',
        marginBottom: '8px',
        color: '#64748b'
    },
    inputGroup: {
        display: 'flex',
        gap: '12px'
    },
    scoreInput: {
        width: '80px',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '16px',
        fontWeight: '600',
        textAlign: 'center'
    },
    saveBtn: {
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
        justifyContent: 'center',
        gap: '8px'
    }
};

export default TrustScoreAdjuster;
