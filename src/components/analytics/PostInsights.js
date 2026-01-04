/**
 * PostInsights Component
 * Analytics dashboard for post creators
 * Basic analytics for all users, advanced for verified users
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../shared/LoadingSpinner';
import styles from './PostInsights.module.css';

const PostInsights = ({ postId, onClose }) => {
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, all

    // Fetch post analytics
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['post-insights', postId, timeRange],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('post_analytics')
                .select('*')
                .eq('post_id', postId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!postId
    });

    // Fetch advanced analytics for verified users
    const { data: advancedAnalytics } = useQuery({
        queryKey: ['post-insights-advanced', postId, timeRange],
        queryFn: async () => {
            // Fetch demographics, reach, peak times
            const { data, error } = await supabase
                .rpc('get_post_advanced_analytics', {
                    post_uuid: postId,
                    time_range: timeRange
                });

            if (error) throw error;
            return data;
        },
        enabled: !!postId && user?.is_verified
    });

    if (isLoading) {
        return (
            <div className={styles.modal}>
                <LoadingSpinner />
            </div>
        );
    }

    const engagementRate = analytics ?
        ((analytics.likes_count + analytics.comments_count + analytics.shares_count) /
            (analytics.views_count || 1) * 100).toFixed(2) : 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Post Insights</h2>
                    <button onClick={onClose} className={styles.closeBtn}>✕</button>
                </div>

                {/* Time Range Selector */}
                <div className={styles.timeRange}>
                    <button
                        className={timeRange === '7d' ? styles.active : ''}
                        onClick={() => setTimeRange('7d')}
                    >
                        Last 7 days
                    </button>
                    <button
                        className={timeRange === '30d' ? styles.active : ''}
                        onClick={() => setTimeRange('30d')}
                    >
                        Last 30 days
                    </button>
                    <button
                        className={timeRange === 'all' ? styles.active : ''}
                        onClick={() => setTimeRange('all')}
                    >
                        All time
                    </button>
                </div>

                {/* Basic Analytics (All Users) */}
                <div className={styles.section}>
                    <h3>Overview</h3>
                    <div className={styles.metricsGrid}>
                        <MetricCard
                            icon="👁️"
                            label="Views"
                            value={analytics?.views_count || 0}
                        />
                        <MetricCard
                            icon="❤️"
                            label="Likes"
                            value={analytics?.likes_count || 0}
                        />
                        <MetricCard
                            icon="💬"
                            label="Comments"
                            value={analytics?.comments_count || 0}
                        />
                        <MetricCard
                            icon="🔗"
                            label="Shares"
                            value={analytics?.shares_count || 0}
                        />
                        <MetricCard
                            icon="💾"
                            label="Saves"
                            value={analytics?.saves_count || 0}
                        />
                        <MetricCard
                            icon="📊"
                            label="Engagement Rate"
                            value={`${engagementRate}%`}
                        />
                    </div>
                </div>

                {/* Advanced Analytics (Verified Users Only) */}
                {user?.is_verified && advancedAnalytics && (
                    <>
                        <div className={styles.divider} />

                        <div className={styles.section}>
                            <h3>
                                Audience Demographics
                                <span className={styles.verifiedBadge}>✓ Verified Only</span>
                            </h3>
                            <div className={styles.demographics}>
                                <DemographicChart data={advancedAnalytics.demographics} />
                            </div>
                        </div>

                        <div className={styles.divider} />

                        <div className={styles.section}>
                            <h3>Reach & Impressions</h3>
                            <div className={styles.metricsGrid}>
                                <MetricCard
                                    icon="🌍"
                                    label="Reach"
                                    value={advancedAnalytics.reach || 0}
                                    description="Unique users who saw this post"
                                />
                                <MetricCard
                                    icon="👀"
                                    label="Impressions"
                                    value={advancedAnalytics.impressions || 0}
                                    description="Total times this post was viewed"
                                />
                            </div>
                        </div>

                        <div className={styles.divider} />

                        <div className={styles.section}>
                            <h3>Peak Activity Times</h3>
                            <div className={styles.peakTimes}>
                                <PeakTimesChart data={advancedAnalytics.peak_times} />
                            </div>
                        </div>
                    </>
                )}

                {/* Export Data */}
                <div className={styles.footer}>
                    <button
                        className={styles.exportBtn}
                        onClick={() => exportData(analytics, advancedAnalytics)}
                    >
                        📥 Export Data
                    </button>
                </div>
            </div>
        </div>
    );
};

// Metric Card Component
const MetricCard = ({ icon, label, value, description }) => (
    <div className={styles.metricCard}>
        <div className={styles.metricIcon}>{icon}</div>
        <div className={styles.metricContent}>
            <div className={styles.metricValue}>{value.toLocaleString()}</div>
            <div className={styles.metricLabel}>{label}</div>
            {description && <div className={styles.metricDescription}>{description}</div>}
        </div>
    </div>
);

// Demographic Chart Component (Placeholder)
const DemographicChart = ({ data }) => (
    <div className={styles.chart}>
        <p>Age groups, locations, and interests will be displayed here</p>
        {/* Implement with Chart.js or Recharts */}
    </div>
);

// Peak Times Chart Component (Placeholder)
const PeakTimesChart = ({ data }) => (
    <div className={styles.chart}>
        <p>Best times to post based on your audience activity</p>
        {/* Implement with Chart.js or Recharts */}
    </div>
);

// Export data function
const exportData = (analytics, advancedAnalytics) => {
    const data = {
        basic: analytics,
        advanced: advancedAnalytics,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post-insights-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export default PostInsights;
