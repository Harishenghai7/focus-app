// ReportButton - Quick report button for content
import React, { useState } from 'react';
import ReportModal from './ReportModal';
import styles from './ReportButton.module.css';

const ReportButton = ({ contentData, className }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <button
                className={`${styles.reportButton} ${className || ''}`}
                onClick={() => setShowModal(true)}
                title="Report"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M2 17L12 22L22 17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    <path
                        d="M2 12L12 17L22 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                <span>Report</span>
            </button>

            <ReportModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                contentData={contentData}
            />
        </>
    );
};

export default ReportButton;
