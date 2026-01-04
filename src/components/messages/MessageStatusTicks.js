import React from 'react';
import styles from './MessageStatusTicks.module.css';

/**
 * Message Status Ticks Component
 * Shows WhatsApp/Instagram-style message delivery status:
 * - Single gray tick: Sent
 * - Double gray ticks: Delivered
 * - Double blue ticks: Read
 */
const MessageStatusTicks = ({
    isSent = true,
    isDelivered = false,
    isRead = false,
    size = 'sm' // 'sm' | 'md'
}) => {
    // Don't show ticks if message isn't sent yet
    if (!isSent) return null;

    const tickClass = isRead
        ? styles.read
        : isDelivered
            ? styles.delivered
            : styles.sent;

    const sizeClass = size === 'md' ? styles.md : styles.sm;

    return (
        <div className={`${styles.ticks} ${tickClass} ${sizeClass}`}>
            {isDelivered || isRead ? (
                // Double ticks (delivered or read)
                <>
                    <svg
                        viewBox="0 0 16 15"
                        className={`${styles.tick} ${styles.tick1}`}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z"
                            fill="currentColor"
                        />
                    </svg>
                    <svg
                        viewBox="0 0 16 15"
                        className={`${styles.tick} ${styles.tick2}`}
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z"
                            fill="currentColor"
                        />
                    </svg>
                </>
            ) : (
                // Single tick (sent only)
                <svg
                    viewBox="0 0 16 15"
                    className={styles.tick}
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512z"
                        fill="currentColor"
                    />
                </svg>
            )}
        </div>
    );
};

export default MessageStatusTicks;
