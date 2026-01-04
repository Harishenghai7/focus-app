// ═══════════════════════════════════════════════════════════════════════
// FOCUS MESSAGES - COMPLETE LAYOUT WITH MAIN SIDEBAR
// ═══════════════════════════════════════════════════════════════════════
// Layout: Main Sidebar | Messages Sidebar | Chat Window
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInboxThreads } from '../../hooks/useInboxThreads';
import ChatPane from '../../components/messages/ChatPane';
import NewMessageModal from './components/Modals/NewMessageModal';
import MainLayout from '../../components/layout/MainLayout';
import focuslyImage from '../../assets/focusly/focusly_reference.png';
import styles from './CompleteMessages.module.css';

const CompleteMessages = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { threads, loading } = useInboxThreads(user?.id);

    const [activeTab, setActiveTab] = useState('primary');
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewMessage, setShowNewMessage] = useState(false);

    // Filter threads based on active tab and search
    const filteredThreads = threads.filter(thread => {
        if (searchQuery) {
            const username = thread.user?.username?.toLowerCase() || '';
            const fullName = thread.user?.full_name?.toLowerCase() || '';
            const query = searchQuery.toLowerCase();
            if (!username.includes(query) && !fullName.includes(query)) {
                return false;
            }
        }
        if (activeTab === 'requests') {
            return thread.isRequest;
        }
        return true;
    });

    // Handle conversation selection
    const handleConversationClick = (thread) => {
        navigate(`/messages/${thread.conversationId}`);
    };

    // Get active conversation data
    const activeConversation = conversationId
        ? threads.find(t => t.conversationId === conversationId)
        : null;

    return (
        <MainLayout>
            <div className={styles.container}>
                {/* MESSAGES SIDEBAR (Conversations List) - Main sidebar is global */}
                <div className={styles.messagesSidebar}>
                    {/* Header - Clean, No Attachment Button */}
                    <div className={styles.header}>
                        <h1 className={styles.title}>Messages</h1>
                    </div>

                    {/* Tabs removed - Not copying Instagram */}

                    {/* Search */}
                    <div className={styles.searchContainer}>
                        <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search messages"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    {/* Conversations List */}
                    <div className={styles.conversationsList}>
                        {filteredThreads.length === 0 ? (
                            <div className={styles.emptyList}>
                                <p>No conversations yet</p>
                            </div>
                        ) : (
                            filteredThreads.map(thread => (
                                <div
                                    key={thread.conversationId}
                                    className={`${styles.conversationItem} ${conversationId === thread.conversationId ? styles.active : ''
                                        }`}
                                    onClick={() => handleConversationClick(thread)}
                                >
                                    <div className={styles.avatarContainer}>
                                        <img
                                            src={thread.user?.avatar_url || '/default-avatar.png'}
                                            alt={thread.user?.username}
                                            className={styles.avatar}
                                        />
                                        {thread.user?.is_online && (
                                            <div className={styles.onlineDot}></div>
                                        )}
                                    </div>
                                    <div className={styles.conversationInfo}>
                                        <div className={styles.conversationHeader}>
                                            <span className={styles.conversationName}>
                                                {thread.user?.username || 'Unknown'}
                                            </span>
                                            <span className={styles.timestamp}>
                                                {formatTime(thread.lastMessage?.created_at)}
                                            </span>
                                        </div>
                                        <div className={styles.lastMessageRow}>
                                            <span className={`${styles.lastMessage} ${thread.unreadCount > 0 ? styles.unread : ''
                                                }`}>
                                                {thread.lastMessage?.content || 'No messages yet'}
                                            </span>
                                            {thread.unreadCount > 0 && (
                                                <span className={styles.unreadBadge}>
                                                    {thread.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* CHAT WINDOW OR EMPTY STATE */}
                <div className={styles.chatWindow}>
                    {conversationId && activeConversation ? (
                        <ChatPane
                            currentUserId={user?.id}
                            otherUserId={activeConversation.user?.id}
                            conversationId={conversationId}
                            otherUserData={activeConversation.user}
                            onBack={() => navigate('/messages')}
                        />
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyContent}>
                                {/* Focusly Mascot Image */}
                                <div className={styles.mascotContainer}>
                                    <img
                                        src={focuslyImage}
                                        alt="Focusly"
                                        className={styles.mascotImage}
                                        onError={(e) => {
                                            // Fallback to SVG icon if image not found
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <svg
                                        className={styles.fallbackIcon}
                                        style={{ display: 'none' }}
                                        width="120"
                                        height="120"
                                        viewBox="0 0 120 120"
                                        fill="none"
                                    >
                                        <circle cx="60" cy="60" r="58" stroke="url(#gradient)" strokeWidth="3" />
                                        <path d="M60 30L75 60L60 90L45 60L60 30Z" fill="none" stroke="url(#gradient)" strokeWidth="3" />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#8B5CF6" />
                                                <stop offset="50%" stopColor="#A78BFA" />
                                                <stop offset="100%" stopColor="#C4B5FD" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>

                                <h2 className={styles.emptyTitle}>Your messages</h2>
                                <p className={styles.emptyText}>
                                    Connect with friends, share moments, and stay focused on what matters.
                                    Start a conversation and let the magic begin! ✨
                                </p>
                                <button className={styles.sendMessageBtn} onClick={() => setShowNewMessage(true)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="22" y1="2" x2="11" y2="13" />
                                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                    </svg>
                                    Send message
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Message Modal */}
                {showNewMessage && (
                    <NewMessageModal
                        onClose={() => setShowNewMessage(false)}
                        currentUserId={user?.id}
                    />
                )}
            </div>
        </MainLayout>
    );
};

// Helper function to format timestamp
const formatTime = (timestamp) => {
    if (!timestamp) return '';

    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffMs = now - messageTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / 604800000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}w`;
};

export default CompleteMessages;
