import React from 'react';
import { motion } from 'framer-motion';
import styles from './FocuslyTypingIndicator.module.css';

/**
 * Typing Indicator Component
 * Shows animated dots when Focusly is thinking
 */
const FocuslyTypingIndicator = ({ show = true }) => {
    if (!show) return null;

    return (
        <motion.div
            className={styles.typingWrapper}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
        >
            {/* Avatar */}
            <div className={styles.avatar}>
                <img
                    src={require('../../assets/focusly/stickers/07_focusly_thinking.png')}
                    alt="Focusly thinking"
                />
            </div>

            {/* Typing Bubble */}
            <div className={styles.typingBubble}>
                <div className={styles.dotsContainer}>
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            className={styles.dot}
                            animate={{
                                y: [0, -8, 0],
                                opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: index * 0.15,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
};

export default FocuslyTypingIndicator;
