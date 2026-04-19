import React from 'react';
import { motion } from 'framer-motion';
import styles from './FocuslyMessage.module.css';

/**
 * Individual Message Bubble Component
 * Displays a single message with smooth animations
 */
const FocuslyMessage = ({
    message,
    sender = 'focusly', // 'user' or 'focusly'
    timestamp,
    isStreaming = false,
    showAvatar = true
}) => {
    const isFocusly = sender === 'focusly';

    // Format timestamp
    const formatTime = (time) => {
        if (!time) return '';
        const date = new Date(time);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    return (
        <motion.div
            className={`${styles.messageWrapper} ${isFocusly ? styles.focuslyMessage : styles.userMessage}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.3,
                ease: "easeOut"
            }}
        >
            {/* Avatar (only for Focusly) */}
            {showAvatar && isFocusly && (
                <div className={styles.messageAvatar}>
                    <img
                        src={require('../../assets/focusly/stickers/01_focusly_happy.png')}
                        alt="Focusly"
                        className={styles.avatarImage}
                    />
                </div>
            )}

            {/* Message Content */}
            <div className={styles.messageContent}>
                <div className={`${styles.messageBubble} ${isStreaming ? styles.streaming : ''}`}>
                    {message}

                    {/* Streaming cursor */}
                    {isStreaming && (
                        <motion.span
                            className={styles.cursor}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            ▊
                        </motion.span>
                    )}
                </div>

                {/* Timestamp */}
                {timestamp && !isStreaming && (
                    <div className={styles.timestamp}>
                        {formatTime(timestamp)}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default FocuslyMessage;
