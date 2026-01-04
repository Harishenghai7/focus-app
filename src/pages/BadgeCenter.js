import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import BadgeDisplay from '../components/badge/BadgeDisplay';
import BadgeProgress from '../components/badge/BadgeProgress';
import BadgeApplication from '../components/badge/BadgeApplication';
import BadgeCount from '../components/shared/BadgeCount';
import { useUserBadges } from '../hooks/useUserBadges';
import { useBadgeCriteria } from '../hooks/useBadgeCriteria';
import { useBadgeProgress } from '../hooks/useBadgeProgress';
import { useAuth } from '../hooks/useAuth';
import { BADGE_DEFINITIONS, getAllBadgeDefinitions } from '../utils/badgeRules';
import { formatDateAwarded, groupBadgesByCategory } from '../utils/badgeFormatter';
import styles from './BadgeCenter.module.css';

/**
 * BadgeCenter Page
 * Main badge center showing all badges, progress, and application options
 */
const BadgeCenter = () => {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { badges, badgeCount, loading: badgesLoading } = useUserBadges();
    const { eligibleBadges, loading: criteriaLoading } = useBadgeCriteria();
    const { progress, nextBadge, loading: progressLoading } = useBadgeProgress();

    const [selectedBadge, setSelectedBadge] = useState(null);
    const [showApplication, setShowApplication] = useState(false);
    const [activeTab, setActiveTab] = useState('all'); // all, earned, locked

    const loading = authLoading || badgesLoading || criteriaLoading || progressLoading;

    if (authLoading) {
        return (
            <MainLayout>
                <div className={styles.loading}>Loading...</div>
            </MainLayout>
        );
    }

    if (!user) {
        navigate('/auth');
        return null;
    }

    const allBadgeDefinitions = getAllBadgeDefinitions();
    const earnedBadgeNames = badges.map(b => b.badge?.name);
    const categorizedBadges = groupBadgesByCategory(badges);

    const handleBadgeClick = (badgeName) => {
        const definition = BADGE_DEFINITIONS[badgeName];
        setSelectedBadge({ name: badgeName, ...definition });
    };

    const handleApply = (badgeName) => {
        const definition = BADGE_DEFINITIONS[badgeName];
        setSelectedBadge({ name: badgeName, ...definition });
        setShowApplication(true);
    };

    return (
        <MainLayout>
            <div className={styles.badgeCenter}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h1 className={styles.title}>Badge Center</h1>
                        <p className={styles.subtitle}>Earn badges by completing achievements and verifications</p>
                    </div>
                    <BadgeCount count={badgeCount} size="lg" />
                </div>

                {/* Next Badge to Earn */}
                {nextBadge && (
                    <div className={styles.nextBadge}>
                        <div className={styles.nextBadgeIcon}>
                            <BadgeDisplay badge={nextBadge} size="xl" showTooltip={false} />
                        </div>
                        <div className={styles.nextBadgeInfo}>
                            <div className={styles.nextBadgeLabel}>Next Badge</div>
                            <div className={styles.nextBadgeName}>{nextBadge.name}</div>
                            <div className={styles.nextBadgeProgress}>
                                {nextBadge.progressPercent}% complete
                            </div>
                        </div>
                        {nextBadge.requiresApplication && nextBadge.progressPercent === 100 && (
                            <button
                                className={styles.applyButton}
                                onClick={() => handleApply(nextBadge.badgeType)}
                            >
                                Apply Now
                            </button>
                        )}
                    </div>
                )}

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Badges
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'earned' ? styles.active : ''}`}
                        onClick={() => setActiveTab('earned')}
                    >
                        Earned ({badgeCount})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'locked' ? styles.active : ''}`}
                        onClick={() => setActiveTab('locked')}
                    >
                        Locked ({allBadgeDefinitions.length - badgeCount})
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {activeTab === 'all' && (
                        <div className={styles.badgeGrid}>
                            {allBadgeDefinitions.map(definition => {
                                const isEarned = earnedBadgeNames.includes(definition.name);
                                const badge = badges.find(b => b.badge?.name === definition.name);

                                return (
                                    <div
                                        key={definition.name}
                                        className={`${styles.badgeCard} ${isEarned ? styles.earned : styles.locked}`}
                                        onClick={() => handleBadgeClick(definition.name)}
                                    >
                                        <BadgeDisplay badge={definition} size="lg" showTooltip={false} />
                                        <div className={styles.badgeCardName}>{definition.name}</div>
                                        <div className={styles.badgeCardDescription}>{definition.description}</div>
                                        {isEarned && badge && (
                                            <div className={styles.earnedDate}>
                                                Earned {formatDateAwarded(badge.date_awarded)}
                                            </div>
                                        )}
                                        {!isEarned && definition.requiresApplication && (
                                            <button
                                                className={styles.cardApplyButton}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApply(definition.name);
                                                }}
                                            >
                                                Apply
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'earned' && (
                        <div className={styles.earnedSection}>
                            {Object.entries(categorizedBadges).map(([category, categoryBadges]) => {
                                if (categoryBadges.length === 0) return null;

                                return (
                                    <div key={category} className={styles.category}>
                                        <h3 className={styles.categoryTitle}>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </h3>
                                        <div className={styles.badgeGrid}>
                                            {categoryBadges.map(badge => {
                                                const definition = BADGE_DEFINITIONS[badge.badge?.name];
                                                return (
                                                    <div
                                                        key={badge.id}
                                                        className={`${styles.badgeCard} ${styles.earned}`}
                                                        onClick={() => handleBadgeClick(badge.badge?.name)}
                                                    >
                                                        <BadgeDisplay badge={definition} size="lg" showTooltip={false} />
                                                        <div className={styles.badgeCardName}>{definition?.name}</div>
                                                        <div className={styles.earnedDate}>
                                                            {formatDateAwarded(badge.date_awarded)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'locked' && (
                        <BadgeProgress progressData={progress} earnedBadges={badges} />
                    )}
                </div>

                {/* Badge Application Modal */}
                {showApplication && selectedBadge && (
                    <BadgeApplication
                        isOpen={showApplication}
                        onClose={() => {
                            setShowApplication(false);
                            setSelectedBadge(null);
                        }}
                        badgeName={selectedBadge.name}
                        badgeDefinition={selectedBadge}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default BadgeCenter;
