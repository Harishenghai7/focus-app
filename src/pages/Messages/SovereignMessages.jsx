// ═══════════════════════════════════════════════════════════════════════
// 🔐 SOVEREIGN MESSAGES - End-to-End Encrypted Messaging Page
// Sovereign Whisper Implementation
// ═══════════════════════════════════════════════════════════════════════
// ⚠️ LAUNCH-READY: May 8, 2026
// Status: ✅ ENCRYPTION ENABLED - GOLDEN VERSION
// 
// Features:
// - AES-GCM 256-bit end-to-end encryption
// - ECDH key exchange
// - Royal Lavender glassmorphism UI
// - Trust Shield verification badges
// - Real-time encrypted messaging
// - Offline queue with secure sync
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import SovereignInboxPane from '../../components/messages/SovereignInboxPane';
import SovereignChatPane from '../../components/messages/SovereignChatPane';
import { useInboxThreads } from '../../hooks/useInboxThreads';
import { useAuth } from '../../hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import styles from './Messages.module.css';

const SovereignMessages = () => {
    // 🔐 SOVEREIGN WHISPER v2.0 - Verify this logs in console

    
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { threads, loading: threadsLoading } = useInboxThreads(user?.id);
    const [activeChatId, setActiveChatId] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    // Handle responsive layout
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle URL param for active chat
    useEffect(() => {
        if (conversationId) {
            setActiveChatId(conversationId);
        }
    }, [conversationId]);

    // Map threads to the format expected by components
    const formattedChats = useMemo(() => threads.map(thread => ({
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

    // Synchronous Sticky Chat: Keep the previous valid chat object
    const previousChatRef = React.useRef(null);

    // Find the active chat from the current threads
    const currentActiveChat = useMemo(() =>
        formattedChats.find(c => c.id === activeChatId),
        [formattedChats, activeChatId]
    );

    // If we have a current chat, update the ref
    if (currentActiveChat) {
        previousChatRef.current = currentActiveChat;
    }

    // Determine which chat to render
    const activeChat = currentActiveChat ||
        (activeChatId && previousChatRef.current && previousChatRef.current.id === activeChatId
            ? previousChatRef.current
            : null);

    const handleChatSelect = (id) => {
        setActiveChatId(id);
        navigate(`/messages/${id}`);
    };

    const handleBack = () => {
        setActiveChatId(null);
        navigate('/messages');
    };

    const handleNewMessage = () => {
        // Navigate to new message modal or user search
        navigate('/messages/new');
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                {threadsLoading && !activeChat ? (
                    <div className={styles.loaderContainer}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid rgba(126, 87, 194, 0.2)',
                            borderTopColor: '#7E57C2',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }} />
                    </div>
                ) : (
                    <div className={styles.content}>
                        {/* Inbox Pane */}
                        <div 
                            className={`${styles.listContainer} ${activeChatId && isMobile ? styles.hidden : ''}`}
                            style={{
                                background: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A2E 100%)',
                                borderRight: '1px solid rgba(126, 87, 194, 0.2)'
                            }}
                        >
                            <SovereignInboxPane
                                chats={formattedChats}
                                activeChatId={activeChatId}
                                onChatSelect={handleChatSelect}
                                onNewMessage={handleNewMessage}
                                currentUserId={user?.id}
                                loading={threadsLoading}
                            />
                        </div>

                        {/* Chat Pane */}
                        <div 
                            className={`${styles.windowContainer} ${!activeChatId && isMobile ? styles.hidden : ''}`}
                            style={{
                                background: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A2E 100%)'
                            }}
                        >
                            {activeChatId ? (
                                activeChat ? (
                                    <SovereignChatPane
                                        key={activeChatId}
                                        currentUserId={user?.id}
                                        otherUserId={activeChat.user?.id}
                                        conversationId={activeChat.id}
                                        otherUserData={activeChat.user}
                                        onBack={handleBack}
                                    />
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        flexDirection: 'column',
                                        gap: '16px'
                                    }}>
                                        <div style={{
                                            width: '48px',
                                            height: '48px',
                                            border: '4px solid rgba(126, 87, 194, 0.2)',
                                            borderTopColor: '#7E57C2',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite'
                                        }} />
                                        <span style={{ color: 'rgba(232, 232, 240, 0.6)' }}>
                                            Loading conversation...
                                        </span>
                                    </div>
                                )
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    color: 'rgba(232, 232, 240, 0.5)',
                                    textAlign: 'center',
                                    padding: '40px'
                                }}>
                                    <div style={{
                                        width: '120px',
                                        height: '120px',
                                        marginBottom: '24px',
                                        opacity: 0.3,
                                        color: '#B39DDB'
                                    }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            <circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" />
                                            <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
                                            <circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" />
                                        </svg>
                                    </div>
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: 300,
                                        color: '#E8E8F0',
                                        margin: '0 0 8px 0'
                                    }}>
                                        Select a conversation
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: 'rgba(232, 232, 240, 0.5)',
                                        maxWidth: '300px'
                                    }}>
                                        Choose a conversation from the inbox to start your encrypted messaging experience
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

// Add global styles for spin animation
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
if (!document.head.querySelector('[data-sovereign-spin]')) {
    styleSheet.setAttribute('data-sovereign-spin', 'true');
    document.head.appendChild(styleSheet);
}

export default SovereignMessages;
