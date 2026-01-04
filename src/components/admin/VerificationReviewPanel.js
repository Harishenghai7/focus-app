import React from 'react';

/**
 * VerificationReviewPanel Component
 * Placeholder for Trust Shield verification reviews
 * (Separate from badge verification reviews)
 */
const VerificationReviewPanel = () => {
    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>Verification Reviews</h3>
                <p style={styles.subtitle}>Review and approve user verification requests</p>
            </div>

            <div style={styles.content}>
                <div style={styles.emptyState}>
                    <p>No pending verification requests</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    header: {
        marginBottom: '24px'
    },
    title: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1e293b',
        margin: '0 0 8px 0'
    },
    subtitle: {
        fontSize: '14px',
        color: '#64748b',
        margin: 0
    },
    content: {
        minHeight: '300px'
    },
    emptyState: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        color: '#94a3b8',
        fontSize: '14px'
    }
};

export default VerificationReviewPanel;
