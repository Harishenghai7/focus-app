import React, { useState } from 'react';
import styles from './DeleteAccountModal.module.css';
import Button from '../shared/Button';
import { FaExclamationTriangle } from 'react-icons/fa';

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, loading = false }) => {
    const [confirmText, setConfirmText] = useState('');
    const [understood, setUnderstood] = useState(false);

    if (!isOpen) return null;

    const isConfirmValid = confirmText.toLowerCase() === 'delete' && understood;

    const handleConfirm = () => {
        if (isConfirmValid) {
            onConfirm();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <FaExclamationTriangle className={styles.warningIcon} />
                    <h2 className={styles.title}>Delete Account</h2>
                </div>

                <div className={styles.content}>
                    <div className={styles.warningBox}>
                        <h3>⚠️ This action cannot be undone</h3>
                        <p>Deleting your account will permanently remove:</p>
                        <ul>
                            <li>All your posts and Boltz</li>
                            <li>Your profile and personal information</li>
                            <li>All messages and conversations</li>
                            <li>Your followers and following connections</li>
                            <li>Saved posts and collections</li>
                        </ul>
                    </div>

                    <div className={styles.confirmSection}>
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={understood}
                                onChange={(e) => setUnderstood(e.target.checked)}
                                className={styles.checkbox}
                            />
                            <span>I understand this action is permanent and irreversible</span>
                        </label>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmDelete">
                                Type <strong>DELETE</strong> to confirm:
                            </label>
                            <input
                                id="confirmDelete"
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                className={styles.confirmInput}
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleConfirm}
                        disabled={!isConfirmValid || loading}
                        loading={loading}
                    >
                        {loading ? 'Deleting...' : 'Delete My Account'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
