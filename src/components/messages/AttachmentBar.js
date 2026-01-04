import React, { useRef } from 'react';
import { useAttachmentUpload } from '../../hooks/useAttachmentUpload';
import { useAuth } from '../../hooks/useAuth';
import { focusToast } from '../../utils/focusToast';
import styles from './AttachmentBar.module.css';

const AttachmentBar = ({ onAttach, onClose }) => {
    const { user } = useAuth();
    const { uploadFile, uploading, progress } = useAttachmentUpload();
    const fileInputRef = useRef(null);

    const handleFileSelect = async (type) => {
        const input = document.createElement('input');
        input.type = 'file';

        if (type === 'image') {
            input.accept = 'image/*';
        } else if (type === 'video') {
            input.accept = 'video/*';
        } else if (type === 'audio') {
            input.accept = 'audio/*';
        }

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const attachment = await uploadFile(file, user.id);
                onAttach(attachment);
                focusToast.success('File uploaded successfully');
            } catch (err) {
                focusToast.error('Failed to upload file');
            }
        };

        input.click();
    };

    return (
        <div className={styles.attachmentBar}>
            <div className={styles.attachmentHeader}>
                <h4 className={styles.attachmentTitle}>Add Attachment</h4>
                <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                    ×
                </button>
            </div>

            {uploading && (
                <div className={styles.uploadProgress}>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className={styles.progressText}>{progress}%</span>
                </div>
            )}

            <div className={styles.attachmentOptions}>
                <button
                    className={styles.attachmentOption}
                    onClick={() => handleFileSelect('image')}
                    disabled={uploading}
                >
                    <div className={styles.optionIcon} style={{ background: 'linear-gradient(135deg, #EE7BFA 0%, #8B7FD7 100%)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" fill="white" />
                            <path d="M21 15l-5-5L5 21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className={styles.optionLabel}>Photo</span>
                </button>

                <button
                    className={styles.attachmentOption}
                    onClick={() => handleFileSelect('video')}
                    disabled={uploading}
                >
                    <div className={styles.optionIcon} style={{ background: 'linear-gradient(135deg, #38C2E5 0%, #8B7FD7 100%)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M23 7l-7 5 7 5V7z" fill="white" />
                            <rect x="1" y="5" width="15" height="14" rx="2" stroke="white" strokeWidth="2" fill="none" />
                        </svg>
                    </div>
                    <span className={styles.optionLabel}>Video</span>
                </button>

                <button
                    className={styles.attachmentOption}
                    onClick={() => handleFileSelect('audio')}
                    disabled={uploading}
                >
                    <div className={styles.optionIcon} style={{ background: 'linear-gradient(135deg, #FFD600 0%, #EE7BFA 100%)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M9 18V5l12-2v13M9 18c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-2c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className={styles.optionLabel}>Audio</span>
                </button>

                <button
                    className={styles.attachmentOption}
                    onClick={() => handleFileSelect('file')}
                    disabled={uploading}
                >
                    <div className={styles.optionIcon} style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #38C2E5 100%)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 2v7h7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className={styles.optionLabel}>File</span>
                </button>
            </div>
        </div>
    );
};

export default AttachmentBar;
