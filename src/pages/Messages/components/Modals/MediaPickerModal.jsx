/* ═══════════════════════════════════════════════════════════════════════
   MEDIA PICKER MODAL - Upload photos/videos
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useRef } from 'react';
import { uploadImages, uploadVideo, validateFileType, formatFileSize, generateVideoThumbnail } from '../../utils/mediaUpload';
import styles from './MediaPickerModal.module.css';

const MediaPickerModal = ({ onClose, onSend, currentUserId }) => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [caption, setCaption] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);

        // Validate files
        const validFiles = files.filter(file => {
            const isValid = validateFileType(file, ['image', 'video']);
            if (!isValid) {
                alert(`${file.name} is not a valid image or video file`);
            }
            return isValid;
        });

        if (validFiles.length === 0) return;

        // Generate previews
        const newPreviews = await Promise.all(
            validFiles.map(async (file) => {
                if (file.type.startsWith('image/')) {
                    return {
                        type: 'image',
                        url: URL.createObjectURL(file),
                        file,
                        size: formatFileSize(file.size)
                    };
                } else {
                    const thumbnail = await generateVideoThumbnail(file);
                    return {
                        type: 'video',
                        url: thumbnail,
                        file,
                        size: formatFileSize(file.size)
                    };
                }
            })
        );

        setSelectedFiles([...selectedFiles, ...validFiles]);
        setPreviews([...previews, ...newPreviews]);
    };

    const handleRemoveFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        setPreviews(newPreviews);
    };

    const handleSend = async () => {
        if (selectedFiles.length === 0) return;

        try {
            setUploading(true);
            const messageId = crypto.randomUUID();

            // Separate images and videos
            const images = selectedFiles.filter(f => f.type.startsWith('image/'));
            const videos = selectedFiles.filter(f => f.type.startsWith('video/'));

            let mediaUrls = [];
            let messageType = 'image';

            // Upload images
            if (images.length > 0) {
                setUploadProgress(30);
                const imageUrls = await uploadImages(images, currentUserId, messageId);
                mediaUrls = [...mediaUrls, ...imageUrls];
            }

            // Upload video
            if (videos.length > 0) {
                setUploadProgress(60);
                const { url } = await uploadVideo(videos[0], currentUserId, messageId);
                mediaUrls.push(url);
                messageType = 'video';
            }

            setUploadProgress(100);

            // Send message
            await onSend(caption || null, {
                type: messageType,
                media_urls: mediaUrls
            });

            onClose();
        } catch (error) {
            console.error('Error uploading media:', error);
            alert(error.message || 'Failed to upload media');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h2>Send Photo/Video</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                {/* Preview Area */}
                <div className={styles.previewArea}>
                    {previews.length === 0 ? (
                        <div className={styles.emptyState}>
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                                <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <p>Select photos or videos</p>
                            <button onClick={() => fileInputRef.current?.click()} className={styles.selectButton}>
                                Choose Files
                            </button>
                        </div>
                    ) : (
                        <div className={styles.previewGrid}>
                            {previews.map((preview, index) => (
                                <div key={index} className={styles.previewCard}>
                                    <img src={preview.url} alt="Preview" className={styles.previewImage} />
                                    {preview.type === 'video' && (
                                        <div className={styles.videoOverlay}>
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                                <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.6)" />
                                                <path d="M10 8l6 4-6 4V8z" fill="white" />
                                            </svg>
                                        </div>
                                    )}
                                    <button onClick={() => handleRemoveFile(index)} className={styles.removeButton}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                            <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" />
                                        </svg>
                                    </button>
                                    <span className={styles.fileSize}>{preview.size}</span>
                                </div>
                            ))}

                            {/* Add More Button */}
                            {previews.length < 10 && (
                                <button onClick={() => fileInputRef.current?.click()} className={styles.addMoreButton}>
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    <span>Add More</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Caption Input */}
                {previews.length > 0 && (
                    <div className={styles.captionArea}>
                        <input
                            type="text"
                            placeholder="Add a caption..."
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className={styles.captionInput}
                        />
                    </div>
                )}

                {/* Upload Progress */}
                {uploading && (
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}

                {/* Actions */}
                {previews.length > 0 && (
                    <div className={styles.actions}>
                        <button onClick={onClose} className={styles.cancelButton} disabled={uploading}>
                            Cancel
                        </button>
                        <button onClick={handleSend} className={styles.sendButton} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Send'}
                        </button>
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>
        </div>
    );
};

export default MediaPickerModal;
