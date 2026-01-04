import React from 'react';
import PropTypes from 'prop-types';
import BadgeDisplay from './BadgeDisplay';
import { BADGE_DEFINITIONS } from '../../utils/badgeRules';
import styles from './BadgeProgress.module.css';

/**
 * BadgeProgress Component
 * Progress tracker showing locked, in-progress, and earned badges
 */
const BadgeProgress = ({ progressData, earnedBadges = [] }) => {
    const earnedBadgeNames = earnedBadges.map(b => b.badge?.name);

    return (
        <div className={styles.badgeProgress}>
            <h3 className={styles.title}>Badge Progress</h3>

            <div className={styles.progressList}>
                {progressData.map((item, index) => {
                    const isEarned = earnedBadgeNames.includes(item.badgeType);
                    const definition = BADGE_DEFINITIONS[item.badgeType];

                    return (
                        <div
                            key={item.badgeType || index}
                            className={`${styles.progressItem} ${isEarned ? styles.earned : ''}`}
                        >
                            <div className={styles.badgeIcon}>
                                <BadgeDisplay
                                    badge={definition}
                                    size="md"
                                    showTooltip={false}
                                />
                            </div>

                            <div className={styles.progressInfo}>
                                <div className={styles.badgeName}>{item.name}</div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{
                                            width: `${item.progressPercent}%`,
                                            background: definition?.gradient || definition?.color
                                        }}
                                    />
                                </div>
                                <div className={styles.progressText}>
                                    {item.progressPercent}% complete
                                </div>
                            </div>

                            {item.requiresApplication && item.progressPercent === 100 && (
                                <div className={styles.applyBadge}>
                                    Apply
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

BadgeProgress.propTypes = {
    progressData: PropTypes.arrayOf(PropTypes.object).isRequired,
    earnedBadges: PropTypes.arrayOf(PropTypes.object)
};

export default BadgeProgress;
