// ═══════════════════════════════════════════════════════════════════════
// 🔐 SOVEREIGN CHAT PANE - ULTIMATE E2EE MESSAGING
// Royal Lavender Glassmorphism + ALL FEATURES ACTIVATED
// GIF • Stickers • Emoji • Attachments • Voice • Reactions • Polls • Events
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useSecureMessageSend } from '../../hooks/useSecureMessageSend';
import { useSecureChatThread } from '../../hooks/useSecureChatThread';
import { useTypingIndicator, useTypingUserDetails } from '../../hooks/useTypingIndicator';
import { useCall } from '../../hooks/useCall';
import { useMessageEdit } from '../../hooks/useMessageEdit';
import { useMessageDelete } from '../../hooks/useMessageDelete';
import { useMessageForward } from '../../hooks/useMessageForward';
import { usePinnedMessages } from '../../hooks/usePinnedMessages';
import { useAttachmentUpload } from '../../hooks/useAttachmentUpload';
import { focusToast } from '../../utils/focusToast';
import { format } from 'date-fns';
import styles from './SovereignWhisper.module.css';

// 🚀 ADVANCED FEATURE COMPONENTS
import GifPicker from '../../pages/Messages/components/Modals/GifPicker';
import StickerPicker from './StickerPicker';
import EmojiPicker from './EmojiPicker';
import AudioRecorder from './AudioRecorder';
import ForwardMessageModal from './ForwardMessageModal';
import EditMessageModal from './EditMessageModal';
import DeleteMessageModal from './DeleteMessageModal';
import MediaPreviewModal from './MediaPreviewModal';
import PinnedMessagesBanner from './PinnedMessagesBanner';
import PinnedMessagesPanel from './PinnedMessagesPanel';
import MessageSearchPanel from './MessageSearchPanel';
import LocationPicker from './LocationPicker';
import PollCreator from './PollCreator';
import EventCreator from './EventCreator';
import VideoNoteRecorder from './VideoNoteRecorder';
import MessageReactions from './MessageReactions';
import ModernCallWindow from '../calls/ModernCallWindow';

// Icons (inline SVG for reliability)
const Icons = {
    back: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
    ),
    more: () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="5" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
    ),
    call: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    video: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
    ),
    send: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" fill="currentColor" />
        </svg>
    ),
    attach: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    ),
    emoji: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    ),
    shield: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    ),
    lock: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    doubleCheck: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
            <polyline points="14 6 3 17" strokeWidth="1.5" opacity="0.5" />
        </svg>
    ),
    close: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    gif: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 12h8M12 8v8" strokeWidth="1.5" />
        </svg>
    ),
    sticker: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    ),
    mic: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
    ),
    location: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    poll: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    ),
    calendar: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    videoNote: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
        </svg>
    ),
    pin: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="17" x2="12" y2="22" />
            <path d="M5 17h14M12 2v6M17 11l-5-5-5 5" />
        </svg>
    ),
    search: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    reply: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
        </svg>
    ),
    forward: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 14 20 9 15 4" />
            <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
        </svg>
    ),
    trash: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    edit: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    smile: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    )
};

// Trust Shield Badge Component
const TrustShieldBadge = () => (
    <div className={styles.trustShieldBadge} title="Focus Trust Shield Verified">
        <Icons.shield />
    </div>
);

// Encryption Status Indicator
const EncryptionStatus = ({ enabled }) => (
    <div className={styles.encryptionIndicator}>
        <Icons.lock />
        <span>{enabled ? 'End-to-End Encrypted' : 'Standard'}</span>
    </div>
);

// Status Ticks Component
const StatusTicks = ({ status }) => {
    const getStatusClass = () => {
        switch (status) {
            case 'read': return styles.statusRead;
            case 'delivered': return styles.statusDelivered;
            default: return styles.statusSent;
        }
    };

    return (
        <span className={`${styles.statusTicks} ${getStatusClass()}`}>
            {status === 'read' ? <Icons.doubleCheck /> : <Icons.check />}
        </span>
    );
};

