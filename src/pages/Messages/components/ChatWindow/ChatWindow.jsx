// ═══════════════════════════════════════════════════════════════════════
// CHAT WINDOW COMPONENT - Complete Production Integration
// Features: Messages, GIFs, Voice, Media, Calls, Sharing
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef } from 'react';
import { useMessages } from '../../hooks/useMessages';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { usePresence } from '../../hooks/usePresence';
import { useMessageQueue } from '../../hooks/useMessageQueue';
import { useCall } from '../../../../hooks/useCall';
import { sendTextMessage, sendMediaMessage, deleteMessageForMe, unsendMessage } from '../../../../utils/supabaseRest';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import GifPicker from '../../../../components/messages/GifPicker';
import StickerPicker from '../../../../components/messages/StickerPicker';
import CallModal from '../../../../components/messages/CallModal';
import VoiceRecorderModal from '../Modals/VoiceRecorderModal';
import MediaPickerModal from '../Modals/MediaPickerModal';
import ShareContentModal from '../Modals/ShareContentModal';
import styles from './ChatWindow.module.css';

const ChatWindow = ({
    conversationId,
    currentUserId,
    otherUser,
    onBack
}) => {
    const [replyTo, setReplyTo] = useState(null);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showMediaPicker, setShowMediaPicker] = useState(false);
    const [showShareContent, setShowShareContent] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Hooks
    const { messages, loading, hasMore, loadMore, markAsRead } = useMessages(conversationId, currentUserId);
    const { typingUsers, setIsTyping } = useTypingIndicator(conversationId, currentUserId);
    const { getUserPresence } = usePresence(currentUserId);
    const { enqueueMessage } = useMessageQueue(conversationId, currentUserId);
    const { activeCall, initiateCall, endCall } = useCall(conversationId, false);

    const otherUserPresence = getUserPresence(otherUser?.id);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Mark messages as read when viewing
    useEffect(() => {
        if (messages.length > 0) {
            markAsRead();
        }
    }, [messages, markAsRead]);

    // Handle scroll for pagination
    const handleScroll = (e) => {
        if (e.target.scrollTop === 0 && hasMore && !loading) {
            loadMore();
        }
    };

    // Send text message
    const handleSendMessage = async (messageData) => {
        try {
            if (messageData.type && messageData.attachmentData) {
                // Media message
                await sendMediaMessage(
                    conversationId,
                    currentUserId,
                    messageData.type,
                    messageData.attachmentData,
                    messageData.content
                );
            } else {
                // Text message
                await sendTextMessage(
                    conversationId,
                    currentUserId,
                    messageData.content,
                    messageData.replyToId
                );
            }
        } catch (error) {
            // If offline, queue the message
            if (!navigator.onLine) {
                enqueueMessage(messageData);
            } else {
                throw error;
            }
        }
    };

    // Send GIF
    const handleSendGif = async (gifUrl, description) => {
        try {
            await sendMediaMessage(
                conversationId,
                currentUserId,
                'gif',
                { url: gifUrl, thumbnailUrl: gifUrl },
                description
            );
        } catch (error) {
            console.error('Error sending GIF:', error);
        }
    };

    // Send sticker
    const handleSendSticker = async (stickerUrl, stickerName) => {
        try {
            await sendMediaMessage(
                conversationId,
                currentUserId,
                'sticker',
                { url: stickerUrl },
                stickerName
            );
        } catch (error) {
            console.error('Error sending sticker:', error);
        }
    };


    // Send voice message
    const handleSendVoice = async (content, metadata) => {
        try {
            await sendMediaMessage(
                conversationId,
                currentUserId,
                'voice',
                {
                    url: metadata.voice_url,
                    duration: metadata.voice_duration
                },
                content
            );
        } catch (error) {
            console.error('Error sending voice message:', error);
        }
    };

    // Send media (photo/video)
    const handleSendMedia = async (caption, metadata) => {
        try {
            const mediaUrls = metadata.media_urls || [];
            if (mediaUrls.length > 0) {
                await sendMediaMessage(
                    conversationId,
                    currentUserId,
                    metadata.type,
                    { url: mediaUrls[0] },
                    caption
                );
            }
        } catch (error) {
            console.error('Error sending media:', error);
        }
    };

    // Handle reply
    const handleReply = (message) => {
        setReplyTo(message);
    };

    // Handle delete
    const handleDelete = async (messageId) => {
        if (window.confirm('Delete this message for you?')) {
            try {
                await deleteMessageForMe(messageId);
            } catch (error) {
                console.error('Error deleting message:', error);
                alert('Failed to delete message');
            }
        }
    };

    // Handle unsend
    const handleUnsend = async (messageId) => {
        if (window.confirm('Unsend this message for everyone?')) {
            try {
                await unsendMessage(messageId);
            } catch (error) {
                console.error('Error unsending message:', error);
                alert('Failed to unsend message');
            }
        }
    };

    // Jump to message (for replies)
    const handleJumpToMessage = (messageId) => {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add(styles.highlight);
            setTimeout(() => element.classList.remove(styles.highlight), 2000);
        }
    };

    // Handle calls
    const handleAudioCall = async () => {
        try {
            await initiateCall(otherUser.id, 'audio', conversationId);
        } catch (error) {
            console.error('Error initiating audio call:', error);
        }
    };

    const handleVideoCall = async () => {
        try {
            await initiateCall(otherUser.id, 'video', conversationId);
        } catch (error) {
            console.error('Error initiating video call:', error);
        }
    };

    return (
        <div className={styles.chatWindow}>
            {/* Header */}
            <div className={styles.header}>
                <button className={styles.backButton} onClick={onBack}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        {otherUser?.avatar_url ? (
                            <img src={otherUser.avatar_url} alt={otherUser.username} />
                        ) : (
                            otherUser?.username?.[0]?.toUpperCase() || '?'
                        )}
                        {otherUserPresence?.isOnline && <div className={styles.onlineDot}></div>}
                    </div>
                    <div className={styles.userDetails}>
                        <div className={styles.userName}>
                            {otherUser?.full_name || otherUser?.username}
                        </div>
                        <div className={styles.userStatus}>
                            {otherUserPresence?.isOnline ? (
                                'Online'
                            ) : otherUserPresence?.lastSeenAt ? (
                                `Last seen ${new Date(otherUserPresence.lastSeenAt).toLocaleTimeString()}`
                            ) : (
                                'Offline'
                            )}
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.actionButton} onClick={handleAudioCall} title="Audio call">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </button>
                    <button className={styles.actionButton} onClick={handleVideoCall} title="Video call">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                            <line x1="7" y1="2" x2="7" y2="22" />
                            <line x1="17" y1="2" x2="17" y2="22" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <line x1="2" y1="7" x2="7" y2="7" />
                            <line x1="2" y1="17" x2="7" y2="17" />
                            <line x1="17" y1="17" x2="22" y2="17" />
                            <line x1="17" y1="7" x2="22" y2="7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div
                className={styles.messagesContainer}
                ref={messagesContainerRef}
                onScroll={handleScroll}
            >
                {loading && messages.length === 0 ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <h3>No messages yet</h3>
                        <p>Send a message to start the conversation</p>
                    </div>
                ) : (
                    <div className={styles.messagesList}>
                        {hasMore && (
                            <div className={styles.loadMore}>
                                <button onClick={loadMore} disabled={loading}>
                                    {loading ? 'Loading...' : 'Load more'}
                                </button>
                            </div>
                        )}
                        {messages.map((message, index) => (
                            <div key={message.id} id={`message-${message.id}`}>
                                <MessageBubble
                                    message={message}
                                    isSent={message.sender_id === currentUserId}
                                    currentUserId={currentUserId}
                                    onReply={handleReply}
                                    onDelete={handleDelete}
                                    onUnsend={handleUnsend}
                                    onJumpToMessage={handleJumpToMessage}
                                    showAvatar={
                                        index === 0 ||
                                        messages[index - 1].sender_id !== message.sender_id
                                    }
                                />
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input with Action Buttons */}
            <div className={styles.inputArea}>
                <div className={styles.quickActions}>
                    <button onClick={() => setShowGifPicker(true)} className={styles.quickActionBtn} title="Send GIF">
                        GIF
                    </button>
                    <button onClick={() => setShowStickerPicker(true)} className={styles.quickActionBtn} title="Send sticker">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                            <line x1="9" y1="9" x2="9.01" y2="9" />
                            <line x1="15" y1="9" x2="15.01" y2="9" />
                        </svg>
                    </button>
                    <button onClick={() => setShowMediaPicker(true)} className={styles.quickActionBtn} title="Send photo/video">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                        </svg>
                    </button>
                    <button onClick={() => setShowVoiceRecorder(true)} className={styles.quickActionBtn} title="Record voice message">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                            <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>


                <MessageInput
                    conversationId={conversationId}
                    currentUserId={currentUserId}
                    replyTo={replyTo}
                    onClearReply={() => setReplyTo(null)}
                    onSendMessage={handleSendMessage}
                    typingUsers={typingUsers}
                />
            </div>

            {/* GIF Picker Modal */}
            {showGifPicker && (
                <div className={styles.modalOverlay} onClick={() => setShowGifPicker(false)}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <GifPicker
                            onSelect={handleSendGif}
                            onClose={() => setShowGifPicker(false)}
                        />
                    </div>
                </div>
            )}

            {/* Sticker Picker Modal */}
            {showStickerPicker && (
                <div className={styles.modalOverlay} onClick={() => setShowStickerPicker(false)}>
                    <div onClick={(e) => e.stopPropagation()}>
                        <StickerPicker
                            onSelect={handleSendSticker}
                            onClose={() => setShowStickerPicker(false)}
                        />
                    </div>
                </div>
            )}


            {/* Voice Recorder Modal */}
            {showVoiceRecorder && (
                <VoiceRecorderModal
                    onClose={() => setShowVoiceRecorder(false)}
                    onSend={handleSendVoice}
                    currentUserId={currentUserId}
                />
            )}

            {/* Media Picker Modal */}
            {showMediaPicker && (
                <MediaPickerModal
                    onClose={() => setShowMediaPicker(false)}
                    onSend={handleSendMedia}
                    currentUserId={currentUserId}
                />
            )}

            {/* Active Call Modal */}
            {activeCall && (
                <CallModal
                    type={activeCall.call_type}
                    user={otherUser}
                    isIncoming={false}
                    onClose={endCall}
                />
            )}
        </div>
    );
};

export default ChatWindow;

