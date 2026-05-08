import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './AchievementsOrbit.module.css';

const FALLBACK_BADGES = [
    { id: 'early-adopter', name: 'Early Adopter', icon: '🌟', description: 'Joined during launch', earned: true },
    { id: 'first-post', name: 'First Post', icon: '📝', description: 'Created first post', earned: true },
    { id: 'trust-shield', name: 'Trust Shield', icon: '🛡️', description: 'Achieved Trust Level 4', earned: false },
    { id: 'community-star', name: 'Community Star', icon: '⭐', description: '100+ followers', earned: false },
    { id: 'content-creator', name: 'Content Creator', icon: '🎬', description: '50+ posts', earned: false },
    { id: 'viral-moment', name: 'Viral Moment', icon: '🔥', description: 'Post reached 1K views', earned: false },
    { id: 'boltz-master', name: 'Boltz Master', icon: '⚡', description: '25+ Boltz created', earned: false },
    { id: 'flash-artist', name: 'Flash Artist', icon: '✨', description: '100+ Flash stories', earned: false },
];

const AchievementsOrbit = ({ badges = [], isOwnProfile }) => {
    const scrollRef = useRef(null);
    const displayBadges = badges.length > 0 ? badges : FALLBACK_BADGES;
    const earnedCount = displayBadges.filter(b => b.earned).length;

    return (
        <motion.section
            className={styles.orbit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Achievements"
        >
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <span className={styles.titleIcon}>🏆</span>
                    Achievements
                </h3>
                <span className={styles.counter}>
                    {earnedCount}/{displayBadges.length}
                </span>
            </div>

            <div className={styles.carousel} ref={scrollRef}>
                {displayBadges.map((badge, idx) => (
                    <motion.div
                        key={badge.id}
                        className={`${styles.badgeCard} ${badge.earned ? styles.earned : styles.locked}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                            duration: 0.35,
                            delay: 0.45 + idx * 0.06,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        whileHover={badge.earned ? { y: -4, scale: 1.04 } : {}}
                    >
                        <div className={styles.badgeIconWrap}>
                            <span className={styles.badgeIcon}>{badge.icon}</span>
                            {badge.earned && <div className={styles.badgeGlow} />}
                        </div>
                        <span className={styles.badgeName}>{badge.name}</span>
                        <span className={styles.badgeDesc}>
                            {badge.earned ? badge.description : '🔒 Locked'}
                        </span>
                        {badge.earned_at && (
                            <span className={styles.badgeDate}>
                                {new Date(badge.earned_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
};

export default AchievementsOrbit;
