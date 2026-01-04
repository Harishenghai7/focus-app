// ═══════════════════════════════════════════════════════════════════════
// FOCUS MESSAGES - INSTAGRAM-INSPIRED LAYOUT (Lavender Theme)
// ═══════════════════════════════════════════════════════════════════════
// Three-panel layout: Sidebar | Conversations | Chat Window
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useInboxThreads } from '../../hooks/useInboxThreads';
import ChatPane from '../../components/messages/ChatPane';
import NewMessageModal from './components/Modals/NewMessageModal';
import styles from './InstagramMessages.module.css';

const InstagramMessages = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { threads, loading } = useInboxThreads(user?.id);

    const [activeTab, setActiveTab] = useState('primary'); // primary, general, requests
    const [searchQuery, setSearchQuery] = useState('');
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [selectedConversation, setSelectedConversation] = useState(null);

    // Filter threads based on active tab
    const filteredThreads = threads.filter(thread => {
        // Search filter
        if (searchQuery) {
            const username = thread.user?.username?.toLowerCase() || '';
            const fullName = thread.user?.full_name?.toLowerCase() || '';
            const query = searchQuery.toLowerCase();
            if (!username.includes(query) && !fullName.includes(query)) {
                return false;
            }
        }

        // Tab filter (you can customize this based on your data structure)
        if (activeTab === 'requests') {
            return thread.isRequest; // Add this field to your data
        }
        return true;
    });

    // Handle conversation selection
    const handleConversationClick = (thread) => {
        setSelectedConversation(thread);
        navigate(`/messages/${thread.conversationId}`);
    };

    // Handle new message
    const handleNewMessage = () => {
        setShowNewMessage(true);
    };

    // Get active conversation data
    const activeConversation = conversationId
        ? threads.find(t => t.conversationId === conversationId)
        : null;

    return (
        <div className={styles.messagesContainer}>
            {/* LEFT SIDEBAR - Conversations List */}
            <div className={styles.sidebar}>
                {/* Header with username and new message button */}
                <div className={styles.sidebarHeader}>
                    <button className={styles.usernameButton}>
                        <span className={styles.username}>{user?.username || 'Loading...'}</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    <button className={styles.newMessageBtn} onClick={handleNewMessage}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tab} ${activeTab === 'primary' ? styles.active : ''}`}
                        onClick={() => setActiveTab('primary')}
                    >
                        Primary
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
                        onClick={() => setActiveTab('general')}
                    >
                        General
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'requests' ? styles.active : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Requests
                    </button>
                </div>

                {/* Search Bar */}
                <div className={styles.searchContainer}>
                    <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Story Circles (Active Conversations) */}
                {!searchQuery && (
                    <div className={styles.storiesContainer}>
                        {threads.slice(0, 6).map(thread => (
                            <div
                                key={thread.conversationId}
                                className={styles.storyCircle}
                                onClick={() => handleConversationClick(thread)}
                            >
                                <div className={styles.storyRing}>
                                    <img
                                        src={thread.user?.avatar_url || '/default-avatar.png'}
                                        alt={thread.user?.username}
                                        className={styles.storyAvatar}
                                    />
                                </div>
                                <span className={styles.storyUsername}>
                                    {thread.user?.username?.slice(0, 8) || 'User'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Conversations List */}
                <div className={styles.conversationsList}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.spinner}></div>
                        </div>
                    ) : filteredThreads.length === 0 ? (
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

            {/* RIGHT PANEL - Chat Window or Empty State */}
            <div className={styles.mainPanel}>
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
                        <div className={styles.emptyIcon}>
                            <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                                <circle cx="48" cy="48" r="47" stroke="currentColor" strokeWidth="2" />
                                <path d="M48 28L62 48L48 68L34 48L48 28Z" fill="none" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        </div>
                        <h2 className={styles.emptyTitle}>Your messages</h2>
                        <p className={styles.emptyText}>Send a message to start a chat.</p>
                        <button className={styles.sendMessageBtn} onClick={handleNewMessage}>
                            Send message
                        </button>
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

export default InstagramMessages;
