// MyReports - User's report history page
import React, { useState } from 'react';
import { useReportHistory } from '../hooks/useReportHistory';
import ReportHistoryCard from '../components/report/ReportHistoryCard';
import PageShell from '../components/layout/PageShell';
import styles from './MyReports.module.css';

const MyReports = () => {
    const [statusFilter, setStatusFilter] = useState('all');
    const { reports, loading, refreshReports } = useReportHistory(
        statusFilter !== 'all' ? { status: statusFilter } : {}
    );

    return (
        <PageShell>
        <div className={styles.myReportsPage}>
            <div className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>My Reports</h1>
                <p className={styles.pageSubtitle}>View and manage your submitted reports</p>
            </div>

            <div className={styles.filterBar}>
                {['all', 'pending', 'under_review', 'resolved', 'dismissed'].map((status) => (
                    <button
                        key={status}
                        className={`${styles.filterButton} ${statusFilter === status ? styles.active : ''}`}
                        onClick={() => setStatusFilter(status)}
                    >
                        {status.replace('_', ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            <div className={styles.reportsContainer}>
                {loading ? (
                    <div className={styles.loading}>Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📋</div>
                        <h3>No Reports Found</h3>
                        <p>You haven't submitted any reports yet.</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <ReportHistoryCard key={report.id} report={report} />
                    ))
                )}
            </div>
        </div>
        </PageShell>
    );
};

export default MyReports;
