import React, { useState, useEffect, useRef } from 'react';
import { useMessageEdit } from '../../hooks/useMessageEdit';
import Button from '../ui/Button';
import styles from './EditMessageModal.module.css';

const EditMessageModal = ({ message, onClose, onSuccess }) => {
    const [content, setContent] = useState(message?.content || '');
    const [showHistory, setShowHistory] = useState(false);
    const [editHistory, setEditHistory] = useState([]);
    const textareaRef = useRef(null);

    const { editing, canEdit, editMessage, editGroupMessage, getEditHistory } = useMessageEdit();

    useEffect(() => {
        // Focus textarea on mount
        textareaRef.current?.focus();

        // Load edit history
        loadEditHistory();
    }, []);

    const loadEditHistory = async () => {
        const isGroupMessage = !!message.group_id;
        const history = await getEditHistory(message.id, isGroupMessage);
        setEditHistory(history);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!content.trim()) {
            return;
        }

        const isGroupMessage = !!message.group_id;
        const success = isGroupMessage
            ? await editGroupMessage(message.id, content, message.content)
            : await editMessage(message.id, content, message.content);

        if (success) {
            onSuccess?.();
            onClose();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const timeRemaining = () => {
        const messageTime = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = 15 - Math.floor((now - messageTime) / 1000 / 60);
        return Math.max(0, diffMinutes);
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Edit Message</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.timeWarning}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" />
                            <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>You can edit this message for {timeRemaining()} more minutes</span>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <textarea
                            ref={textareaRef}
                            className={styles.textarea}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Edit your message..."
                            rows={4}
                            maxLength={5000}
                        />

                        <div className={styles.charCount}>
                            {content.length}/5000
                        </div>

                        {editHistory.length > 0 && (
                            <button
                                type="button"
                                className={styles.historyToggle}
                                onClick={() => setShowHistory(!showHistory)}
                            >
                                {showHistory ? 'Hide' : 'Show'} edit history ({editHistory.length})
                            </button>
                        )}

                        {showHistory && editHistory.length > 0 && (
                            <div className={styles.history}>
                                <h3 className={styles.historyTitle}>Edit History</h3>
                                {editHistory.map((edit, index) => (
                                    <div key={edit.id} className={styles.historyItem}>
                                        <div className={styles.historyTime}>
                                            {new Date(edit.edited_at).toLocaleString()}
                                        </div>
                                        <div className={styles.historyContent}>
                                            {edit.previous_content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.actions}>
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={editing || !content.trim() || content.trim() === message.content}
                                loading={editing}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditMessageModal;
