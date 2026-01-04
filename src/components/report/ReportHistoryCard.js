// ReportHistoryCard - Individual report card in history view
import React from 'react';
import { REPORT_STATUSES, getCategoryById } from '../../utils/reportCategories';
import styles from './ReportHistoryCard.module.css';

const ReportHistoryCard = ({ report }) => {
    const status = REPORT_STATUSES[report.status];
    const category = getCategoryById(report.category, report.content_type);
    const formattedDate = new Date(report.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    return (
        <div className={styles.reportCard}>
            <div className={styles.cardHeader}>
                <div className={styles.categoryBadge}>
                    <span className={styles.categoryIcon}>{category?.icon}</span>
                    <span>{category?.label}</span>
                </div>
                <div
                    className={styles.statusBadge}
                    style={{ backgroundColor: status?.color + '22', color: status?.color }}
                >
                    {status?.icon} {status?.label}
                </div>
            </div>

            <div className={styles.cardBody}>
                <p className={styles.reportType}>
                    Reported {report.content_type}: <span>#{report.reported_content_id?.slice(0, 8)}</span>
                </p>
                {report.description && (
                    <p className={styles.description}>{report.description}</p>
                )}
            </div>

            <div className={styles.cardFooter}>
                <span className={styles.dateText}>{formattedDate}</span>
                {report.status === 'pending' && (
                    <button className={styles.withdrawButton}>Withdraw Report</button>
                )}
            </div>
        </div>
    );
};

export default ReportHistoryCard;
