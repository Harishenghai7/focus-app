import React from 'react';
import styles from './WarningModal.module.css';

const WarningModal = ({ isOpen, onClose, reason, onAppeal, onEdit }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>⚠️</div>
                <h2 className={styles.title}>Content Flagged</h2>
                <p className={styles.message}>
                    Your content was flagged for violating our community guidelines.
                    <br />
                    <strong>Reason:</strong> {reason}
                </p>

                <div className={styles.actions}>
                    <button className={`${styles.button} ${styles.secondaryButton}`} onClick={onClose}>
                        Discard
                    </button>
                    <button className={`${styles.button} ${styles.primaryButton}`} onClick={onEdit}>
                        Edit Content
                    </button>
                </div>

                {onAppeal && (
                    <div className={styles.appealLink} onClick={onAppeal}>
                        Believe this is a mistake? Appeal here.
                    </div>
                )}
            </div>
        </div>
    );
};

export default WarningModal;
