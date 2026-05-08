import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { formatNumber } from '../../utils/formatNumber';
import styles from './ProfileStats.module.css';

const AnimatedCounter = ({ value, duration = 1200 }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current || !value) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const start = performance.now();
                    const numericValue = parseInt(value) || 0;

                    const animate = (now) => {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
                        setDisplayValue(Math.round(eased * numericValue));

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        }
                    };

                    requestAnimationFrame(animate);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [value, duration]);

    return <span ref={ref}>{formatNumber(displayValue)}</span>;
};

const STAT_ITEMS = [
    { key: 'posts', label: 'Posts', icon: '📝' },
    { key: 'followers', label: 'Followers', icon: '👥' },
    { key: 'following', label: 'Following', icon: '➡️' },
];

const ProfileStats = ({
    postsCount,
    followersCount,
    followingCount,
    boltzCount,
    onFollowersClick,
    onFollowingClick,
}) => {
    const stats = [
        { key: 'posts', value: postsCount, label: 'Posts' },
        { key: 'followers', value: followersCount, label: 'Followers', onClick: onFollowersClick },
        { key: 'following', value: followingCount, label: 'Following', onClick: onFollowingClick },
    ];

    if (typeof boltzCount === 'number') {
        stats.push({ key: 'boltz', value: boltzCount, label: 'Boltz' });
    }

    return (
        <div className={styles.stats}>
            {stats.map((stat, idx) => {
                const Tag = stat.onClick ? 'button' : 'div';
                return (
                    <motion.div
                        key={stat.key}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.35,
                            delay: 0.15 + idx * 0.07,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        <Tag
                            className={styles.statCard}
                            onClick={stat.onClick || undefined}
                            aria-label={`${stat.value} ${stat.label}`}
                        >
                            <span className={styles.statValue}>
                                <AnimatedCounter value={stat.value} />
                            </span>
                            <span className={styles.statLabel}>{stat.label}</span>
                        </Tag>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default ProfileStats;
