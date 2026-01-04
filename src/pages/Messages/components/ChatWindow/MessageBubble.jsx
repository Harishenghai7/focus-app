// ═══════════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE COMPONENT - All message types with delivery states
// ═══════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import styles from './MessageBubble.module.css';

const MessageBubble = ({
    message,
    isSent,
    currentUserId,
    onReply,
    onDelete,
    onUnsend,
    onJumpToMessage,
    showAvatar = true
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    // Check if message can be unsent (within 15 minutes)
    const canUnsend = () => {
        if (!isSent) return false;
        const messageTime = new Date(message.created_at);
        const now = new Date();
        const diffMinutes = (now - messageTime) / 1000 / 60;
        return diffMinutes <= 15;
    };

    // Render delivery status icons
    const renderDeliveryStatus = () => {
        if (!isSent) return null;

        const { status } = message;

        if (status === 'seen') {
            return (
                <div className={`${styles.statusIcon} ${styles.seen}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12l5 5L23 1M8 12l5 5L30 1" />
                    </svg>
                </div>
            );
        } else if (status === 'delivered') {
            return (
                <div className={`${styles.statusIcon} ${styles.delivered}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12l5 5L23 1M8 12l5 5L30 1" />
                    </svg>
                </div>
            );
        } else if (status === 'sent') {
            return (
                <div className={`${styles.statusIcon} ${styles.delivered}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12l5 5L20 7" />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className={`${styles.statusIcon} ${styles.pending}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                </div>
            );
        }
    };

    // Render message content based on type
    const renderContent = () => {
        if (message.deleted_for_everyone) {
            return (
                <div className={styles.deletedMessage}>
                    {isSent ? 'You unsent this message' : 'This message was unsent'}
                </div>
            );
        }

        switch (message.type) {
            case 'text':
                return <div className={styles.textContent}>{message.content}</div>;

            case 'image':
                return (
                    <div className={styles.mediaContent}>
                        {message.attachments?.[0] && (
                            <img
                                src={message.attachments[0].url}
                                alt="Shared image"
                                loading="lazy"
                            />
                        )}
                        {message.content && (
                            <div className={styles.textContent} style={{ marginTop: '8px' }}>
                                {message.content}
                            </div>
                        )}
                    </div>
                );

            case 'video':
                return (
                    <div className={styles.mediaContent}>
                        {message.attachments?.[0] && (
                            <video
                                src={message.attachments[0].url}
                                poster={message.attachments[0].thumbnail_url}
                                controls
                            />
                        )}
                        {message.content && (
                            <div className={styles.textContent} style={{ marginTop: '8px' }}>
                                {message.content}
                            </div>
                        )}
                    </div>
                );

            case 'voice':
                return (
                    <div className={styles.voiceMessage}>
                        <button
                            className={styles.playButton}
                            onClick={() => setIsPlaying(!isPlaying)}
                        >
                            {isPlaying ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" />
                                    <rect x="14" y="4" width="4" height="16" />
                                </svg>
                            ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            )}
                        </button>
                        <div className={styles.waveform}>
                            {[...Array(20)].map((_, i) => (
                                <div
                                    key={i}
                                    className={`${styles.waveBar} ${isPlaying && i < 10 ? styles.active : ''}`}
                                    style={{ height: `${Math.random() * 100}%` }}
                                />
                            ))}
                        </div>
                        <div className={styles.duration}>
                            {message.attachments?.[0]?.duration || 0}s
                        </div>
                    </div>
                );

            case 'gif':
            case 'sticker':
                return (
                    <div className={message.type === 'gif' ? styles.gifContent : styles.stickerContent}>
                        {message.attachments?.[0] && (
                            <img src={message.attachments[0].url} alt={message.type} />
                        )}
                    </div>
                );

            case 'shared_post':
            case 'shared_flash':
            case 'shared_boltz':
                const contentType = message.type.replace('shared_', '');
                return (
                    <div className={styles.sharedContent}>
                        <div className={styles.sharedThumbnail}>
                            <img src="/placeholder-content.jpg" alt="Shared content" />
                        </div>
                        <div className={styles.sharedInfo}>
                            <div className={styles.sharedType}>{contentType}</div>
                            <div className={styles.sharedTitle}>Shared Content</div>
                            <div className={styles.sharedAuthor}>@username</div>
                        </div>
                        {message.content && (
                            <div className={styles.textContent} style={{ marginTop: '8px' }}>
                                {message.content}
                            </div>
                        )}
                    </div>
                );

            default:
                return <div className={styles.textContent}>{message.content}</div>;
        }
    };

    return (
        <div className={`${styles.messageBubble} ${isSent ? styles.sent : styles.received}`}>
            {showAvatar && !isSent && (
                <div className={styles.avatar}>
                    {message.sender?.avatar_url ? (
                        <img src={message.sender.avatar_url} alt={message.sender.username} />
                    ) : (
                        message.sender?.username?.[0]?.toUpperCase() || '?'
                    )}
                </div>
            )}

            <div className={styles.bubbleContainer}>
                {message.reply_to && (
                    <div
                        className={styles.replyPreview}
                        onClick={() => onJumpToMessage?.(message.reply_to_message_id)}
                    >
                        <div className={styles.replyAuthor}>
                            {message.reply_to.sender_id === currentUserId ? 'You' : 'Them'}
                        </div>
                        <div className={styles.replyContent}>
                            {message.reply_to.content || `[${message.reply_to.type}]`}
                        </div>
                    </div>
                )}

                <div
                    className={styles.bubble}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setShowMenu(true);
                    }}
                    onClick={() => setShowMenu(false)}
                >
                    {renderContent()}

                    {showMenu && (
                        <div className={styles.contextMenu}>
                            <div className={styles.menuItem} onClick={() => onReply?.(message)}>
                                <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
                                </svg>
                                Reply
                            </div>
                            {isSent && canUnsend() && (
                                <div className={`${styles.menuItem} ${styles.danger}`} onClick={() => onUnsend?.(message.id)}>
                                    <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                    Unsend
                                </div>
                            )}
                            <div className={`${styles.menuItem} ${styles.danger}`} onClick={() => onDelete?.(message.id)}>
                                <svg className={styles.menuIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Delete for me
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.metadata}>
                    <span className={styles.timestamp}>
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                    {renderDeliveryStatus()}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
