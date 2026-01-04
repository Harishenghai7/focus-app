import React, { useState, useRef, useEffect } from 'react';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import MessageStatusTicks from './MessageStatusTicks';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import PollDisplay from './PollDisplay';
import EventDisplay from './EventDisplay';
import { useAuth } from '../../hooks/useAuth';
import styles from './MessageBubble.module.css';

const MessageBubble = ({
    message,
    isOwn,
    showAvatar = false,
    onMediaClick
}) => {
    const { user } = useAuth();

    // Helper to handle double-serialized JSON messages
    const getDisplayContent = (content) => {
        if (!content) return '';
        try {
            if (typeof content === 'string' && content.trim().startsWith('{') && content.includes('"content":')) {
                const parsed = JSON.parse(content);
                return parsed.content || content;
            }
        } catch (e) {
            // Not JSON or invalid, return as is
        }
        return content;
    };

    const renderContent = () => {
        const type = message.type || message.message_type || 'text';
        const displayContent = getDisplayContent(message.content);

        // Show deleted placeholder if message is deleted
        if (message.is_deleted) {
            return (
                <div className={styles.deletedMessage}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2 4h12M5.5 4V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1m1.5 0v9a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1V4h9z"
                            stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span>This message was deleted</span>
                </div>
            );
        }

        if (type === 'image') {
            return (
                <div className={styles.mediaContainer} onClick={() => onMediaClick?.(message)}>
                    <img src={message.attachments?.[0]?.url} alt="Shared image" className={styles.image} />
                    {displayContent && <p className={styles.caption}>{displayContent}</p>}
                </div>
            );
        }

        if (type === 'video') {
            return (
                <div className={styles.mediaContainer} onClick={() => onMediaClick?.(message)}>
                    <video src={message.attachments?.[0]?.url} controls className={styles.video} />
                    {displayContent && <p className={styles.caption}>{displayContent}</p>}
                </div>
            );
        }

        if (type === 'audio') {
            return (
                <VoiceMessagePlayer
                    audioUrl={message.attachments?.[0]?.url}
                    duration={message.attachments?.[0]?.duration}
                    isOwn={isOwn}
                />
            );
        }

        if (type === 'poll') {
            return <PollDisplay message={message} />;
        }

        if (type === 'event') {
            return <EventDisplay message={message} />;
        }

        if (type === 'file') {
            return (
                <a href={message.attachments?.[0]?.url} download className={styles.fileLink}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M6 2h8l4 4v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <span>{message.attachments?.[0]?.name || 'File'}</span>
                </a>
            );
        }

        if (type === 'sticker') {
            return (
                <div className={styles.stickerContainer}>
                    <img src={message.content} alt="Sticker" className={styles.sticker} />
                </div>
            );
        }

        if (type === 'gif') {
            return (
                <div className={styles.gifContainer}>
                    <img src={message.content} alt="GIF" className={styles.gif} />
                </div>
            );
        }

        return <p className={styles.text}>{displayContent}</p>;
    };

    return (
        <div className={`${styles.messageWrapper} ${isOwn ? styles.own : styles.other}`}>
            <div className={styles.messageBubble}>
                {message.forwarded_from && (
                    <div className={styles.forwardedLabel}>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 2v8M10 7l-3 3-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Forwarded</span>
                    </div>
                )}

                {renderContent()}

                <div className={styles.messageFooter}>
                    <span className={styles.timestamp}>
                        {formatTimeAgo(message.created_at)}
                        {message.is_edited && <span className={styles.edited}> (edited)</span>}
                    </span>
                    {isOwn && !message._optimistic && !message._failed && (
                        <MessageStatusTicks
                            isSent={true}
                            isDelivered={message.is_delivered || message.is_read}
                            isRead={message.is_read}
                            size="sm"
                        />
                    )}
                    {message._optimistic && <span className={styles.sending}>Sending...</span>}
                    {message._failed && <span className={styles.failed}>Failed</span>}
                </div>
            </div>
        </div>
    );
};

export default MessageBubble;
