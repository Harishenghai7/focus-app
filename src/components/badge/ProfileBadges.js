import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BadgeDisplay from './BadgeDisplay';
import { BADGE_DEFINITIONS } from '../../utils/badgeRules';
import styles from './ProfileBadges.module.css';

/**
 * ProfileBadges Component
 * Badge display on user profiles (primary badge + expandable list)
 */
const ProfileBadges = ({ badges, maxVisible = 3 }) => {
    const [expanded, setExpanded] = useState(false);

    if (!badges || badges.length === 0) return null;

    // Format badges with definitions
    const formattedBadges = badges.map(badge => ({
        ...badge,
        ...BADGE_DEFINITIONS[badge.badge?.name]
    }));

    const visibleBadges = expanded ? formattedBadges : formattedBadges.slice(0, maxVisible);
    const remainingCount = formattedBadges.length - maxVisible;

    return (
        <div className={styles.profileBadges}>
            <div className={styles.badgeList}>
                {visibleBadges.map((badge, index) => (
                    <BadgeDisplay
                        key={badge.id || index}
                        badge={badge}
                        size="sm"
                        showTooltip={true}
                    />
                ))}

                {!expanded && remainingCount > 0 && (
                    <button
                        className={styles.moreButton}
                        onClick={() => setExpanded(true)}
                    >
                        +{remainingCount}
                    </button>
                )}

                {expanded && formattedBadges.length > maxVisible && (
                    <button
                        className={styles.lessButton}
                        onClick={() => setExpanded(false)}
                    >
                        Show less
                    </button>
                )}
            </div>
        </div>
    );
};

ProfileBadges.propTypes = {
    badges: PropTypes.arrayOf(PropTypes.object).isRequired,
    maxVisible: PropTypes.number
};

export default ProfileBadges;
