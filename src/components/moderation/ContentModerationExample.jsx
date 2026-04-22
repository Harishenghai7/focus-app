// ═══════════════════════════════════════════════════════════════════════════════
// 🛡️ CONTENT MODERATION INTEGRATION EXAMPLE
// ═══════════════════════════════════════════════════════════════════════════════
// Shows how to integrate the complete Content Filter & Moderator system
// into CreatePost, CreateBoltz, or any content upload flow
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { useUploadMedia } from '../../hooks/useUploadMedia';
import { useContentModeration } from '../../hooks/useContentModeration';
import ContentIntegrityModal from './ContentIntegrityModal';
import Button from '../shared/Button';
import styles from './ContentModerationExample.module.css';

/**
 * Example: CreatePost with Content Moderation
 * 
 * This demonstrates the 5 layers of the Focus Content Filter:
 * 1. Pre-upload AI scanning (TensorFlow.js)
 * 2. Quality control (blur, brightness checks)
 * 3. User feedback (H2 modal warnings)
 * 4. Database safety tagging (RLS enforcement)
 * 5. UI/UX perfection (glassmorphism, progress bars)
 */
const ContentModerationExample = () => {
    // Form state
    const [caption, setCaption] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // Upload hook with moderation enabled
    const {
        uploadFile,
        uploading,
        progress,
        error: uploadError,
        isScanning,
        scanProgress,
        lastModerationResult,
        contentRating,
        safetyHash,
        reset
    } = useUploadMedia({
        enableModeration: true,
        onModerationResult: (result) => {
            console.log('[Upload] Moderation result:', result);
        }
    });

    // Content moderation hook for additional scanning
    const {
        performPurityScan,
        scanStageLabel,
        wouldBeBlocked,
        violationSummary
    } = useContentModeration({
        onViolation: (violations) => {
            console.warn('[Upload] Violations detected:', violations);
        }
    });

    // Handle file selection
    const handleFileSelect = useCallback((e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        setShowModal(false);
    }, []);

    // Handle upload with moderation
    const handleUpload = useCallback(async () => {
        if (selectedFiles.length === 0) return;

        try {
            // Show moderation modal
            setShowModal(true);

            // Upload with automatic moderation
            const result = await uploadFile(selectedFiles[0], 'posts', {
                caption: caption
            });

            if (result) {
                console.log('[Upload] Success:', {
                    url: result.url,
                    contentRating: result.contentRating,
                    safetyHash: result.safetyHash,
                    moderationPassed: result.moderationPassed
                });

                // Reset form
                setCaption('');
                setSelectedFiles([]);
                
                // Close modal after brief delay
                setTimeout(() => {
                    setShowModal(false);
                    reset();
                }, 2000);
            }

        } catch (err) {
            console.error('[Upload] Failed:', err);
            
            // Error is already handled by the modal
            // The modal will show blocked/warning state
        }
    }, [selectedFiles, caption, uploadFile, reset]);

    // Handle retry after violation
    const handleRetry = useCallback(() => {
        setSelectedFiles([]);
        setCaption('');
        setShowModal(false);
        reset();
    }, [reset]);

    // Handle close modal
    const handleCloseModal = useCallback(() => {
        setShowModal(false);
        if (!uploading && !isScanning) {
            reset();
        }
    }, [uploading, isScanning, reset]);

    // Handle continue despite warnings
    const handleContinue = useCallback(() => {
        // If content passed but had warnings, user can proceed
        setShowModal(false);
    }, []);

    // Preview selected files
    const previewUrl = selectedFiles.length > 0 
        ? URL.createObjectURL(selectedFiles[0]) 
        : null;

    return (
        <div className={styles.container}>
            <h2>Create Post (with Content Moderation)</h2>

            {/* Caption Input */}
            <div className={styles.field}>
                <label>Caption</label>
                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write something meaningful..."
                    rows={3}
                    disabled={uploading}
                />
            </div>

            {/* File Selection */}
            <div className={styles.field}>
                <label>Media</label>
                <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                />
            </div>

            {/* Preview */}
            {previewUrl && (
                <div className={styles.preview}>
                    <img src={previewUrl} alt="Preview" />
                </div>
            )}

            {/* Upload Button */}
            <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploading}
                loading={uploading}
            >
                {uploading ? 'Uploading...' : 'Upload with Safety Check'}
            </Button>

            {/* Status Display */}
            {isScanning && (
                <div className={styles.scanningStatus}>
                    <div className={styles.progressBar}>
                        <div 
                            className={styles.progressFill} 
                            style={{ width: `${scanProgress}%` }}
                        />
                    </div>
                    <p>Analyzing content integrity... {Math.round(scanProgress)}%</p>
                </div>
            )}

            {/* Error Display */}
            {uploadError && (
                <div className={styles.error}>
                    {uploadError}
                </div>
            )}

            {/* Content Integrity Modal */}
            <ContentIntegrityModal
                isOpen={showModal}
                onClose={handleCloseModal}
                onRetry={handleRetry}
                onContinue={handleContinue}
                scanResult={lastModerationResult}
                scanProgress={scanProgress}
                scanStage={isScanning ? 'Analyzing...' : ''}
                isScanning={isScanning}
                contentType="post"
            />

            {/* Debug Info (remove in production) */}
            {lastModerationResult && (
                <div className={styles.debug}>
                    <h4>Debug: Last Moderation Result</h4>
                    <pre>{JSON.stringify({
                        passed: lastModerationResult.passed,
                        blocked: lastModerationResult.blocked,
                        contentRating: lastModerationResult.contentRating,
                        safetyHash: lastModerationResult.safetyHash,
                        violations: lastModerationResult.violations?.length,
                        warnings: lastModerationResult.warnings?.length
                    }, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default ContentModerationExample;
