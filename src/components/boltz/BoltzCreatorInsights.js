/**
 * BoltzCreatorInsights — Creator Analytics Dashboard
 * Glass card grid with animated counters and engagement breakdown
 */
import React, { useState, useEffect } from 'react';
import styles from './BoltzCreatorInsights.module.css';
import { BarChart3, Eye, Heart, MessageCircle, Share2, Bookmark, TrendingUp, Zap } from 'lucide-react';
import { fetchCreatorInsights } from '../../services/boltzService';
import { formatNumber } from '../../utils/formatNumber';

const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <div className={styles.statCard} style={{ '--delay': `${delay}ms`, '--accent': color }}>
        <div className={styles.statIcon}>
            <Icon size={20} />
        </div>
        <div className={styles.statValue}>{formatNumber(value)}</div>
        <div className={styles.statLabel}>{label}</div>
    </div>
);

const BoltzCreatorInsights = ({ userId, onClose }) => {
    const [insights, setInsights] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const data = await fetchCreatorInsights(userId);
                setInsights(data);
            } catch (_) {}
            setLoading(false);
        })();
    }, [userId]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <BarChart3 size={20} />
                    <h3>Creator Insights</h3>
                    {onClose && <button className={styles.closeBtn} onClick={onClose}>×</button>}
                </div>
                <div className={styles.loadingGrid}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className={styles.skeletonCard} />
                    ))}
                </div>
            </div>
        );
    }

    if (!insights) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <BarChart3 size={20} />
                    <h3>Creator Insights</h3>
                    {onClose && <button className={styles.closeBtn} onClick={onClose}>×</button>}
                </div>
                <p className={styles.emptyText}>
                    Post your first Boltz to start seeing analytics!
                </p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <BarChart3 size={20} />
                <h3>Creator Insights</h3>
                {onClose && <button className={styles.closeBtn} onClick={onClose}>×</button>}
            </div>

            {/* Overview Banner */}
            <div className={styles.banner}>
                <div className={styles.bannerGlow} />
                <div className={styles.bannerStat}>
                    <Zap size={24} className={styles.bannerIcon} />
                    <div>
                        <div className={styles.bannerValue}>{insights.total_boltz}</div>
                        <div className={styles.bannerLabel}>Total Boltz</div>
                    </div>
                </div>
                <div className={styles.bannerDivider} />
                <div className={styles.bannerStat}>
                    <TrendingUp size={24} className={styles.bannerIcon} />
                    <div>
                        <div className={styles.bannerValue}>{formatNumber(insights.total_views)}</div>
                        <div className={styles.bannerLabel}>Total Views</div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className={styles.grid}>
                <StatCard icon={Eye} label="Avg Views" value={insights.avg_views || 0} color="#8b5cf6" delay={0} />
                <StatCard icon={Heart} label="Total Likes" value={insights.total_likes || 0} color="#ff2d55" delay={50} />
                <StatCard icon={MessageCircle} label="Comments" value={insights.total_comments || 0} color="#3b82f6" delay={100} />
                <StatCard icon={Share2} label="Shares" value={insights.total_shares || 0} color="#10b981" delay={150} />
                <StatCard icon={Bookmark} label="Saves" value={insights.total_saves || 0} color="#f59e0b" delay={200} />
                <StatCard icon={Heart} label="Avg Likes" value={insights.avg_likes || 0} color="#ec4899" delay={250} />
            </div>

            {/* Top Performing */}
            {insights.top_boltz?.length > 0 && (
                <div className={styles.topSection}>
                    <h4 className={styles.topTitle}>Top Performing</h4>
                    <div className={styles.topList}>
                        {insights.top_boltz.map((b, i) => (
                            <div key={b.id} className={styles.topItem}>
                                <span className={styles.topRank}>#{i + 1}</span>
                                <div className={styles.topInfo}>
                                    <span className={styles.topViews}>{formatNumber(b.views_count || 0)} views</span>
                                    <span className={styles.topLikes}>{formatNumber(b.likes_count || 0)} ❤️</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoltzCreatorInsights;
