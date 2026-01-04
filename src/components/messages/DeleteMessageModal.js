import React from 'react';
import { useMessageDelete } from '../../hooks/useMessageDelete';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import styles from './DeleteMessageModal.module.css';

const DeleteMessageModal = ({ message, onClose, onSuccess }) => {
    const { user } = useAuth();
    const { deleting, canDeleteForEveryone, deleteForMe, deleteForEveryone, deleteGroupMessageForMe, deleteGroupMessageForEveryone } = useMessageDelete();

    const isOwnMessage = message?.sender_id === user?.id;
    const isGroupMessage = !!message?.group_id;
    const canUnsend = canDeleteForEveryone(message, user?.id);

    const handleDeleteForMe = async () => {
        const success = isGroupMessage
            ? await deleteGroupMessageForMe(message.id, user?.id)
            : await deleteForMe(message.id, user?.id);

        if (success) {
            onSuccess?.();
            onClose();
        }
    };

    const handleDeleteForEveryone = async () => {
        const success = isGroupMessage
            ? await deleteGroupMessageForEveryone(message.id)
            : await deleteForEveryone(message.id);

        if (success) {
            onSuccess?.();
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className={styles.icon}>
                        <circle cx="24" cy="24" r="20" fill="rgba(239, 68, 68, 0.1)" />
                        <path d="M16 18h16M19 18V16a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v2m-2 0v14a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2V18h10z"
                            stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <h2 className={styles.title}>Delete Message?</h2>
                    <p className={styles.subtitle}>
                        {isOwnMessage
                            ? 'Choose how you want to delete this message'
                            : 'This message will be removed from your chat'}
                    </p>
                </div>

                <div className={styles.content}>
                    {isOwnMessage && canUnsend && (
                        <button
                            className={`${styles.option} ${styles.danger}`}
                            onClick={handleDeleteForEveryone}
                            disabled={deleting}
                        >
                            <div className={styles.optionIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 7l-.867 12.142A2 2 0 0 1 16.138 21H7.862a2 2 0 0 1-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v3M4 7h16"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <div className={styles.optionContent}>
                                <div className={styles.optionTitle}>Delete for Everyone</div>
                                <div className={styles.optionDescription}>
                                    This message will be deleted for all participants
                                </div>
                            </div>
                        </button>
                    )}

                    <button
                        className={styles.option}
                        onClick={handleDeleteForMe}
                        disabled={deleting}
                    >
                        <div className={styles.optionIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <path d="M16 10V6a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v4M5 10h14l-1 12H6L5 10z"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className={styles.optionContent}>
                            <div className={styles.optionTitle}>Delete for Me</div>
                            <div className={styles.optionDescription}>
                                This message will only be removed from your chat
                            </div>
                        </div>
                    </button>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        fullWidth
                        disabled={deleting}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DeleteMessageModal;
