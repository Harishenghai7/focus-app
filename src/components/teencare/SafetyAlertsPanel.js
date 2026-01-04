/**
 * Safety Alerts Panel Component
 * Displays and manages safety alerts with severity badges
 */

import React, { useState } from 'react';
import { useSafetyAlerts } from '../../hooks/useSafetyAlerts';
import styles from './SafetyAlertsPanel.module.css';

const SafetyAlertsPanel = ({ teenId, alerts: propAlerts }) => {
    const {
        alerts: hookAlerts,
        markAsReviewed,
        markAsResolved,
        markAsFalsePositive
    } = useSafetyAlerts(teenId);

    const alerts = propAlerts || hookAlerts;
    const [filter, setFilter] = useState('all'); // all, critical, high, medium, low
    const [statusFilter, setStatusFilter] = useState('unread'); // all, unread, reviewed

    const getSeverityColor = (severity) => {
        const colors = {
            critical: '#ef4444',
            high: '#f59e0b',
            medium: '#eab308',
            low: '#10b981'
        };
        return colors[severity] || '#6b7280';
    };

    const getAlertIcon = (type) => {
        const icons = {
            cyberbullying: '😢',
            nsfw_exposure: '🔞',
            adult_stranger_contact: '👤',
            mental_health_concern: '💙',
            personal_info_shared: '🔐',
            location_sharing: '📍',
            grooming_pattern: '⚠️',
            self_harm: '🆘',
            eating_disorder: '💔',
            meetup_planned: '📅'
        };
        return icons[type] || '⚠️';
    };

    const getAlertTypeLabel = (type) => {
        const labels = {
            cyberbullying: 'Cyberbullying',
            nsfw_exposure: 'NSFW Content',
            adult_stranger_contact: 'Adult Stranger Contact',
            mental_health_concern: 'Mental Health Concern',
            personal_info_shared: 'Personal Info Shared',
            location_sharing: 'Location Sharing',
            grooming_pattern: 'Grooming Pattern',
            self_harm: 'Self-Harm',
            eating_disorder: 'Eating Disorder',
            meetup_planned: 'Meetup Planned'
        };
        return labels[type] || type;
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return then.toLocaleDateString();
    };

    const filteredAlerts = alerts.filter(alert => {
        // Severity filter
        if (filter !== 'all' && alert.severity !== filter) return false;

        // Status filter
        if (statusFilter === 'unread' && !['new', 'notified'].includes(alert.status)) return false;
        if (statusFilter === 'reviewed' && alert.status !== 'reviewed') return false;

        return true;
    });

    return (
        <div className={styles.safetyAlertsPanel}>
            {/* Header with Filters */}
            <div className={styles.alertsHeader}>
                <h2>Safety Alerts</h2>
                <div className={styles.filters}>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Alerts</option>
                        <option value="unread">Unread</option>
                        <option value="reviewed">Reviewed</option>
                    </select>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className={styles.filterSelect}
                    >
                        <option value="all">All Severity</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                </div>
            </div>

            {/* Alerts List */}
            <div className={styles.alertsList}>
                {filteredAlerts.length === 0 ? (
                    <div className={styles.emptyAlerts}>
                        <div className={styles.emptyIcon}>✅</div>
                        <h3>All Clear!</h3>
                        <p>No safety alerts to review. Your teen is safe.</p>
                    </div>
                ) : (
                    filteredAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className={`${styles.alertCard} ${styles[alert.severity]} ${alert.status === 'new' || alert.status === 'notified' ? styles.unread : ''}`}
                        >
                            <div className={styles.alertHeaderContent}>
                                <div className={styles.alertIconSeverity}>
                                    <span className={styles.alertTypeIcon}>
                                        {getAlertIcon(alert.alert_type)}
                                    </span>
                                    <span
                                        className={styles.severityBadge}
                                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                                    >
                                        {alert.severity.toUpperCase()}
                                    </span>
                                </div>
                                <span className={styles.alertTime}>{formatTimeAgo(alert.created_at)}</span>
                            </div>

                            <div className={styles.alertContent}>
                                <h3>{alert.title || getAlertTypeLabel(alert.alert_type)}</h3>
                                <p>{alert.description}</p>

                                {alert.related_user && (
                                    <div className={styles.relatedInfo}>
                                        <span className={styles.infoLabel}>Involved User:</span>
                                        <span className={styles.infoValue}>
                                            @{alert.related_user.username}
                                        </span>
                                    </div>
                                )}

                                {alert.ai_confidence_score && (
                                    <div className={styles.confidenceScore}>
                                        <span className={styles.confidenceLabel}>AI Confidence:</span>
                                        <div className={styles.confidenceBar}>
                                            <div
                                                className={styles.confidenceFill}
                                                style={{ width: `${alert.ai_confidence_score * 100}%` }}
                                            />
                                        </div>
                                        <span className={styles.confidenceValue}>
                                            {Math.round(alert.ai_confidence_score * 100)}%
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={styles.alertActions}>
                                {alert.status === 'new' || alert.status === 'notified' ? (
                                    <>
                                        <button
                                            onClick={() => markAsReviewed(alert.id)}
                                            className={`${styles.actionBtn} ${styles.review}`}
                                        >
                                            Mark Reviewed
                                        </button>
                                        <button
                                            onClick={() => markAsResolved(alert.id)}
                                            className={`${styles.actionBtn} ${styles.resolve}`}
                                        >
                                            Resolve
                                        </button>
                                        <button
                                            onClick={() => markAsFalsePositive(alert.id)}
                                            className={`${styles.actionBtn} ${styles.false}`}
                                        >
                                            False Positive
                                        </button>
                                    </>
                                ) : (
                                    <span className={styles.statusBadge}>
                                        {alert.status === 'resolved' && '✅ Resolved'}
                                        {alert.status === 'reviewed' && '👁️ Reviewed'}
                                        {alert.status === 'false_positive' && '❌ False Positive'}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SafetyAlertsPanel;

