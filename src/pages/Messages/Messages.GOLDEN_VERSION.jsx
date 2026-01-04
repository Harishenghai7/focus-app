import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Messages.module.css';
import MainLayout from '../../components/layout/MainLayout';
import ChatList from '../../components/messages/ChatList';
import ChatPane from '../../components/messages/ChatPane';
import Loader from '../../components/ui/Loader';
import useMediaQuery from '../../hooks/useMediaQuery';
import { useInboxThreads } from '../../hooks/useInboxThreads';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

const Messages = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { threads, loading: threadsLoading } = useInboxThreads(user?.id);
    const [activeChatId, setActiveChatId] = useState(null);
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Handle URL param for active chat
    useEffect(() => {
        if (conversationId) {
            setActiveChatId(conversationId);
        }
    }, [conversationId]);

    // Map threads to the format expected by components (memoized to prevent re-renders)
    const formattedChats = React.useMemo(() => threads.map(thread => ({
        id: thread.conversationId,
        user: {
            id: thread.user?.id,
            username: thread.user?.username || 'Unknown',
            full_name: thread.user?.full_name,
            avatar_url: thread.user?.avatar_url,
            status: thread.user?.is_online ? 'online' : 'offline',
            is_online: thread.user?.is_online || false,
            last_seen: thread.user?.last_seen
        },
        last_message: thread.lastMessage?.content || 'No messages yet',
        last_message_time: thread.lastMessage?.created_at
            ? formatDistanceToNow(new Date(thread.lastMessage.created_at), { addSuffix: true })
            : '',
        unreadCount: thread.unreadCount || 0
    })), [threads]);

    // Synchronous Sticky Chat: Keep the previous valid chat object immediately if the new one is missing
    // This prevents the ChatPane from unmounting/remounting during renders
    const previousChatRef = React.useRef(null);

    // Find the active chat from the current threads
    const currentActiveChat = React.useMemo(() =>
        formattedChats.find(c => c.id === activeChatId),
        [formattedChats, activeChatId]
    );

    // If we have a current chat, update the ref
    if (currentActiveChat) {
        previousChatRef.current = currentActiveChat;
    }

    // Determine which chat to render: current, or fallback to previous if IDs match
    const activeChat = currentActiveChat ||
        (activeChatId && previousChatRef.current && previousChatRef.current.id === activeChatId
            ? previousChatRef.current
            : null);

    // Debug: Log activeChat state
    React.useEffect(() => {
        console.log('📋 activeChat changed:', {
            hasActiveChat: !!activeChat,
            activeChatId,
            hasCurrent: !!currentActiveChat,
            hasPrevious: !!previousChatRef.current
        });
    }, [activeChat, activeChatId, currentActiveChat]);

    const handleChatSelect = (id) => {
        setActiveChatId(id);
        navigate(`/messages/${id}`);
    };

    const handleBack = () => {
        setActiveChatId(null);
        navigate('/messages');
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                {threadsLoading && !activeChat ? (
                    <div className={styles.loaderContainer}>
                        <Loader size="lg" />
                    </div>
                ) : (
                    <div className={styles.content}>
                        <div className={`${styles.listContainer} ${activeChatId && isMobile ? styles.hidden : ''}`}>
                            <div className={styles.header}>
                                <h1 className={styles.title}>Messages</h1>
                            </div>
                            {formattedChats.length === 0 ? (
                                <div className={styles.emptyStateContainer}>
                                    <div className={styles.emptyStateIcon}>💬</div>
                                    <h2 className={styles.emptyStateTitle}>No messages yet</h2>
                                    <p className={styles.emptyStateMessage}>
                                        Start a conversation by visiting a profile and clicking "Message"!
                                    </p>
                                </div>
                            ) : (
                                <ChatList
                                    chats={formattedChats}
                                    activeChatId={activeChatId}
                                    onChatSelect={handleChatSelect}
                                />
                            )}
                        </div>

                        <div className={`${styles.windowContainer} ${!activeChatId && isMobile ? styles.hidden : ''}`}>
                            {activeChatId ? (
                                activeChat ? (
                                    <ChatPane
                                        key={activeChatId}
                                        currentUserId={user?.id}
                                        otherUserId={activeChat.user?.id}
                                        conversationId={activeChat.id}
                                        otherUserData={activeChat.user}
                                        onBack={handleBack}
                                    />
                                ) : (
                                    <div className={styles.loadingState}>
                                        <Loader size="lg" />
                                    </div>
                                )
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>💬</div>
                                    <p>Select a conversation from the inbox to start messaging</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default Messages;
