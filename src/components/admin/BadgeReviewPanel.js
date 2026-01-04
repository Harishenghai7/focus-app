import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BadgeDisplay from '../badge/BadgeDisplay';
import { BADGE_DEFINITIONS } from '../../utils/badgeRules';
import { formatDateAwarded } from '../../utils/badgeFormatter';
import styles from './BadgeReviewPanel.module.css';

/**
 * BadgeReviewPanel Component
 * Review interface for badge applications with approve/reject actions
 */
const BadgeReviewPanel = ({ applications, onApprove, onReject }) => {
    const [selectedApp, setSelectedApp] = useState(null);
    const [response, setResponse] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleApprove = async (appId) => {
        setProcessing(true);
        await onApprove(appId, response);
        setResponse('');
        setSelectedApp(null);
        setProcessing(false);
    };

    const handleReject = async (appId) => {
        setProcessing(true);
        await onReject(appId, response);
        setResponse('');
        setSelectedApp(null);
        setProcessing(false);
    };

    if (applications.length === 0) {
        return (
            <div className={styles.empty}>
                <p>No pending applications</p>
            </div>
        );
    }

    return (
        <div className={styles.reviewPanel}>
            <div className={styles.applicationList}>
                {applications.map(app => {
                    const definition = BADGE_DEFINITIONS[app.badge?.name];
                    const isSelected = selectedApp?.id === app.id;

                    return (
                        <div
                            key={app.id}
                            className={`${styles.applicationCard} ${isSelected ? styles.selected : ''}`}
                            onClick={() => setSelectedApp(app)}
                        >
                            <div className={styles.cardHeader}>
                                <BadgeDisplay badge={definition} size="md" showTooltip={false} />
                                <div className={styles.cardInfo}>
                                    <div className={styles.badgeName}>{definition?.name}</div>
                                    <div className={styles.applicantEmail}>{app.user?.email}</div>
                                </div>
                            </div>
                            <div className={styles.cardDate}>
                                Applied {formatDateAwarded(app.created_at)}
                            </div>
                            <div className={styles.status}>{app.status}</div>
                        </div>
                    );
                })}
            </div>

            {selectedApp && (
                <div className={styles.reviewSection}>
                    <div className={styles.reviewHeader}>
                        <h3>Review Application</h3>
                        <button
                            className={styles.closeButton}
                            onClick={() => setSelectedApp(null)}
                        >
                            ×
                        </button>
                    </div>

                    <div className={styles.applicationDetails}>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Badge:</span>
                            <span className={styles.detailValue}>
                                {BADGE_DEFINITIONS[selectedApp.badge?.name]?.name}
                            </span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Applicant:</span>
                            <span className={styles.detailValue}>{selectedApp.user?.email}</span>
                        </div>
                        <div className={styles.detailRow}>
                            <span className={styles.detailLabel}>Applied:</span>
                            <span className={styles.detailValue}>
                                {new Date(selectedApp.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className={styles.applicationData}>
                        <h4>Application Data</h4>
                        <pre className={styles.dataPreview}>
                            {JSON.stringify(selectedApp.application_data, null, 2)}
                        </pre>
                    </div>

                    <div className={styles.responseSection}>
                        <label className={styles.responseLabel}>
                            Admin Response (optional)
                        </label>
                        <textarea
                            className={styles.responseTextarea}
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Add a message for the applicant..."
                            rows={4}
                        />
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.rejectButton}
                            onClick={() => handleReject(selectedApp.id)}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Reject'}
                        </button>
                        <button
                            className={styles.approveButton}
                            onClick={() => handleApprove(selectedApp.id)}
                            disabled={processing}
                        >
                            {processing ? 'Processing...' : 'Approve'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

BadgeReviewPanel.propTypes = {
    applications: PropTypes.arrayOf(PropTypes.object).isRequired,
    onApprove: PropTypes.func.isRequired,
    onReject: PropTypes.func.isRequired
};

export default BadgeReviewPanel;
