import React from 'react';
import styles from './UploadOverlay.module.css';
import LoadingSpinner from '../shared/LoadingSpinner';
import { CheckCircle } from 'lucide-react';

const UploadOverlay = ({ progress, isComplete, error }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.content}>
                {error ? (
                    <>
                        <div className={styles.error}>❌</div>
                        <h3>Upload Failed</h3>
                        <p>{error}</p>
                    </>
                ) : isComplete ? (
                    <>
                        <CheckCircle size={64} className={styles.success} />
                        <h3>Published Successfully!</h3>
                        <p>Your content is now live</p>
                    </>
                ) : (
                    <>
                        <LoadingSpinner size="lg" />
                        <h3>Uploading...</h3>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p>{Math.round(progress)}%</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default UploadOverlay;
