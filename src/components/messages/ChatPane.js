import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInputBar from './MessageInputBar';
import MediaPreviewModal from './MediaPreviewModal';
// v2.0 ADVANCED FEATURES - Restored
import ForwardMessageModal from './ForwardMessageModal';
import EditMessageModal from './EditMessageModal';
import DeleteMessageModal from './DeleteMessageModal';
import PinnedMessagesBanner from './PinnedMessagesBanner';
import MessageSearchPanel from './MessageSearchPanel';
import PinnedMessagesPanel from './PinnedMessagesPanel';
import UserInfoModal from './UserInfoModal';
import ModernCallWindow from '../calls/ModernCallWindow';
// v2.0 ADVANCED MESSAGING FEATURES
import LocationPicker from './LocationPicker';
import PollCreator from './PollCreator';
import EventCreator from './EventCreator';
import VideoNoteRecorder from './VideoNoteRecorder';
// 🚀 NEW: PRODUCTION MESSAGING FEATURES (Dec 31, 2025)
import EnhancedMessageInput from '../../pages/Messages/components/ChatWindow/EnhancedMessageInput';
import GifPicker from '../../pages/Messages/components/Modals/GifPicker';
import ShareToMessages from '../../pages/Messages/components/Modals/ShareToMessages';
import { useRealtimeMessages } from '../../pages/Messages/hooks/useRealtimeMessages';
import { useChatThread } from '../../hooks/useChatThread';
import { useMessageSend } from '../../hooks/useMessageSend';
import { useTypingIndicator, useTypingUserDetails } from '../../hooks/useTypingIndicator';
import { useMessageStatus } from '../../hooks/useMessageStatus';
import { useCall } from '../../hooks/useCall';
import { useAuth } from '../../hooks/useAuth';
// v2.0 ADVANCED HOOKS - Restored
import { useMessageEdit } from '../../hooks/useMessageEdit';
import { useMessageDelete } from '../../hooks/useMessageDelete';
import { useMessageForward } from '../../hooks/useMessageForward';
import { usePinnedMessages } from '../../hooks/usePinnedMessages';
import { useAttachmentUpload } from '../../hooks/useAttachmentUpload';
import { supabase } from '../../lib/supabase';
import { focusToast } from '../../utils/focusToast';
import styles from './ChatPane.module.css';

