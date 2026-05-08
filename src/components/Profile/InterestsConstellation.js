import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './InterestsConstellation.module.css';

const DEFAULT_MAX_VISIBLE = 8;

const InterestsConstellation = ({ interests = [], isOwnProfile, onEditInterests }) => {
    const [expanded, setExpanded] = useState(false);
    const hasMore = interests.length > DEFAULT_MAX_VISIBLE;
    const visibleInterests = expanded ? interests : interests.slice(0, DEFAULT_MAX_VISIBLE);

    if (interests.length === 0 && !isOwnProfile) return null;

    return (
        <motion.section
            className={styles.constellation}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Interests"
        >
            <div className={styles.header}>
                <h3 className={styles.title}>
                    <span className={styles.titleIcon}>✦</span>
                    Interests
                </h3>
                {isOwnProfile && (
                    <button
                        className={styles.editBtn}
                        onClick={onEditInterests}
                        aria-label="Edit interests"
                    >
                        Edit
                    </button>
                )}
            </div>

            {interests.length === 0 && isOwnProfile ? (
                <motion.button
                    className={styles.addPrompt}
                    onClick={onEditInterests}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <span className={styles.addIcon}>+</span>
                    <span>Add your interests to express yourself</span>
                </motion.button>
            ) : (
                <>
                    <div className={styles.pills}>
                        <AnimatePresence mode="popLayout">
                            {visibleInterests.map((interest, idx) => (
                                <motion.span
                                    key={interest}
                                    className={styles.pill}
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{
                                        duration: 0.3,
                                        delay: idx * 0.04,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    whileHover={{ scale: 1.06, y: -2 }}
                                    layout
                                >
                                    {interest}
                                </motion.span>
                            ))}
                        </AnimatePresence>
                    </div>

                    {hasMore && (
                        <button
                            className={styles.toggleBtn}
                            onClick={() => setExpanded(!expanded)}
                        >
                            {expanded
                                ? 'Show less'
                                : `+${interests.length - DEFAULT_MAX_VISIBLE} more`}
                        </button>
                    )}
                </>
            )}
        </motion.section>
    );
};

export default InterestsConstellation;
