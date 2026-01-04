/**
 * Activity Overview Component
 * Shows teen's activity summary with charts and timeline
 */

import React, { useState, useEffect } from 'react';
import { getRecentActivities } from '../../utils/activityLogger';
import styles from './ActivityOverview.module.css';

const ActivityOverview = ({ teenId, activityData }) => {
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('week'); // week, month

    useEffect(() => {
        if (!teenId) return;

        const fetchRecent = async () => {
            setLoading(true);
            try {
                const activities = await getRecentActivities(teenId, 20);
                setRecentActivities(activities);
            } catch (error) {
                console.error('Error fetching recent activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecent();
    }, [teenId]);

    const getActivityIcon = (type) => {
        const icons = {
            post_created: '📝',
            post_deleted: '🗑️',
            followed_user: '➕',
            unfollowed_user: '➖',
            new_follower: '👤',
            content_reported: '🚩',
            account_blocked: '🚫',
            message_sent: '💬',
            profile_updated: '✏️',
            location_shared: '📍'
        };
        return icons[type] || '📊';
    };

    const getActivityLabel = (type) => {
        const labels = {
            post_created: 'Created a post',
            post_deleted: 'Deleted a post',
            followed_user: 'Followed someone',
            unfollowed_user: 'Unfollowed someone',
            new_follower: 'New follower',
            content_reported: 'Reported content',
            account_blocked: 'Blocked an account',
            message_sent: 'Sent a message',
            profile_updated: 'Updated profile',
            location_shared: 'Shared location'
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

    if (loading) {
        return (
            <div className={`${styles.activityOverview} ${styles.loading}`}>
                <div className={styles.loader}></div>
            </div>
        );
    }

    return (
        <div className={styles.activityOverview}>
            {/* Time Frame Selector */}
            <div className={styles.overviewHeader}>
                <h2>Activity Overview</h2>
                <div className={styles.timeframeSelector}>
                    <button
                        className={timeframe === 'week' ? styles.active : ''}
                        onClick={() => setTimeframe('week')}
                    >
                        Last 7 Days
                    </button>
                    <button
                        className={timeframe === 'month' ? styles.active : ''}
                        onClick={() => setTimeframe('month')}
                    >
                        Last 30 Days
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryCards}>
                <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>📝</div>
                    <div className={styles.cardContent}>
                        <h3>{activityData?.posts_created || 0}</h3>
                        <p>Posts Created</p>
                    </div>
                </div>

                <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>➕</div>
                    <div className={styles.cardContent}>
                        <h3>{activityData?.users_followed || 0}</h3>
                        <p>Users Followed</p>
                    </div>
                </div>

                <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>👥</div>
                    <div className={styles.cardContent}>
                        <h3>{activityData?.new_followers || 0}</h3>
                        <p>New Followers</p>
                    </div>
                </div>

                <div className={styles.summaryCard}>
                    <div className={styles.cardIcon}>💬</div>
                    <div className={styles.cardContent}>
                        <h3>{activityData?.messages_sent || 0}</h3>
                        <p>Messages Sent</p>
                    </div>
                </div>
            </div>

            {/* Activity Timeline */}
            <div className={styles.activityTimeline}>
                <h3>Recent Activity</h3>

                {recentActivities.length === 0 ? (
                    <div className={styles.emptyTimeline}>
                        <div className={styles.emptyIcon}>📊</div>
                        <p>No recent activity to display</p>
                    </div>
                ) : (
                    <div className={styles.timelineList}>
                        {recentActivities.map((activity) => (
                            <div key={activity.id} className={styles.timelineItem}>
                                <div className={styles.timelineIcon}>
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className={styles.timelineContent}>
                                    <p className={styles.timelineAction}>
                                        {getActivityLabel(activity.activity_type)}
                                    </p>
                                    {activity.details?.username && (
                                        <p className={styles.timelineDetail}>
                                            @{activity.details.username}
                                        </p>
                                    )}
                                    <p className={styles.timelineTime}>
                                        {formatTimeAgo(activity.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Key Insights */}
            {activityData && (
                <div className={styles.keyInsights}>
                    <h3>Key Insights</h3>
                    <div className={styles.insightsGrid}>
                        <div className={styles.insightCard}>
                            <span className={styles.insightLabel}>Most Active Day:</span>
                            <span className={styles.insightValue}>Today</span>
                        </div>
                        <div className={styles.insightCard}>
                            <span className={styles.insightLabel}>Engagement:</span>
                            <span className={styles.insightValue}>
                                {activityData.posts_created > 0 ? 'Active' : 'Low'}
                            </span>
                        </div>
                        <div className={styles.insightCard}>
                            <span className={styles.insightLabel}>Safety Reports:</span>
                            <span className={styles.insightValue}>
                                {activityData.content_reported || 0}
                            </span>
                        </div>
                        <div className={styles.insightCard}>
                            <span className={styles.insightLabel}>Blocked Accounts:</span>
                            <span className={styles.insightValue}>
                                {activityData.accounts_blocked || 0}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityOverview;

