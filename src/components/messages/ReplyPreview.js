import React from 'react';
import styles from './ReplyPreview.module.css';

const ReplyPreview = ({ message, onCancel }) => {
    if (!message) return null;

    const renderPreviewContent = () => {
        if (message.message_type === 'image') {
            return (
                <div className={styles.mediaPreview}>
                    <img src={message.attachments[0]?.url} alt="Reply preview" />
                    <span>{message.content || 'Photo'}</span>
                </div>
            );
        }

        if (message.message_type === 'video') {
            return (
                <div className={styles.mediaPreview}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>{message.content || 'Video'}</span>
                </div>
            );
        }

        if (message.message_type === 'audio') {
            return (
                <div className={styles.mediaPreview}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" />
                    </svg>
                    <span>Voice message</span>
                </div>
            );
        }

        if (message.message_type === 'file') {
            return (
                <div className={styles.mediaPreview}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>{message.attachments[0]?.name || 'File'}</span>
                </div>
            );
        }

        return <span className={styles.textPreview}>{message.content}</span>;
    };

    return (
        <div className={styles.replyPreview}>
            <div className={styles.replyLine} />

            <div className={styles.replyContent}>
                <div className={styles.replyHeader}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 11l-6 6v-6m0 0l6-6m-6 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={styles.replyLabel}>
                        Replying to {message.sender_username || 'message'}
                    </span>
                </div>

                <div className={styles.replyMessage}>
                    {renderPreviewContent()}
                </div>
            </div>

            <button
                className={styles.cancelButton}
                onClick={onCancel}
                title="Cancel reply"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </button>
        </div>
    );
};

export default ReplyPreview;
