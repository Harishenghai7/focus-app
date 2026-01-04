// AdminReports - Admin report management dashboard
import React from 'react';
import { useAdminReports } from '../../hooks/useAdminReports';
import { REPORT_STATUSES, ADMIN_ACTIONS } from '../../utils/reportCategories';
import { useAuth } from '../../hooks/useAuth';
import styles from './AdminReports.module.css';

const AdminReports = () => {
    const { user } = useAuth();
    const { reports, loading, filters, setFilters, takeAction, isProcessing } = useAdminReports();

    // Check if user is admin
    const isAdmin = user?.user_metadata?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className={styles.accessDenied}>
                <h2>Access Denied</h2>
                <p>You don't have permission to access this page.</p>
            </div>
        );
    }

    const handleAction = async (reportId, action) => {
        if (window.confirm(`Are you sure you want to ${action}?`)) {
            await takeAction(reportId, {
                admin_action: action,
                admin_notes: '',
                admin_id: user.id
            });
        }
    };

    return (
        <div className={styles.adminReportsPage}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Report Management</h1>
                <p className={styles.pageSubtitle}>Review and moderate user reports</p>
            </div>

            {/* Filters */}
            <div className={styles.filterBar}>
                <select
                    className={styles.filterSelect}
                    value={filters.status || 'pending'}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                </select>

                <select
                    className={styles.filterSelect}
                    value={filters.priority || ''}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value || undefined })}
                >
                    <option value="">All Priorities</option>
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>

            {/* Reports List */}
            <div className={styles.reportsContainer}>
                {loading ? (
                    <div className={styles.loading}>Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No reports to review</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className={styles.reportCard}>
                            <div className={styles.reportHeader}>
                                <div className={styles.reportInfo}>
                                    <span className={styles.reportId}>#{report.id.slice(0, 8)}</span>
                                    <span className={`${styles.priorityBadge} ${styles[report.priority]}`}>
                                        {report.priority.toUpperCase()}
                                    </span>
                                    <span className={styles.categoryBadge}>{report.category}</span>
                                </div>
                                <span className={styles.reportDate}>
                                    {new Date(report.created_at).toLocaleDateString()}
                                </span>
                            </div>

                            <div className={styles.reportBody}>
                                <p className={styles.reporterInfo}>
                                    Reported by: <strong>{report.reporter?.username}</strong>
                                    {report.reporter?.trust_score && (
                                        <span className={styles.trustScore}>Trust: {report.reporter.trust_score}</span>
                                    )}
                                </p>
                                <p className={styles.reportedInfo}>
                                    Reported: {report.content_type} by <strong>{report.reported_user?.username}</strong>
                                </p>
                                {report.description && (
                                    <p className={styles.description}>{report.description}</p>
                                )}
                            </div>

                            <div className={styles.reportActions}>
                                <button
                                    className={`${styles.actionButton} ${styles.dismissButton}`}
                                    onClick={() => handleAction(report.id, 'dismiss')}
                                    disabled={isProcessing}
                                >
                                    Dismiss
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.warnButton}`}
                                    onClick={() => handleAction(report.id, 'warning')}
                                    disabled={isProcessing}
                                >
                                    Warn
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.removeButton}`}
                                    onClick={() => handleAction(report.id, 'remove_content')}
                                    disabled={isProcessing}
                                >
                                    Remove Content
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.suspendButton}`}
                                    onClick={() => handleAction(report.id, 'suspend_7d')}
                                    disabled={isProcessing}
                                >
                                    Suspend
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminReports;