// Message Bubble Component with Reactions & Actions
const MessageBubble = ({ 
    message, 
    isSent, 
    currentUserId, 
    onReact, 
    onReply, 
    onEdit, 
    onDelete, 
    onForward,
    onPin,
    onMediaClick,
    isPinned 
}) => {
    const bubbleClass = isSent ? styles.messageBubbleSent : styles.messageBubbleReceived;
    const encryptedClass = message.is_encrypted ? styles.messageBubbleEncrypted : '';
    const [showActions, setShowActions] = useState(false);
    
    const formatTime = (timestamp) => {
        try {
            return format(new Date(timestamp), 'HH:mm');
        } catch {
            return '';
        }
    };

    const getStatus = () => {
        if (!isSent) return null;
        const readBy = message.read_by || [];
        if (readBy.length > 0 && !readBy.includes(currentUserId)) return 'read';
        return 'sent';
    };

    // Quick reaction emojis
    const quickReactions = ['❤️', '😂', '👍', '😮', '😢', '🔥'];

    return (
        <div 
            className={`${styles.messageWrapper} ${isSent ? styles.sent : styles.received}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            style={{ position: 'relative' }}
        >
            {/* Pinned indicator */}
            {isPinned && (
                <div style={{
                    position: 'absolute',
                    top: -8,
                    right: isSent ? 'auto' : -8,
                    left: isSent ? -8 : 'auto',
                    color: '#FFD700',
                    filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))'
                }}>
                    <Icons.pin />
                </div>
            )}

            <div className={`${bubbleClass} ${encryptedClass}`}>
                {/* Media content */}
                {message.media_urls?.length > 0 && (
                    <div 
                        className={styles.messageMedia}
                        onClick={() => onMediaClick?.(message)}
                        style={{ cursor: 'pointer', marginBottom: 8 }}
                    >
                        {message.media_urls.map((media, idx) => (
                            media.type?.startsWith('image/') ? (
                                <img 
                                    key={idx}
                                    src={media.url} 
                                    alt="Shared media"
                                    style={{ 
                                        maxWidth: 200, 
                                        maxHeight: 200, 
                                        borderRadius: 8,
                                        objectFit: 'cover'
                                    }} 
                                />
                            ) : media.type?.startsWith('video/') ? (
                                <video 
                                    key={idx}
                                    src={media.url}
                                    style={{ 
                                        maxWidth: 200, 
                                        maxHeight: 200, 
                                        borderRadius: 8 
                                    }}
                                    controls
                                />
                            ) : null
                        ))}
                    </div>
                )}

                {/* Message content */}
                <div className={styles.messageContent}>{message.content}</div>

                {/* Reactions display */}
                {message.reactions?.length > 0 && (
                    <MessageReactions 
                        reactions={message.reactions}
                        currentUserId={currentUserId}
                        onReactionClick={(emoji) => onReact?.(message, emoji)}
                    />
                )}

                {/* Meta */}
                <div className={styles.messageMeta}>
                    <span className={styles.messageTime}>
                        {formatTime(message.created_at)}
                    </span>
                    {isSent && <StatusTicks status={getStatus()} />}
                </div>
            </div>

            {/* Message Actions */}
            {showActions && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    right: isSent ? '100%' : 'auto',
                    left: isSent ? 'auto' : '100%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    gap: 4,
                    padding: '4px 8px',
                    background: 'rgba(13, 13, 13, 0.9)',
                    borderRadius: 20,
                    border: '1px solid rgba(126, 87, 194, 0.3)',
                    zIndex: 10
                }}>
                    {/* Quick reactions */}
                    {quickReactions.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => onReact?.(message, emoji)}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 14,
                                padding: 2
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                    
                    {/* Action buttons */}
                    <button onClick={() => onReply?.(message)} title="Reply">
                        <Icons.reply />
                    </button>
                    {isSent && (
                        <button onClick={() => onEdit?.(message)} title="Edit">
                            <Icons.edit />
                        </button>
                    )}
                    <button onClick={() => onForward?.(message)} title="Forward">
                        <Icons.forward />
                    </button>
                    <button onClick={() => onPin?.(message)} title={isPinned ? 'Unpin' : 'Pin'}>
                        <Icons.pin />
                    </button>
                    <button onClick={() => onDelete?.(message)} title="Delete">
                        <Icons.trash />
                    </button>
                </div>
            )}
        </div>
    );
};

// Typing Indicator Component
const TypingIndicator = ({ username }) => (
    <div className={styles.typingIndicator}>
        <div className={styles.typingDots}>
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
            <span className={styles.typingDot} />
        </div>
        <span className={styles.typingText}>{username} is typing...</span>
    </div>
);

// Reply Preview Component
const ReplyPreview = ({ message, onClear }) => {
    if (!message) return null;
    
    return (
        <div className={styles.replyPreview}>
            <span className={styles.replyPreviewText}>
                Replying to: {message.content?.substring(0, 50)}
                {message.content?.length > 50 ? '...' : ''}
            </span>
            <button className={styles.replyPreviewClose} onClick={onClear}>
                <Icons.close />
            </button>
        </div>
    );
};

// Main SovereignChatPane Component - ULTIMATE VERSION
const SovereignChatPane = ({
    currentUserId,
    otherUserId,
    conversationId,
    otherUserData,
    onBack,
    className = ''
}) => {
    // ═════════════════════════════════════════════════════════════════
    // STATE MANAGEMENT - ALL FEATURES
    // ═════════════════════════════════════════════════════════════════
    
    // Input State
    const [inputValue, setInputValue] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    
    // Picker States
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Attachment State
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    
    // Modal States
    const [forwardMessage, setForwardMessage] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [deletingMessage, setDeletingMessage] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [showPinned, setShowPinned] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    
    // Advanced Feature States
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [showEventCreator, setShowEventCreator] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    
    // Refs
    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // Hooks
    const {
        messages,
        loading,
        error,
        otherUser,
        encryptionEnabled
    } = useSecureChatThread(currentUserId, conversationId);

    const {
        sendMessage,
        sending,
        encryptionReady
    } = useSecureMessageSend(currentUserId, otherUserId);

    const {
        typingUsers: typingUserIds,
        handleTyping,
        stopTyping
    } = useTypingIndicator(conversationId, null, currentUserId);

    const typingUsers = useTypingUserDetails(typingUserIds);

    const {
        activeCall,
        callType,
        isInitiator,
        initiateCall,
        answerCall,
        endCall
    } = useCall(conversationId, false);

    // Advanced Feature Hooks
    const { editing, editMessage, canEdit } = useMessageEdit();
    const { deleting, deleteForMe, deleteForEveryone } = useMessageDelete();
    const { forwardToMultiple } = useMessageForward();
    const { pinnedMessages, pinMessage, unpinMessage, isPinned, canPinMore } = usePinnedMessages(conversationId);
    const { uploadFile, uploading: uploadingFile, progress: uploadProgress } = useAttachmentUpload();

    // ═════════════════════════════════════════════════════════════════
    // HANDLER FUNCTIONS - ALL FEATURES
    // ═════════════════════════════════════════════════════════════════

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle input change with typing indicator
    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        
        if (value && !isTyping) {
            setIsTyping(true);
            handleTyping();
        } else if (!value && isTyping) {
            setIsTyping(false);
            stopTyping();
        }
    };

    // Handle send text message
    const handleSend = async () => {
        if (!inputValue.trim() || sending) return;

        const content = inputValue.trim();
        setInputValue('');
        setIsTyping(false);
        stopTyping();

        try {
            await sendMessage(content, {
                conversationId,
                replyTo: replyTo?.id,
                messageType: 'text'
            });
            
            setReplyTo(null);
        } catch (err) {
            console.error('Failed to send:', err);
            focusToast.error('Failed to send message');
            setInputValue(content);
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 🎭 REACTIONS HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleReact = async (message, emoji) => {
        try {
            const existingReactions = message.reactions || [];
            const existingIndex = existingReactions.findIndex(
                r => r.user_id === currentUserId && r.emoji === emoji
            );

            let newReactions;
            if (existingIndex >= 0) {
                newReactions = existingReactions.filter((_, idx) => idx !== existingIndex);
            } else {
                newReactions = [...existingReactions, { user_id: currentUserId, emoji }];
            }

            const { error } = await supabase
                .from('messages')
                .update({ reactions: newReactions })
                .eq('id', message.id);

            if (error) throw error;
            focusToast.success(existingIndex >= 0 ? 'Reaction removed' : 'Reaction added');
        } catch (error) {
            console.error('Failed to react:', error);
            focusToast.error('Failed to add reaction');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 🎯 MESSAGE ACTIONS HANDLERS
    // ═════════════════════════════════════════════════════════════════
    const handleReply = (message) => setReplyTo(message);
    
    const handleEdit = (message) => {
        if (!canEdit(message, currentUserId)) {
            focusToast.error('Cannot edit this message');
            return;
        }
        setEditingMessage(message);
    };

    const handleEditSubmit = async (newContent) => {
        if (!editingMessage) return;
        try {
            const success = await editMessage(editingMessage.id, newContent, editingMessage.content);
            if (success) {
                setEditingMessage(null);
                focusToast.success('Message edited');
            }
        } catch (error) {
            focusToast.error('Failed to edit message');
        }
    };

    const handleDelete = (message) => setDeletingMessage(message);

    const handleDeleteConfirm = async (forEveryone) => {
        if (!deletingMessage) return;
        try {
            if (forEveryone) {
                await deleteForEveryone(deletingMessage.id);
            } else {
                await deleteForMe(deletingMessage.id, currentUserId);
            }
            setDeletingMessage(null);
            focusToast.success(forEveryone ? 'Deleted for everyone' : 'Deleted for you');
        } catch (error) {
            focusToast.error('Failed to delete message');
        }
    };

    const handleForward = (message) => setForwardMessage(message);

    const handleForwardSubmit = async (recipients) => {
        if (!forwardMessage || !recipients.length) return;
        try {
            await forwardToMultiple(forwardMessage, recipients, currentUserId);
            setForwardMessage(null);
            focusToast.success(`Forwarded to ${recipients.length} chat${recipients.length > 1 ? 's' : ''}`);
        } catch (error) {
            focusToast.error('Failed to forward message');
        }
    };

    const handlePin = async (message) => {
        try {
            if (isPinned(message.id)) {
                const pinnedMsg = pinnedMessages.find(p => p.message_id === message.id);
                if (pinnedMsg) await unpinMessage(pinnedMsg.id);
            } else {
                if (!canPinMore) {
                    focusToast.error('Max 3 pinned messages');
                    return;
                }
                await pinMessage(message.id, currentUserId);
            }
        } catch (error) {
            focusToast.error('Failed to pin message');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 📎 FILE ATTACHMENTS HANDLERS
    // ═════════════════════════════════════════════════════════════════
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setFilePreview({
                url: e.target.result,
                name: file.name,
                type: file.type.startsWith('image/') ? 'image' : 
                      file.type.startsWith('video/') ? 'video' : 'file',
                size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
            });
        };
        reader.readAsDataURL(file);
    };

    const handleFileSend = async () => {
        if (!selectedFile) return;
        
        try {
            const url = await uploadFile(selectedFile);
            const messageType = selectedFile.type.startsWith('image/') ? 'image' :
                               selectedFile.type.startsWith('video/') ? 'video' : 'file';
            
            await sendMessage('', {
                conversationId,
                messageType,
                attachments: [{ url, name: selectedFile.name, type: selectedFile.type }]
            });
            
            setSelectedFile(null);
            setFilePreview(null);
            focusToast.success('File sent');
        } catch (err) {
            focusToast.error('Failed to send file');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 🎙️ VOICE MESSAGE HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleVoiceRecord = async (audioBlob, duration) => {
        try {
            const file = new File([audioBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
            const url = await uploadFile(file);
            
            await sendMessage('', {
                conversationId,
                messageType: 'voice',
                voice_url: url,
                voice_duration: duration,
                attachments: [{ url, type: 'audio/webm', duration }]
            });
            
            setIsRecording(false);
            focusToast.success('Voice message sent');
        } catch (err) {
            focusToast.error('Failed to send voice message');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 🎨 GIF HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleGifSelect = async (gifData) => {
        try {
            await sendMessage('', {
                conversationId,
                messageType: 'gif',
                metadata: {
                    url: gifData.url,
                    previewUrl: gifData.previewUrl,
                    width: gifData.width,
                    height: gifData.height,
                    title: gifData.title
                }
            });
            setShowGifPicker(false);
            focusToast.success('GIF sent');
        } catch (err) {
            focusToast.error('Failed to send GIF');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 🏷️ STICKER HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleStickerSelect = async (stickerData) => {
        try {
            await sendMessage('', {
                conversationId,
                messageType: 'sticker',
                metadata: stickerData
            });
            setShowStickerPicker(false);
            focusToast.success('Sticker sent');
        } catch (err) {
            focusToast.error('Failed to send sticker');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 😀 EMOJI HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleEmojiSelect = (emoji) => {
        const cursorPos = inputRef.current?.selectionStart || inputValue.length;
        const newText = inputValue.slice(0, cursorPos) + emoji + inputValue.slice(cursorPos);
        setInputValue(newText);
        setShowEmojiPicker(false);
        inputRef.current?.focus();
    };

    // ═════════════════════════════════════════════════════════════════
    // 📍 LOCATION HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleLocationShare = async (location, isLive) => {
        try {
            await sendMessage('', {
                conversationId,
                messageType: 'location',
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address
                },
                isLive
            });
            setShowLocationPicker(false);
            focusToast.success(isLive ? 'Live location shared' : 'Location shared');
        } catch (err) {
            focusToast.error('Failed to share location');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 📊 POLL HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handlePollCreate = async (pollData) => {
        try {
            await sendMessage(pollData.question, {
                conversationId,
                messageType: 'poll',
                poll: pollData
            });
            setShowPollCreator(false);
            focusToast.success('Poll created');
        } catch (err) {
            focusToast.error('Failed to create poll');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 📅 EVENT HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleEventCreate = async (eventData) => {
        try {
            await sendMessage(eventData.title, {
                conversationId,
                messageType: 'event',
                event: eventData
            });
            setShowEventCreator(false);
            focusToast.success('Event created');
        } catch (err) {
            focusToast.error('Failed to create event');
        }
    };

    // ═════════════════════════════════════════════════════════════════
    // 🎥 VIDEO NOTE HANDLER
    // ═════════════════════════════════════════════════════════════════
    const handleVideoNote = async (videoBlob, duration) => {
        try {
            const file = new File([videoBlob], `video-note-${Date.now()}.webm`, { type: 'video/webm' });
            const url = await uploadFile(file);
            
            await sendMessage('', {
                conversationId,
                messageType: 'video_note',
                attachments: [{ url, type: 'video/webm', duration }]
            });
            
            setShowVideoRecorder(false);
            focusToast.success('Video note sent');
        } catch (err) {
            focusToast.error('Failed to send video note');
        }
    };

    // Handle key press (Enter to send)
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle voice call
    const handleCall = async () => {
        if (!otherUserId) {
            focusToast.error('No user selected');
            return;
        }

        const call = await initiateCall(otherUserId, 'audio');
        if (call) {
            focusToast.success('Calling...');
        } else {
            focusToast.error('Failed to initiate call');
        }
    };

    // Handle video call
    const handleVideoCall = async () => {
        if (!otherUserId) {
            focusToast.error('No user selected');
            return;
        }

        const call = await initiateCall(otherUserId, 'video');
        if (call) {
            focusToast.success('Video calling...');
        } else {
            focusToast.error('Failed to initiate video call');
        }
    };

    // Format status text
    const formatStatus = () => {
        if (otherUser?.is_online) return 'Online';
        if (otherUser?.last_seen) {
            try {
                const date = new Date(otherUser.last_seen);
                return `Last seen ${format(date, 'HH:mm')}`;
            } catch {
                return 'Offline';
            }
        }
        return 'Offline';
    };

    const user = otherUser || otherUserData;

    if (!conversationId) {
        return (
            <div className={`${styles.sovereignChatPane} ${className}`}>
                <div className={styles.sovereignEmptyState}>
                    <svg className={styles.sovereignEmptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <h3 className={styles.sovereignEmptyTitle}>Select a conversation</h3>
                    <p className={styles.sovereignEmptyText}>
                        Choose a conversation from the inbox to start messaging securely
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.sovereignChatPane} ${className}`}>
            {/* Header */}
            <div className={styles.sovereignHeader}>
                <div className={styles.sovereignHeaderLeft}>
                    {onBack && (
                        <button className={styles.inputButton} onClick={onBack}>
                            <Icons.back />
                        </button>
                    )}
                    
                    <div className={styles.sovereignHeaderInfo}>
                        <div className={styles.sovereignUsername}>
                            {user?.username || 'Unknown'}
                            <TrustShieldBadge />
                        </div>
                        <div className={styles.sovereignStatus}>
                            <span className={`${styles.sovereignStatusDot} ${user?.is_online ? styles.online : ''}`} />
                            {formatStatus()}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <EncryptionStatus enabled={encryptionEnabled} />
                    
                    <button 
                        className={styles.inputButton} 
                        onClick={() => setShowSearch(true)}
                        title="Search messages"
                    >
                        <Icons.search />
                    </button>
                    <button 
                        className={styles.inputButton} 
                        onClick={() => setShowPinned(true)}
                        title="Pinned messages"
                    >
                        <Icons.pin />
                    </button>
                    <button className={styles.inputButton} onClick={handleCall} title="Voice call">
                        <Icons.call />
                    </button>
                    <button className={styles.inputButton} onClick={handleVideoCall} title="Video call">
                        <Icons.video />
                    </button>
                    <button className={styles.inputButton}>
                        <Icons.more />
                    </button>
                </div>
            </div>

            {/* Pinned Messages Banner */}
            <PinnedMessagesBanner
                conversationId={conversationId}
                groupId={null}
                currentUserId={currentUserId}
                onJumpToMessage={(msg) => {
                    const element = document.getElementById(`message-${msg.id}`);
                    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
            />

            {/* Messages List */}
            <div className={styles.sovereignMessageList}>
                {loading ? (
                    <div className={styles.loadingContainer}>
                        <div className={styles.loadingSpinner} />
                        <span className={styles.loadingText}>Loading messages...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className={styles.sovereignEmptyState}>
                        <div className={styles.dateDivider}>
                            <span className={styles.dateDividerText}>Today</span>
                        </div>
                        <p className={styles.sovereignEmptyText}>
                            No messages yet. Start a secure conversation!
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isSent = message.sender_id === currentUserId;
                            const showDateDivider = index === 0 || 
                                new Date(message.created_at).toDateString() !== 
                                new Date(messages[index - 1].created_at).toDateString();

                            return (
                                <React.Fragment key={message.id}>
                                    {showDateDivider && (
                                        <div className={styles.dateDivider}>
                                            <span className={styles.dateDividerText}>
                                                {format(new Date(message.created_at), 'MMMM d, yyyy')}
                                            </span>
                                        </div>
                                    )}
                                    <div id={`message-${message.id}`}>
                                        <MessageBubble 
                                            message={message} 
                                            isSent={isSent}
                                            currentUserId={currentUserId}
                                            onReact={handleReact}
                                            onReply={handleReply}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            onForward={handleForward}
                                            onPin={handlePin}
                                            onMediaClick={(msg) => setMediaPreview(msg)}
                                            isPinned={isPinned(message.id)}
                                        />
                                    </div>
                                </React.Fragment>
                            );
                        })}
                        
                        {/* Typing Indicator */}
                        {typingUsers.length > 0 && (
                            <TypingIndicator username={typingUsers[0]?.username || 'Someone'} />
                        )}
                        
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Reply Preview */}
            <ReplyPreview message={replyTo} onClear={() => setReplyTo(null)} />

            {/* ═════════════════════════════════════════════════════════════════
                🚀 ULTIMATE INPUT BAR - ALL FEATURES
                ═════════════════════════════════════════════════════════════════ */}
            <div className={styles.sovereignInputContainer}>
                {/* File Preview */}
                {filePreview && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        margin: '0 16px 8px',
                        background: 'rgba(126, 87, 194, 0.1)',
                        borderRadius: '12px',
                        border: '1px solid rgba(126, 87, 194, 0.3)'
                    }}>
                        {filePreview.type === 'image' ? (
                            <img src={filePreview.url} alt="Preview" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                        ) : (
                            <div style={{ fontSize: 24 }}>📎</div>
                        )}
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, color: '#E8E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {filePreview.name}
                            </div>
                            <div style={{ fontSize: 11, color: 'rgba(232, 232, 240, 0.5)' }}>
                                {filePreview.size}
                            </div>
                        </div>
                        <button 
                            onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                            style={{ background: 'transparent', border: 'none', color: '#E8E8F0', cursor: 'pointer' }}
                        >
                            <Icons.close />
                        </button>
                        <button 
                            onClick={handleFileSend}
                            disabled={uploadingFile}
                            style={{
                                padding: '6px 12px',
                                background: 'linear-gradient(135deg, #7E57C2, #512DA8)',
                                border: 'none',
                                borderRadius: 16,
                                color: 'white',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {uploadingFile ? `${uploadProgress}%` : 'Send'}
                        </button>
                    </div>
                )}

                {/* Voice Recording UI */}
                {isRecording ? (
                    <AudioRecorder 
                        onRecordComplete={handleVoiceRecord}
                        onCancel={() => setIsRecording(false)}
                    />
                ) : (
                    <div className={`${styles.sovereignInputBar} ${isTyping ? styles.typing : ''}`}>
                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                        />

                        {/* Attachment Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach file"
                        >
                            <Icons.attach />
                        </button>

                        {/* GIF Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setShowGifPicker(true)}
                            title="Send GIF"
                        >
                            <Icons.gif />
                        </button>

                        {/* Sticker Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setShowStickerPicker(true)}
                            title="Send sticker"
                        >
                            <Icons.sticker />
                        </button>

                        {/* Emoji Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Emoji"
                        >
                            <Icons.emoji />
                        </button>
                        
                        <textarea
                            ref={inputRef}
                            className={styles.sovereignInput}
                            placeholder="Type a secure message..."
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            rows={1}
                        />

                        {/* Voice Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setIsRecording(true)}
                            title="Voice message"
                        >
                            <Icons.mic />
                        </button>

                        {/* Location Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setShowLocationPicker(true)}
                            title="Share location"
                        >
                            <Icons.location />
                        </button>

                        {/* Poll Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setShowPollCreator(true)}
                            title="Create poll"
                        >
                            <Icons.poll />
                        </button>

                        {/* Event Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setShowEventCreator(true)}
                            title="Create event"
                        >
                            <Icons.calendar />
                        </button>

                        {/* Video Note Button */}
                        <button 
                            className={styles.inputButton}
                            onClick={() => setShowVideoRecorder(true)}
                            title="Video note"
                        >
                            <Icons.videoNote />
                        </button>
                        
                        <button 
                            className={`${styles.inputButton} ${styles.send}`}
                            onClick={handleSend}
                            disabled={!inputValue.trim() || sending}
                        >
                            <Icons.send />
                        </button>
                    </div>
                )}

                {/* Emoji Picker Popup */}
                {showEmojiPicker && (
                    <div style={{
                        position: 'absolute',
                        bottom: '100%',
                        right: 80,
                        zIndex: 100
                    }}>
                        <EmojiPicker 
                            onEmojiClick={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    </div>
                )}
            </div>

            {/* ═════════════════════════════════════════════════════════════════
                🎯 ALL MODALS - ADVANCED FEATURES
                ═════════════════════════════════════════════════════════════════ */}

            {/* Active Call */}
            {activeCall && (
                <ModernCallWindow
                    callId={activeCall.id}
                    userId={currentUserId}
                    otherUser={user}
                    isInitiator={isInitiator}
                    audioOnly={callType === 'audio'}
                    onEndCall={endCall}
                />
            )}

            {/* GIF Picker */}
            {showGifPicker && (
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            )}

            {/* Sticker Picker */}
            {showStickerPicker && (
                <StickerPicker
                    onSelect={handleStickerSelect}
                    onClose={() => setShowStickerPicker(false)}
                />
            )}

            {/* Forward Message */}
            {forwardMessage && (
                <ForwardMessageModal
                    message={forwardMessage}
                    currentUserId={currentUserId}
                    onClose={() => setForwardMessage(null)}
                    onForward={handleForwardSubmit}
                />
            )}

            {/* Edit Message */}
            {editingMessage && (
                <EditMessageModal
                    message={editingMessage}
                    onClose={() => setEditingMessage(null)}
                    onSubmit={handleEditSubmit}
                    isLoading={editing}
                />
            )}

            {/* Delete Message */}
            {deletingMessage && (
                <DeleteMessageModal
                    message={deletingMessage}
                    currentUserId={currentUserId}
                    onClose={() => setDeletingMessage(null)}
                    onConfirm={handleDeleteConfirm}
                    isLoading={deleting}
                />
            )}

            {/* Media Preview */}
            {mediaPreview && (
                <MediaPreviewModal
                    media={mediaPreview.media_urls?.map(m => ({...m, url: m.url})) || []}
                    initialIndex={0}
                    onClose={() => setMediaPreview(null)}
                />
            )}

            {/* Pinned Messages Panel */}
            {showPinned && (
                <PinnedMessagesPanel
                    conversationId={conversationId}
                    currentUserId={currentUserId}
                    otherUserId={otherUserId}
                    onClose={() => setShowPinned(false)}
                    onJumpToMessage={(msg) => {
                        setShowPinned(false);
                        const element = document.getElementById(`message-${msg.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                />
            )}

            {/* Message Search */}
            {showSearch && (
                <MessageSearchPanel
                    conversationId={conversationId}
                    onClose={() => setShowSearch(false)}
                    onSelectMessage={(msg) => {
                        const element = document.getElementById(`message-${msg.id}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element?.classList.add('highlight');
                        setTimeout(() => element?.classList.remove('highlight'), 2000);
                    }}
                />
            )}

            {/* Location Picker */}
            {showLocationPicker && (
                <LocationPicker
                    onSelect={handleLocationShare}
                    onClose={() => setShowLocationPicker(false)}
                />
            )}

            {/* Poll Creator */}
            {showPollCreator && (
                <PollCreator
                    onSubmit={handlePollCreate}
                    onClose={() => setShowPollCreator(false)}
                />
            )}

            {/* Event Creator */}
            {showEventCreator && (
                <EventCreator
                    onSubmit={handleEventCreate}
                    onClose={() => setShowEventCreator(false)}
                />
            )}

            {/* Video Note Recorder */}
            {showVideoRecorder && (
                <VideoNoteRecorder
                    onComplete={handleVideoNote}
                    onClose={() => setShowVideoRecorder(false)}
                />
            )}
        </div>
    );
};

export default React.memo(SovereignChatPane);
