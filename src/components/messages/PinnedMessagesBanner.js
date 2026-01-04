import React, { useState } from 'react';
import { usePinnedMessages } from '../../hooks/usePinnedMessages';
import styles from './PinnedMessagesBanner.module.css';

const PinnedMessagesBanner = ({ conversationId, groupId, onJumpToMessage, currentUserId }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAll, setShowAll] = useState(false);

    const { pinnedMessages, unpinMessage, loading } = usePinnedMessages(conversationId, groupId);

    if (pinnedMessages.length === 0) return null;

    const currentPin = pinnedMessages[currentIndex];
    const message = currentPin?.messages || currentPin?.group_messages;

    if (!message) return null;

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
    };

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev - 1 + pinnedMessages.length) % pinnedMessages.length);
    };

    const handleUnpin = async (e) => {
        e.stopPropagation();
        await unpinMessage(currentPin.id);
        if (currentIndex >= pinnedMessages.length - 1) {
            setCurrentIndex(Math.max(0, pinnedMessages.length - 2));
        }
    };

    const handleJump = () => {
        onJumpToMessage?.(message);
        setShowAll(false);
    };

    const truncateText = (text, maxLength = 50) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <>
            <div className={styles.banner} onClick={handleJump}>
                <div className={styles.iconContainer}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 2v12M6 10l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="rotate(180 10 10)" />
                    </svg>
                </div>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <span className={styles.label}>Pinned Message</span>
                        {pinnedMessages.length > 1 && (
                            <span className={styles.counter}>
                                {currentIndex + 1}/{pinnedMessages.length}
                            </span>
                        )}
                    </div>
                    <div className={styles.messageText}>
                        {message.is_deleted ? (
                            <span className={styles.deleted}>This message was deleted</span>
                        ) : message.message_type === 'image' ? (
                            <span className={styles.media}>📷 Photo</span>
                        ) : message.message_type === 'video' ? (
                            <span className={styles.media}>🎥 Video</span>
                        ) : message.message_type === 'audio' ? (
                            <span className={styles.media}>🎵 Audio</span>
                        ) : (
                            truncateText(message.content)
                        )}
                    </div>
                </div>

                <div className={styles.actions}>
                    {pinnedMessages.length > 1 && (
                        <div className={styles.navigation}>
                            <button
                                className={styles.navButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePrevious();
                                }}
                                aria-label="Previous pinned message"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                            <button
                                className={styles.navButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNext();
                                }}
                                aria-label="Next pinned message"
                            >
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    )}

                    <button
                        className={styles.unpinButton}
                        onClick={handleUnpin}
                        disabled={loading}
                        aria-label="Unpin message"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
            </div>

            {showAll && (
                <div className={styles.allPinsModal} onClick={() => setShowAll(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Pinned Messages ({pinnedMessages.length})</h3>
                            <button onClick={() => setShowAll(false)}>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>
                        <div className={styles.pinsList}>
                            {pinnedMessages.map((pin, index) => {
                                const msg = pin.messages || pin.group_messages;
                                return (
                                    <div
                                        key={pin.id}
                                        className={styles.pinItem}
                                        onClick={() => {
                                            setCurrentIndex(index);
                                            setShowAll(false);
                                            onJumpToMessage?.(msg);
                                        }}
                                    >
                                        <div className={styles.pinContent}>
                                            {msg.content || 'Media message'}
                                        </div>
                                        <button
                                            className={styles.pinUnpin}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                unpinMessage(pin.id);
                                            }}
                                        >
                                            Unpin
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PinnedMessagesBanner;
