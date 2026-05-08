import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './ActivityPulse.module.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const ActivityPulse = ({ insights, isOwnProfile }) => {
    const {
        weeklyActivity = [0, 0, 0, 0, 0, 0, 0],
        totalPosts = 0,
        totalLikes = 0,
        totalComments = 0,
        engagementRate = 0,
        topPost = null,
        totalReach = 0,
    } = insights || {};

    const maxActivity = useMemo(() => Math.max(...weeklyActivity, 1), [weeklyActivity]);

    const sparklinePoints = useMemo(() => {
        const width = 200;
        const height = 40;
        const padding = 4;
        const points = weeklyActivity.map((val, i) => {
            const x = padding + (i / (weeklyActivity.length - 1)) * (width - padding * 2);
            const y = height - padding - (val / maxActivity) * (height - padding * 2);
            return `${x},${y}`;
        });
        return points.join(' ');
    }, [weeklyActivity, maxActivity]);

    const sparklineFillPoints = useMemo(() => {
        const width = 200;
        const height = 40;
        const padding = 4;
        const points = weeklyActivity.map((val, i) => {
            const x = padding + (i / (weeklyActivity.length - 1)) * (width - padding * 2);
            const y = height - padding - (val / maxActivity) * (height - padding * 2);
            return `${x},${y}`;
        });
        return `${padding},${height - padding} ${points.join(' ')} ${width - padding},${height - padding}`;
    }, [weeklyActivity, maxActivity]);

    // Only show for own profile — placed after all hooks
    if (!isOwnProfile) return null;

    const formatNumber = (num) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <motion.section
            className={styles.pulse}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Activity Insights"
        >
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <span className={styles.titleIcon}>📊</span>
                    Activity Insights
                </h3>
                <span className={styles.period}>Last 7 days</span>
            </div>

            {/* Sparkline Chart */}
            <div className={styles.sparklineWrap}>
                <svg viewBox="0 0 200 40" className={styles.sparkline} preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                        </linearGradient>
                        <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="var(--primary-light)" />
                            <stop offset="100%" stopColor="var(--primary)" />
                        </linearGradient>
                    </defs>
                    <motion.polygon
                        points={sparklineFillPoints}
                        fill="url(#sparkFill)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                    />
                    <motion.polyline
                        points={sparklinePoints}
                        fill="none"
                        stroke="url(#sparkLine)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                </svg>
                <div className={styles.dayLabels}>
                    {DAYS.map((day, i) => (
                        <span key={day} className={styles.dayLabel}>{day}</span>
                    ))}
                </div>
            </div>

            {/* Metric Cards */}
            <div className={styles.metrics}>
                <div className={styles.metricCard}>
                    <span className={styles.metricValue}>{formatNumber(totalPosts)}</span>
                    <span className={styles.metricLabel}>Posts</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricValue}>{formatNumber(totalLikes)}</span>
                    <span className={styles.metricLabel}>Likes</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricValue}>{formatNumber(totalComments)}</span>
                    <span className={styles.metricLabel}>Comments</span>
                </div>
                <div className={styles.metricCard}>
                    <span className={styles.metricValue}>{engagementRate.toFixed(1)}%</span>
                    <span className={styles.metricLabel}>Engagement</span>
                </div>
            </div>

            {/* Reach indicator */}
            {totalReach > 0 && (
                <div className={styles.reachBar}>
                    <div className={styles.reachInfo}>
                        <span className={styles.reachLabel}>Total Reach</span>
                        <span className={styles.reachValue}>{formatNumber(totalReach)}</span>
                    </div>
                    <div className={styles.reachTrack}>
                        <motion.div
                            className={styles.reachFill}
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </div>
                </div>
            )}
        </motion.section>
    );
};

export default ActivityPulse;