const ChatPane = ({
    currentUserId,
    otherUserId,
    conversationId,
    otherUserData,  // NEW: Pass user data from Messages
    onBack,
    className = ''
}) => {
    console.log('ChatPane mounted', { conversationId, otherUserId, currentUserId });

    const [replyTo, setReplyTo] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [forwardMessage, setForwardMessage] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [deletingMessage, setDeletingMessage] = useState(null);
    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [showVideoRecorder, setShowVideoRecorder] = useState(false);
    const [showEventCreator, setShowEventCreator] = useState(false);
    const [silentMode, setSilentMode] = useState(false);
    // 🚀 NEW: Production messaging states
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [contentToShare, setContentToShare] = useState(null);
    const [useEnhancedInput, setUseEnhancedInput] = useState(true); // Toggle for new input

    const { user, session } = useAuth();
    const { messages, loading, otherUser: fetchedOtherUser, refetch } = useChatThread(currentUserId, conversationId, session);
    const { sendMessage, sending, optimisticMessages, clearOptimisticMessages } = useMessageSend(currentUserId, otherUserId, session);

    // NEW: Use pro-grade typing indicator hook
    const { typingUsers: typingUserIds, isTyping, handleTyping, stopTyping } = useTypingIndicator(
        conversationId,
        null, // groupId (null for 1-on-1 chats)
        currentUserId
    );

    const typingUsers = useTypingUserDetails(typingUserIds);

    useMessageStatus(conversationId, currentUserId);

    const {
        activeCall,
        callType,
        isInitiator,
        initiateCall,
        answerCall,
        endCall
    } = useCall(conversationId, false); // Disable incoming call listening - handled by global listener

    // v2.0 ADVANCED HOOKS - Restored
    const { editing: isEditing, editMessage: editMsg, canEdit } = useMessageEdit();
    const { deleting: isDeleting, deleteForMe, deleteForEveryone } = useMessageDelete();
    const { forwardToMultiple } = useMessageForward();
    const { pinnedMessages, pinMessage, unpinMessage, isPinned, canPinMore } = usePinnedMessages(conversationId);
    const { uploadFile } = useAttachmentUpload();

    // Check for pending call from localStorage (when receiver accepts call)
    // MUST be before early return to comply with React Hooks rules
    useEffect(() => {
        if (!conversationId) return; // Guard clause

        console.log('🔍 Checking for pending call in localStorage...');
        const pendingCallData = localStorage.getItem('pendingCall');

        if (pendingCallData) {
            try {
                const callData = JSON.parse(pendingCallData);
                console.log('📞 Found pending call:', callData);
                console.log(`🔍 Comparing IDs: Call(${callData.conversation_id}) vs Current(${conversationId})`);

                // Check if this call is for this conversation
                if (callData.conversation_id === conversationId) {
                    console.log('✅ Pending call matches this conversation!');

                    // Clear from localStorage
                    localStorage.removeItem('pendingCall');

                    // Answer the call
                    console.log('📞 Auto-answering call:', callData.id, 'Type:', callData.call_type);
                    answerCall(callData.id, callData.call_type);
                } else {
                    console.log('⚠️ Pending call is for different conversation');
                }
            } catch (err) {
                console.error('❌ Error parsing pending call:', err);
                localStorage.removeItem('pendingCall');
            }
        } else {
            console.log('ℹ️ No pending call found');
        }
    }, [conversationId, answerCall]);

    // Use passed otherUserData as fallback if useChatThread doesn't return data
    const otherUser = fetchedOtherUser || otherUserData;
    console.log('👤 Using otherUser:', { fetchedOtherUser, otherUserData, final: otherUser });

    // Early return AFTER all hooks
    if (!conversationId) {
        console.warn('⚠️ ChatPane rendered without conversationId!');
        return null;
    }

    // Combine real messages with optimistic messages
    const allMessages = [...messages, ...optimisticMessages];
    console.log('💬 Messages to display:', {
        realCount: messages.length,
        optimisticCount: optimisticMessages.length,
        totalCount: allMessages.length
    });

    const handleSend = async (contentOrData, options = {}) => {
        console.log('🚀 handleSend called with:', { contentOrData, options, conversationId });

        let content = contentOrData;
        let finalOptions = { ...options };

        // Handle object from EnhancedMessageInput (which passes { content, replyToId, ... })
        if (typeof contentOrData === 'object' && contentOrData !== null && !options.messageType) {
            console.log('📦 Detected object payload from EnhancedMessageInput');
            content = contentOrData.content;
            finalOptions = {
                ...finalOptions,
                ...contentOrData, // Merge type, metadata, etc.
                replyTo: contentOrData.replyToId // Map replyToId to replyTo
            };
        }

        try {
            const result = await sendMessage(content, {
                ...finalOptions,
                conversationId,
                replyTo: finalOptions.replyTo || options.replyTo?.id
            });
            console.log('✅ handleSend completed successfully:', result);
            setReplyTo(null);

            // Force refetch messages to update UI immediately
            if (refetch) {
                console.log('🔄 Refetching messages...');
                await refetch();
                // Clear optimistic messages after refetch to prevent duplicates
                clearOptimisticMessages();
            }

            return result;
        } catch (err) {
            console.error('❌ handleSend failed:', err);
            console.error('❌ Full error object:', JSON.stringify(err, null, 2));
            throw err;
        }
    };

    const handleReply = (message) => {
        console.log('↩️ handleReply called in ChatPane:', message);
        setReplyTo(message);
    };

    const handleReact = async (message, emoji) => {
        console.log('🎭 handleReact called in ChatPane:', { message, emoji });
        try {
            // Get existing reactions or initialize empty array
            const existingReactions = message.reactions || [];

            // Check if user already reacted with this emoji
            const existingReactionIndex = existingReactions.findIndex(
                r => r.user_id === currentUserId && r.emoji === emoji
            );

            let newReactions;
            if (existingReactionIndex >= 0) {
                // Remove reaction if already exists
                newReactions = existingReactions.filter((_, idx) => idx !== existingReactionIndex);
            } else {
                // Add new reaction
                newReactions = [...existingReactions, { user_id: currentUserId, emoji }];
            }

            const { error } = await supabase
                .from('messages')
                .update({ reactions: newReactions })
                .eq('id', message.id);

            if (error) throw error;

            // Refetch messages to update UI
            refetch?.();

            focusToast.success(existingReactionIndex >= 0 ? 'Reaction removed' : 'Reaction added');
        } catch (error) {
            console.error('Failed to react:', error);
            focusToast.error('Failed to add reaction');
        }
    };

    // v2.0 ADVANCED HANDLERS - Restored
    const handleDelete = (message) => {
        console.log('🗑️ handleDelete called in ChatPane:', message);
        setDeletingMessage(message);
    };

    const handleDeleteConfirm = async (forEveryone) => {
        console.log('🗑️ handleDeleteConfirm called:', { deletingMessage, forEveryone });
        if (!deletingMessage) return;
        try {
            if (forEveryone) {
                console.log('🗑️ Deleting for everyone:', deletingMessage.id);
                await deleteForEveryone(deletingMessage.id);
            } else {
                console.log('🗑️ Deleting for me:', deletingMessage.id);
                await deleteForMe(deletingMessage.id, currentUserId);
            }
            console.log('✅ Delete successful');
            setDeletingMessage(null);
            refetch?.();
        } catch (error) {
            console.error('❌ Failed to delete message:', error);
        }
    };

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
            const success = await editMsg(editingMessage.id, newContent, editingMessage.content);
            if (success) {
                setEditingMessage(null);
                refetch?.();
            }
        } catch (error) {
            console.error('Failed to edit message:', error);
        }
    };

    const handleStar = async (message) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_starred: !message.is_starred })
                .eq('id', message.id);

            if (error) throw error;
            focusToast.success(message.is_starred ? 'Removed from starred' : 'Added to starred');
        } catch (error) {
            console.error('Failed to star message:', error);
            focusToast.error('Failed to star message');
        }
    };

    const handleForward = (message) => {
        setForwardMessage(message);
    };

    const handleForwardSubmit = async (recipients) => {
        if (!forwardMessage || !recipients.length) return;
        try {
            await forwardToMultiple(forwardMessage, recipients, currentUserId);
            setForwardMessage(null);
        } catch (error) {
            console.error('Failed to forward message:', error);
        }
    };

    const handleMediaClick = (message) => {
        if (message.message_type === 'image' || message.message_type === 'video') {
            setMediaPreview({
                media: message.attachments.map(att => ({
                    url: att.url,
                    type: message.message_type,
                    name: att.name
                })),
                initialIndex: 0
            });
        }
    };

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

    const handleInfo = () => {
        setShowUserInfo(true);
    };

    // v2.0 Pin Handler - Restored
    const handlePin = async (message) => {
        try {
            if (isPinned(message.id)) {
                const pinnedMsg = pinnedMessages.find(p => p.message_id === message.id);
                if (pinnedMsg) {
                    await unpinMessage(pinnedMsg.id);
                }
            } else {
                if (!canPinMore) {
                    focusToast.error('You can only pin up to 3 messages');
                    return;
                }
                await pinMessage(message.id, currentUserId);
            }
        } catch (error) {
            console.error('Error pinning message:', error);
        }
    };

    const handleLocationSelect = async (location, isLive) => {
        try {
            await sendMessage('', {
                messageType: 'location',
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    address: location.address
                },
                isLive: isLive
            });
            setShowLocationPicker(false);
            focusToast.success(isLive ? 'Sharing live location for 1 hour' : 'Location shared');
        } catch (error) {
            console.error('Failed to share location:', error);
            focusToast.error('Failed to share location');
        }
    };

    const handleVideoNoteComplete = async (videoBlob, duration) => {
        try {
            const videoFile = new File([videoBlob], `video-note-${Date.now()}.webm`, { type: 'video/webm' });
            const videoUrl = await uploadFile(videoFile);

            await sendMessage('', {
                messageType: 'video_note',
                attachments: [{
                    url: videoUrl,
                    type: 'video/webm',
                    duration: duration
                }]
            });

            setShowVideoRecorder(false);
            focusToast.success('Video note sent');
        } catch (error) {
            console.error('Failed to send video note:', error);
            focusToast.error('Failed to send video note');
        }
    };

    const handlePollCreate = async (pollData) => {
        try {
            await sendMessage(pollData.question, {
                messageType: 'poll',
                poll: {
                    question: pollData.question,
                    options: pollData.options,
                    allowMultiple: pollData.allowMultiple || false
                }
            });
            setShowPollCreator(false);
            focusToast.success('Poll created');
        } catch (error) {
            console.error('Failed to create poll:', error);
            focusToast.error('Failed to create poll');
        }
    };

    const handleEventCreate = async (eventData) => {
        try {
            await sendMessage(eventData.title, {
                messageType: 'event',
                event: {
                    title: eventData.title,
                    description: eventData.description,
                    date: eventData.date,
                    time: eventData.time,
                    location: eventData.location
                }
            });
            setShowEventCreator(false);
            focusToast.success('Event created');
        } catch (error) {
            console.error('Failed to create event:', error);
            focusToast.error('Failed to create event');
        }
    };

    const handleJumpToMessage = (message) => {
        // Scroll to message in the list
        const messageElement = document.getElementById(`message-${message.id}`);
        if (messageElement) {
            messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            messageElement.classList.add('highlight');
            setTimeout(() => messageElement.classList.remove('highlight'), 2000);
        }
    };

    // 🚀 NEW: GIF selection handler
    const handleGifSelect = async (gifData) => {
        try {
            await sendMessage('', {
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
            focusToast.success('GIF sent!');
        } catch (error) {
            console.error('Failed to send GIF:', error);
            focusToast.error('Failed to send GIF');
        }
    };

    // 🚀 NEW: Share content handler
    const handleShareContent = (content, type) => {
        setContentToShare({ content, type });
        setShowShareModal(true);
    };

    const handleShareComplete = (count) => {
        focusToast.success(`Shared to ${count} conversation${count > 1 ? 's' : ''}!`);
        setShowShareModal(false);
        setContentToShare(null);
    };

    if (!otherUserId) {
        return (
            <div className={`${styles.chatPane} ${className}`}>
                <div className={styles.selectConversation}>
                    <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                        <path d="M15 99.68V25A10 10 0 0 1 25 15h70a10 10 0 0 1 10 10v50a10 10 0 0 1-10 10H40.42a10 10 0 0 0-7.81 3.75l-11.67 14.57A3 3 0 0 1 15 99.68z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        <circle cx="45" cy="50" r="5" fill="currentColor" />
                        <circle cx="60" cy="50" r="5" fill="currentColor" />
                        <circle cx="75" cy="50" r="5" fill="currentColor" />
                    </svg>
                    <h3 className={styles.selectTitle}>Select a conversation</h3>
                    <p className={styles.selectText}>Choose a conversation from the inbox to start messaging</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.chatPane} ${className}`}>
            <ChatHeader
                user={otherUser}
                onBack={onBack}
                onCall={handleCall}
                onVideoCall={handleVideoCall}
                onInfo={handleInfo}
                onSearch={() => setShowSearchPanel(true)}
                onShowPinned={() => {}}
                onSchedule={() => {}}
                onDisappearingMessages={() => {}}
                onReadReceipts={() => {}}
                onPINLock={() => {}}
            />

            {/* v2.0 Pinned Messages Banner */}
            <PinnedMessagesBanner
                conversationId={conversationId}
                groupId={null}
                currentUserId={currentUserId}
                onJumpToMessage={handleJumpToMessage}
            />

            <MessageList
                messages={allMessages}
                currentUserId={currentUserId}
                conversationId={conversationId}
                loading={otherUserData ? false : loading}
                isTyping={isTyping}
                typingUsers={typingUsers}
                typingUsername={otherUser?.username}
                onReply={handleReply}
                onReact={handleReact}
                // v2.0 Advanced features restored
                onDelete={handleDelete}
                onEdit={handleEdit}
                onStar={handleStar}
                onForward={handleForward}
                onPin={handlePin}
                onMediaClick={handleMediaClick}
            />

            {/* 🚀 NEW: Enhanced Message Input (with GIF, Stickers, etc.) */}
            {useEnhancedInput ? (
                <EnhancedMessageInput
                    conversationId={conversationId}
                    currentUserId={currentUserId}
                    replyTo={replyTo}
                    onClearReply={() => setReplyTo(null)}
                    onSendMessage={handleSend}
                    typingUsers={typingUsers}
                    onTypingChange={(isTyping) => {
                        if (isTyping) {
                            handleTyping();
                        } else {
                            stopTyping();
                        }
                    }}
                />
            ) : (
                /* Original MessageInputBar (fallback) */
                <MessageInputBar
                    onSend={handleSend}
                    onTyping={handleTyping}
                    onStopTyping={stopTyping}
                    replyTo={replyTo}
                    onCancelReply={() => setReplyTo(null)}
                    disabled={sending}
                    silentMode={silentMode}
                    onSilentModeToggle={() => setSilentMode(!silentMode)}
                    lastMessage={messages[messages.length - 1]}
                    onPollClick={() => setShowPollCreator(true)}
                    onLocationClick={() => setShowLocationPicker(true)}
                    onVideoNoteClick={() => setShowVideoRecorder(true)}
                    onEventClick={() => setShowEventCreator(true)}
                    onStickerClick={() => console.log('Sticker clicked')}
                    onGifClick={() => setShowGifPicker(true)}
                    isGroup={false}
                />
            )}

            {mediaPreview && (
                <MediaPreviewModal
                    media={mediaPreview.media}
                    initialIndex={mediaPreview.initialIndex}
                    onClose={() => setMediaPreview(null)}
                />
            )}

            {/* v2.0 Advanced Modals - Restored */}
            {forwardMessage && (
                <ForwardMessageModal
                    message={forwardMessage}
                    currentUserId={currentUserId}
                    onClose={() => setForwardMessage(null)}
                    onForward={handleForwardSubmit}
                />
            )}

            {editingMessage && (
                <EditMessageModal
                    message={editingMessage}
                    onClose={() => setEditingMessage(null)}
                    onSubmit={handleEditSubmit}
                    isLoading={isEditing}
                />
            )}

            {deletingMessage && (
                <DeleteMessageModal
                    message={deletingMessage}
                    currentUserId={currentUserId}
                    onClose={() => setDeletingMessage(null)}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            )}

            {showSearchPanel && (
                <MessageSearchPanel
                    conversationId={conversationId}
                    onClose={() => setShowSearchPanel(false)}
                    onSelectMessage={handleJumpToMessage}
                />
            )}

            {showPinned && (
                <PinnedMessagesPanel
                    conversationId={conversationId}
                    currentUserId={currentUserId}
                    otherUserId={otherUserId}
                    onClose={() => setShowPinned(false)}
                    onJumpToMessage={handleJumpToMessage}
                />
            )}

            {showUserInfo && (
                <UserInfoModal
                    user={otherUser}
                    onClose={() => setShowUserInfo(false)}
                />
            )}

            {/* v2.0 Location & Media Features */}
            {showLocationPicker && (
                <LocationPicker
                    onSelect={handleLocationSelect}
                    onClose={() => setShowLocationPicker(false)}
                />
            )}

            {showPollCreator && (
                <PollCreator
                    onSubmit={handlePollCreate}
                    onClose={() => setShowPollCreator(false)}
                />
            )}

            {showEventCreator && (
                <EventCreator
                    onSubmit={handleEventCreate}
                    onClose={() => setShowEventCreator(false)}
                />
            )}

            {showVideoRecorder && (
                <VideoNoteRecorder
                    onComplete={handleVideoNoteComplete}
                    onClose={() => setShowVideoRecorder(false)}
                />
            )}

            {/* 🚀 NEW: GIF Picker Modal */}
            {showGifPicker && (
                <GifPicker
                    onSelect={handleGifSelect}
                    onClose={() => setShowGifPicker(false)}
                />
            )}

            {/* 🚀 NEW: Share to Messages Modal */}
            {showShareModal && contentToShare && (
                <ShareToMessages
                    content={contentToShare.content}
                    contentType={contentToShare.type}
                    onClose={() => {
                        setShowShareModal(false);
                        setContentToShare(null);
                    }}
                    onShare={handleShareComplete}
                />
            )}

            {/* Active call window - Modern Social Media Style */}
            {activeCall && (
                <ModernCallWindow
                    callId={activeCall.id}
                    userId={user?.id}
                    otherUser={otherUser}
                    isInitiator={isInitiator}
                    audioOnly={callType === 'audio'}
                    onEndCall={endCall}
                />
            )}

        </div>
    );
};

export default React.memo(ChatPane, (prevProps, nextProps) => {
    // Only re-render if the conversation ID changes
    return prevProps.conversationId === nextProps.conversationId;
});

