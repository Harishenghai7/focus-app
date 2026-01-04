// ═══════════════════════════════════════════════════════════════════════
// ENHANCED MESSAGE BUBBLE - Reactions, Delete, Reply, Share, All Features
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useMessageReactions } from '../../hooks/useMessageReactions';
import styles from './MessageBubble.module.css';

const EnhancedMessageBubble = ({
    message,
    currentUserId,
    onReply,
    onDelete,
    onForward,
    showAvatar = true
}) => {
    const [showActions, setShowActions] = useState(false);
    const [showReactionPicker, setShowReactionPicker] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const actionsRef = useRef(null);

    const {
        groupedReactions,
        userReaction,
        addReaction,
        availableEmojis
    } = useMessageReactions(message.id, currentUserId);

    const isOwn = message.sender_id === currentUserId;
    const isDeleted = message.deleted_for_everyone;

    // Close actions menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionsRef.current && !actionsRef.current.contains(event.target)) {
                setShowActions(false);
                setShowReactionPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle long press for mobile
    const longPressTimer = useRef(null);
    const handleTouchStart = () => {
        longPressTimer.current = setTimeout(() => {
            setShowReactionPicker(true);
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
        }
    };

    // Render message content based on type
    const renderContent = () => {
        if (isDeleted) {
            return (
                <div className={styles.deletedMessage}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Message was deleted</span>
                </div>
            );
        }

        switch (message.type) {
            case 'text':
                return <div className={styles.messageText}>{message.content}</div>;

            case 'image':
                const imageAttachment = message.attachments?.[0];
                return (
                    <div className={styles.imageMessage}>
                        <img
                            src={imageAttachment?.url}
                            alt="Shared image"
                            className={styles.messageImage}
                            loading="lazy"
                        />
                        {message.content && (
                            <div className={styles.imageCaption}>{message.content}</div>
                        )}
                    </div>
                );

            case 'video':
                const videoAttachment = message.attachments?.[0];
                return (
                    <div className={styles.videoMessage}>
                        <video
                            src={videoAttachment?.url}
                            poster={videoAttachment?.thumbnail_url}
                            controls
                            className={styles.messageVideo}
                        />
                        {message.content && (
                            <div className={styles.videoCaption}>{message.content}</div>
                        )}
                    </div>
                );

            case 'gif':
                return (
                    <div className={styles.gifMessage}>
                        <img
                            src={message.metadata?.url}
                            alt={message.content || 'GIF'}
                            className={styles.messageGif}
                            loading="lazy"
                        />
                    </div>
                );

            case 'sticker':
                return (
                    <div className={styles.stickerMessage}>
                        <img
                            src={message.metadata?.url}
                            alt={message.content || 'Sticker'}
                            className={styles.messageSticker}
                        />
                    </div>
                );

            case 'voice':
                const voiceAttachment = message.attachments?.[0];
                return (
                    <div className={styles.voiceMessage}>
                        <audio src={voiceAttachment?.url} controls className={styles.messageAudio} />
                        <span className={styles.voiceDuration}>
                            {formatDuration(voiceAttachment?.duration)}
                        </span>
                    </div>
                );

            case 'shared_post':
            case 'shared_flash':
            case 'shared_boltz':
                return (
                    <div className={styles.sharedContent}>
                        <div className={styles.sharedHeader}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                            <span>Shared {message.type.replace('shared_', '')}</span>
                        </div>
                        <div className={styles.sharedPreview}>
                            {message.metadata?.thumbnail && (
                                <img src={message.metadata.thumbnail} alt="Preview" />
                            )}
                            <div className={styles.sharedInfo}>
                                <div className={styles.sharedTitle}>{message.metadata?.title}</div>
                                <div className={styles.sharedAuthor}>@{message.metadata?.author}</div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div className={styles.messageText}>{message.content || '[Unsupported message type]'}</div>;
        }
    };

    // Format duration (seconds to mm:ss)
    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle delete with modal
    const handleDeleteClick = () => {
        setShowDeleteModal(true);
        setShowActions(false);
    };

    const handleDeleteConfirm = (deleteForEveryone) => {
        onDelete(message.id, deleteForEveryone);
        setShowDeleteModal(false);
    };

    // Check if can delete for everyone (within 5 minutes)
    const canDeleteForEveryone = () => {
        const messageTime = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - messageTime) / 1000 / 60;
        return diffMinutes <= 5;
    };

    return (
        <div
            className={`${styles.messageBubble} ${isOwn ? styles.own : styles.other}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Avatar (for other user's messages) */}
            {!isOwn && showAvatar && (
                <div className={styles.avatar}>
                    <img
                        src={message.sender?.avatar_url || '/default-avatar.png'}
                        alt={message.sender?.username}
                    />
                </div>
            )}

            <div className={styles.bubbleContent}>
                {/* Reply Preview */}
                {message.reply_to && (
                    <div className={styles.replyPreview}>
                        <div className={styles.replyBar}></div>
                        <div className={styles.replyContent}>
                            <div className={styles.replyAuthor}>
                                {message.reply_to.sender?.username}
                            </div>
                            <div className={styles.replyText}>
                                {message.reply_to.content || `[${message.reply_to.type}]`}
                            </div>
                        </div>
                    </div>
                )}

                {/* Message Content */}
                <div className={styles.messageContent}>
                    {renderContent()}

                    {/* Message Status (for own messages) */}
                    {isOwn && !isDeleted && (
                        <div className={styles.messageStatus}>
                            {message.status === 'sent' && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                            {message.status === 'delivered' && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                    <polyline points="20 6 9 17 4 12" transform="translate(3, 0)" />
                                </svg>
                            )}
                            {message.status === 'seen' && (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12" />
                                    <polyline points="20 6 9 17 4 12" transform="translate(3, 0)" />
                                </svg>
                            )}
                        </div>
                    )}

                    {/* Timestamp */}
                    <div className={styles.timestamp}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </div>
                </div>

                {/* Reactions */}
                {groupedReactions.length > 0 && (
                    <div className={styles.reactions}>
                        {groupedReactions.map(reaction => (
                            <div
                                key={reaction.emoji}
                                className={`${styles.reactionBadge} ${userReaction === reaction.emoji ? styles.userReacted : ''
                                    }`}
                                onClick={() => addReaction(reaction.emoji)}
                            >
                                <span className={styles.reactionEmoji}>{reaction.emoji}</span>
                                <span className={styles.reactionCount}>{reaction.count}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions Menu Button */}
                {!isDeleted && (
                    <button
                        className={styles.actionsButton}
                        onClick={() => setShowActions(!showActions)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="12" cy="5" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="12" cy="19" r="2" />
                        </svg>
                    </button>
                )}

                {/* Actions Menu */}
                {showActions && (
                    <div ref={actionsRef} className={`${styles.actionsMenu} ${isOwn ? styles.ownActions : ''}`}>
                        <button onClick={() => {
                            setShowReactionPicker(true);
                            setShowActions(false);
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                                <line x1="9" y1="9" x2="9.01" y2="9" />
                                <line x1="15" y1="9" x2="15.01" y2="9" />
                            </svg>
                            React
                        </button>
                        <button onClick={() => {
                            onReply(message);
                            setShowActions(false);
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 14 4 9 9 4" />
                                <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                            </svg>
                            Reply
                        </button>
                        <button onClick={() => {
                            onForward(message);
                            setShowActions(false);
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15 10 20 15 15 20" />
                                <path d="M4 4v7a4 4 0 0 0 4 4h12" />
                            </svg>
                            Forward
                        </button>
                        {isOwn && (
                            <button onClick={handleDeleteClick} className={styles.deleteAction}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete
                            </button>
                        )}
                    </div>
                )}

                {/* Reaction Picker */}
                {showReactionPicker && (
                    <div className={styles.reactionPicker}>
                        {availableEmojis.map(emoji => (
                            <button
                                key={emoji}
                                className={`${styles.reactionOption} ${userReaction === emoji ? styles.selected : ''}`}
                                onClick={() => {
                                    addReaction(emoji);
                                    setShowReactionPicker(false);
                                }}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className={styles.deleteModal}>
                        <div className={styles.deleteModalContent}>
                            <h3>Delete Message?</h3>
                            <div className={styles.deleteOptions}>
                                <button
                                    className={styles.deleteOption}
                                    onClick={() => handleDeleteConfirm(false)}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 3h18v18H3zM15 9l-6 6m0-6l6 6" />
                                    </svg>
                                    <div>
                                        <div className={styles.optionTitle}>Delete for me</div>
                                        <div className={styles.optionDesc}>Message removed from your view only</div>
                                    </div>
                                </button>
                                {canDeleteForEveryone() && (
                                    <button
                                        className={styles.deleteOption}
                                        onClick={() => handleDeleteConfirm(true)}
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                        <div>
                                            <div className={styles.optionTitle}>Delete for everyone</div>
                                            <div className={styles.optionDesc}>Message removed for both users</div>
                                        </div>
                                    </button>
                                )}
                            </div>
                            <button
                                className={styles.cancelDelete}
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EnhancedMessageBubble;
