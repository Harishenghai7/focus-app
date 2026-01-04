import React from 'react';
import PropTypes from 'prop-types';
import { formatDateAwarded } from '../../utils/badgeFormatter';
import styles from './BadgeAuditLog.module.css';

/**
 * BadgeAuditLog Component
 * Audit log viewer for all badge-related actions
 */
const BadgeAuditLog = ({ auditLog, onRefresh }) => {
    const getActionColor = (action) => {
        switch (action) {
            case 'awarded':
                return 'var(--success)';
            case 'revoked':
                return 'var(--error)';
            case 'applied':
                return 'var(--primary)';
            default:
                return 'var(--text-secondary)';
        }
    };

    return (
        <div className={styles.auditLog}>
            <div className={styles.header}>
                <h3>Audit Log</h3>
                <button className={styles.refreshButton} onClick={onRefresh}>
                    Refresh
                </button>
            </div>

            <div className={styles.logList}>
                {auditLog.map(entry => (
                    <div key={entry.id} className={styles.logEntry}>
                        <div className={styles.timestamp}>
                            {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <div className={styles.action} style={{ color: getActionColor(entry.action) }}>
                            {entry.action.toUpperCase()}
                        </div>
                        <div className={styles.details}>
                            <span className={styles.badgeName}>{entry.badge?.name}</span>
                            <span className={styles.separator}>•</span>
                            <span className={styles.userEmail}>{entry.user?.email}</span>
                            {entry.actor?.email && entry.actor.email !== entry.user?.email && (
                                <>
                                    <span className={styles.separator}>•</span>
                                    <span className={styles.actor}>by {entry.actor.email}</span>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

BadgeAuditLog.propTypes = {
    auditLog: PropTypes.arrayOf(PropTypes.object).isRequired,
    onRefresh: PropTypes.func.isRequired
};

export default BadgeAuditLog;
