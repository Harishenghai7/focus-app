import React, { useState } from 'react';
import { useAdminBadgePanel } from '../../hooks/useAdminBadgePanel';
import BadgeReviewPanel from './BadgeReviewPanel';
import BadgeAuditLog from './BadgeAuditLog';
import styles from './BadgeAdminDashboard.module.css';

/**
 * BadgeAdminDashboard Component
 * Main admin panel for badge management
 */
const BadgeAdminDashboard = () => {
    const {
        isAdmin,
        applications,
        auditLog,
        loading,
        approveApplication,
        rejectApplication,
        refreshAuditLog
    } = useAdminBadgePanel();

    const [activeTab, setActiveTab] = useState('applications'); // applications, audit

    if (!isAdmin) {
        return (
            <div className={styles.unauthorized}>
                <h2>Unauthorized</h2>
                <p>You do not have permission to access this page.</p>
            </div>
        );
    }

    if (loading) {
        return <div className={styles.loading}>Loading admin panel...</div>;
    }

    return (
        <div className={styles.adminDashboard}>
            <div className={styles.header}>
                <h1 className={styles.title}>Badge Administration</h1>
                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <div className={styles.statValue}>{applications.length}</div>
                        <div className={styles.statLabel}>Pending Applications</div>
                    </div>
                </div>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'applications' ? styles.active : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    Applications ({applications.length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'audit' ? styles.active : ''}`}
                    onClick={() => setActiveTab('audit')}
                >
                    Audit Log
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'applications' && (
                    <BadgeReviewPanel
                        applications={applications}
                        onApprove={approveApplication}
                        onReject={rejectApplication}
                    />
                )}

                {activeTab === 'audit' && (
                    <BadgeAuditLog
                        auditLog={auditLog}
                        onRefresh={refreshAuditLog}
                    />
                )}
            </div>
        </div>
    );
};

export default BadgeAdminDashboard;
