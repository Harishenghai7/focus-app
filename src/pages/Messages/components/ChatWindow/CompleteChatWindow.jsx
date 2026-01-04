// ═══════════════════════════════════════════════════════════════════════
// COMPLETE CHAT WINDOW - All 13 Features Integrated
// ═══════════════════════════════════════════════════════════════════════
// This is a REFERENCE IMPLEMENTATION showing how to integrate all features.
// Use this as a guide to update your existing ChatPane/ChatWindow component.
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useRealtimeMessages } from '../../hooks/useRealtimeMessages';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { usePresence } from '../../hooks/usePresence';
import EnhancedMessageInput from './EnhancedMessageInput';
import EnhancedMessageBubble from './EnhancedMessageBubble';
import { formatDistanceToNow } from 'date-fns';
import styles from './CompleteChatWindow.module.css';

const CompleteChatWindow = ({
    conversationId,
    currentUserId,
    otherUserId,
    otherUserData,
    onBack,
    onCall, // Audio call handler
    onVideoCall // Video call handler
}) => {
    const [replyTo, setReplyTo] = useState(null);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Real-time messages
    const {
        messages,
        loading,
        sending,
        hasMore,
        sendMessage,
        markAsSeen,
        deleteMessage,
        loadMore
    } = useRealtimeMessages(conversationId, currentUserId);

    // Typing indicator
    const {
        typingUsers,
        setTyping
    } = useTypingIndicator(conversationId, currentUserId);

    // Online presence
    const {
        isOnline,
        lastSeen
    } = usePresence(otherUserId);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];

            // Scroll if it's our message or if we're near bottom
            if (lastMessage.sender_id === currentUserId || isNearBottom()) {
                scrollToBottom();
            }

            // Mark as seen if not our message
            if (lastMessage.sender_id !== currentUserId) {
                markAsSeen(lastMessage.id);
            }
        }
    }, [messages, currentUserId, markAsSeen]);

    // Scroll to bottom
    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({
            behavior: smooth ? 'smooth' : 'auto'
        });
    };

    // Check if near bottom
    const isNearBottom = () => {
        if (!messagesContainerRef.current) return true;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        return scrollHeight - scrollTop - clientHeight < 100;
    };

    // Handle scroll for "scroll to bottom" button
    const handleScroll = () => {
        setShowScrollButton(!isNearBottom());

        // Load more messages when scrolling to top
        if (messagesContainerRef.current?.scrollTop === 0 && hasMore) {
            loadMore();
        }
    };

    // Handle typing change
    const handleTypingChange = (isTyping) => {
        setTyping(isTyping);
    };

    // Handle reply
    const handleReply = (message) => {
        setReplyTo(message);
    };

    // Handle delete
    const handleDelete = async (messageId, deleteForEveryone) => {
        try {
            await deleteMessage(messageId, deleteForEveryone);
        } catch (error) {
            alert('Failed to delete message: ' + error.message);
        }
    };

    // Handle forward
    const handleForward = (message) => {
        setForwardMessage(message);
        // TODO: Open forward modal
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        const groups = [];
        let currentDate = null;

        messages.forEach(message => {
            const messageDate = new Date(message.created_at).toDateString();

            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({
                    type: 'date',
                    date: messageDate,
                    label: formatDateLabel(new Date(message.created_at))
                });
            }

            groups.push({
                type: 'message',
                data: message
            });
        });

        return groups;
    };

    // Format date label
    const formatDateLabel = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    };

    const groupedMessages = groupMessagesByDate(messages);

    return (
        <div className={styles.chatWindow}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={onBack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className={styles.userInfo} onClick={() => {/* Navigate to profile */ }}>
                    <div className={styles.avatarContainer}>
                        <img
                            src={otherUserData?.avatar_url || '/default-avatar.png'}
                            alt={otherUserData?.username}
                            className={styles.avatar}
                        />
                        {isOnline && <div className={styles.onlineIndicator}></div>}
                    </div>
                    <div className={styles.userDetails}>
                        <div className={styles.username}>{otherUserData?.username}</div>
                        <div className={styles.status}>
                            {isOnline ? (
                                'Online'
                            ) : lastSeen ? (
                                `Last seen ${formatDistanceToNow(new Date(lastSeen), { addSuffix: true })}`
                            ) : (
                                'Offline'
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.headerActions}>
                    {/* Audio Call */}
                    <button
                        className={styles.headerBtn}
                        onClick={() => onCall?.(otherUserId)}
                        title="Audio call"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </button>

                    {/* Video Call */}
                    <button
                        className={styles.headerBtn}
                        onClick={() => onVideoCall?.(otherUserId)}
                        title="Video call"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="23 7 16 12 23 17 23 7" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                        </svg>
                    </button>

                    {/* Menu */}
                    <button className={styles.headerBtn} title="More options">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages Container */}
            <div
                className={styles.messagesContainer}
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {loading && messages.length === 0 ? (
                    <div className={styles.loadingState}>
                        <div className={styles.spinner}></div>
                        <p>Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>💬</div>
                        <h3>No messages yet</h3>
                        <p>Send a message to start the conversation!</p>
                    </div>
                ) : (
                    <>
                        {hasMore && (
                            <div className={styles.loadMoreContainer}>
                                <button className={styles.loadMoreBtn} onClick={loadMore}>
                                    Load older messages
                                </button>
                            </div>
                        )}

                        {groupedMessages.map((item, index) => (
                            item.type === 'date' ? (
                                <div key={`date-${index}`} className={styles.dateSeparator}>
                                    <span>{item.label}</span>
                                </div>
                            ) : (
                                <EnhancedMessageBubble
                                    key={item.data.id}
                                    message={item.data}
                                    currentUserId={currentUserId}
                                    onReply={handleReply}
                                    onDelete={handleDelete}
                                    onForward={handleForward}
                                    showAvatar={true}
                                />
                            )
                        ))}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollButton && (
                <button
                    className={styles.scrollToBottomBtn}
                    onClick={() => scrollToBottom()}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M19 12l-7 7-7-7" />
                    </svg>
                </button>
            )}

            {/* Message Input */}
            <EnhancedMessageInput
                conversationId={conversationId}
                currentUserId={currentUserId}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
                onSendMessage={sendMessage}
                typingUsers={typingUsers}
                onTypingChange={handleTypingChange}
            />
        </div>
    );
};

export default CompleteChatWindow;
