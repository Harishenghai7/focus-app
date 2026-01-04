import React, { useState } from 'react';
import { useContentAppeal } from '../../hooks/useContentAppeal';
import styles from './WarningModal.module.css'; // Reuse styles for consistency

const AppealForm = ({ blockedContentId, userId, onCancel, onSuccess }) => {
    const [reason, setReason] = useState('');
    const { submitAppeal, isSubmitting, error, success } = useContentAppeal();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;

        await submitAppeal({ blockedContentId, userId, reason });
        if (onSuccess) onSuccess();
    };

    if (success) {
        return (
            <div className={styles.modal}>
                <div className={styles.icon} style={{ color: '#00b894' }}>✓</div>
                <h2 className={styles.title}>Appeal Submitted</h2>
                <p className={styles.message}>
                    Our team will review your appeal shortly. You will be notified of the outcome.
                </p>
                <button className={`${styles.button} ${styles.primaryButton}`} onClick={onCancel}>
                    Close
                </button>
            </div>
        );
    }

    return (
        <div className={styles.modal}>
            <h2 className={styles.title}>Submit Appeal</h2>
            <p className={styles.message}>
                Please explain why you think this content should be allowed.
            </p>

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter your reason..."
                    style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        marginBottom: '1rem',
                        fontFamily: 'inherit'
                    }}
                    required
                />

                {error && <p style={{ color: 'red', marginBottom: '1rem' }}>Error submitting appeal. Try again.</p>}

                <div className={styles.actions}>
                    <button
                        type="button"
                        className={`${styles.button} ${styles.secondaryButton}`}
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={`${styles.button} ${styles.primaryButton}`}
                        disabled={isSubmitting || !reason.trim()}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AppealForm;
