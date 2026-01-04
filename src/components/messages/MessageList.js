import React, { useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';
import DateDivider from './DateDivider';
import TypingIndicator from './TypingIndicator';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import { useMessageStatus } from '../../hooks/useMessageStatus';
import { useTypingUserDetails } from '../../hooks/useTypingIndicator';
import styles from './MessageList.module.css';

const MessageList = ({
    messages,
    currentUserId,
    conversationId,
    loading,
    isTyping,
    typingUsers = [],
    typingUsername,
    onReply,
    onReact,
    onDelete,
    onEdit,
    onStar,
    onForward,
    onMediaClick
}) => {
    const messagesEndRef = useRef(null);
    const listRef = useRef(null);

    // Auto-mark messages as read
    const { markAllAsRead } = useMessageStatus(conversationId, currentUserId);

    // Get typing user details
    const typingUserDetails = useTypingUserDetails(typingUsers);

    const validMessages = messages.filter(msg => {
        // Handle both 'type' (DB) and 'message_type' (frontend prop sometimes)
        const type = msg.type || msg.message_type || 'text';

        if (type === 'text') {
            // Ensure content is a string before trimming
            return typeof msg.content === 'string' && msg.content.trim().length > 0;
        }
        return true;
    });

    useEffect(() => {
        scrollToBottom();
    }, [validMessages]);

    // Auto-mark messages as read when viewing
    useEffect(() => {
        if (validMessages.length > 0 && !loading && conversationId) {
            markAllAsRead();
        }
    }, [validMessages.length, loading, conversationId, markAllAsRead]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const shouldShowDateDivider = (currentMsg, prevMsg) => {
        if (!prevMsg) return true;

        const currentDate = new Date(currentMsg.created_at).toDateString();
        const prevDate = new Date(prevMsg.created_at).toDateString();

        return currentDate !== prevDate;
    };

    if (loading) {
        return (
            <div className={styles.messageList}>
                <div className={styles.loadingContainer}>
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className={`${styles.messageSkeleton} ${i % 2 === 0 ? styles.own : styles.other}`}>
                            {i % 2 !== 0 && <LoadingSkeleton width={40} height={40} circle />}
                            <div className={styles.skeletonBubble}>
                                <LoadingSkeleton width="100%" height={60} />
                            </div>
                            {i % 2 === 0 && <LoadingSkeleton width={40} height={40} circle />}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (validMessages.length === 0) {
        return (
            <div className={styles.messageList}>
                <div className={styles.emptyState}>
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                        <path d="M10 66.45V16.67A6.67 6.67 0 0 1 16.67 10h46.66A6.67 6.67 0 0 1 70 16.67v33.33a6.67 6.67 0 0 1-6.67 6.67H26.54a6.67 6.67 0 0 0-5.2 2.5l-7.78 9.71A2 2 0 0 1 10 66.45z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        <circle cx="30" cy="33" r="3" fill="currentColor" />
                        <circle cx="40" cy="33" r="3" fill="currentColor" />
                        <circle cx="50" cy="33" r="3" fill="currentColor" />
                    </svg>
                    <h3 className={styles.emptyTitle}>No messages yet</h3>
                    <p className={styles.emptyText}>Send a message to start the conversation</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.messageList} ref={listRef}>
            <div className={styles.messagesContainer}>
                {validMessages.map((message, index) => (
                    <React.Fragment key={message.id}>
                        {shouldShowDateDivider(message, validMessages[index - 1]) && (
                            <DateDivider date={message.created_at} />
                        )}
                        <MessageBubble
                            message={message}
                            isOwn={message.sender_id === currentUserId}
                            onReply={onReply}
                            onReact={onReact}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onStar={onStar}
                            onForward={onForward}
                            onMediaClick={onMediaClick}
                        />
                    </React.Fragment>
                ))}

                {isTyping && (
                    <TypingIndicator
                        users={typingUserDetails}
                        username={typingUsername}
                    />
                )}

                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};

export default MessageList;
