// ReportModal - Main report submission modal
import React, { useState } from 'react';
import { getCategoriesByType } from '../../utils/reportCategories';
import { useReport } from '../../hooks/useReport';
import styles from './ReportModal.module.css';

const ReportModal = ({ isOpen, onClose, contentData }) => {
    const { submit, isSubmitting } = useReport();
    const [step, setStep] = useState(1); // 1: category, 2: details, 3: success
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [description, setDescription] = useState('');
    const [evidenceUrls, setEvidenceUrls] = useState([]);

    if (!isOpen) return null;

    const categories = getCategoriesByType(contentData?.type || 'post');

    const handleSubmit = async () => {
        const reportData = {
            reported_content_id: contentData?.contentId,
            reported_user_id: contentData?.userId,
            content_type: contentData?.type,
            category: selectedCategory,
            description,
            evidence_urls: evidenceUrls
        };

        const result = await submit(reportData);

        if (result.success) {
            setStep(3); // Show success message
            setTimeout(() => {
                handleClose();
            }, 2000);
        }
    };

    const handleClose = () => {
        setStep(1);
        setSelectedCategory(null);
        setDescription('');
        setEvidenceUrls([]);
        onClose();
    };

    return (
        <div className={styles.reportModal} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                {step === 1 && (
                    <>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Report {contentData?.type || 'Content'}</h2>
                            <button className={styles.closeButton} onClick={handleClose}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            <p style={{ color: '#999', marginBottom: '20px' }}>
                                Please select a reason for reporting this {contentData?.type || 'content'}
                            </p>

                            <div className={styles.categoryGrid}>
                                {categories.map((cat) => (
                                    <div
                                        key={cat.id}
                                        className={`${styles.categoryCard} ${selectedCategory === cat.id ? styles.selected : ''}`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        <div className={styles.categoryIcon}>{cat.icon}</div>
                                        <p className={styles.categoryLabel}>{cat.label}</p>
                                        <p className={styles.categoryDescription}>{cat.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={handleClose}>
                                Cancel
                            </button>
                            <button
                                className={`${styles.button} ${styles.buttonPrimary}`}
                                onClick={() => setStep(2)}
                                disabled={!selectedCategory}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Additional Details</h2>
                            <button className={styles.closeButton} onClick={handleClose}>×</button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description (Optional)</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Provide additional context about this report..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    maxLength={1000}
                                />
                                <div className={styles.charCount}>{description.length}/1000</div>
                            </div>

                            <div className={styles.evidenceUpload}>
                                <label className={styles.label}>Evidence (Optional)</label>
                                <button className={styles.uploadButton}>
                                    📎 Add Screenshots or Proof
                                </button>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button className={`${styles.button} ${styles.buttonSecondary}`} onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button
                                className={`${styles.button} ${styles.buttonPrimary}`}
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <div className={styles.successMessage}>
                        <div className={styles.successIcon}>✅</div>
                        <h2 className={styles.successTitle}>Report Submitted</h2>
                        <p className={styles.successText}>
                            Thank you for helping keep Focus safe. We'll review this report and take appropriate action.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportModal;
