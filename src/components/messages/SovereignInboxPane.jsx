// ═══════════════════════════════════════════════════════════════════════
// 🔐 SOVEREIGN INBOX PANE v2.0 — Premium Glassmorphism Inbox
// Filter Tabs · Pinned Chats · Search · Encryption Footer
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import styles from './SovereignWhisperV2.module.css';

// ─── INLINE SVG ICONS ────────────────────────────────────────────────
const Icons = {
    search: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
    ),
    compose: () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    ),
    lock: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    ),
    shield: () => (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" stroke="#0f0a1e" strokeWidth="2.5" fill="none" />
        </svg>
    ),
    pin: () => (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
            <path d="M12 2L12 22M5 12l7-7 7 7" />
        </svg>
    ),
    archive: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="21 8 21 21 3 21 3 8" />
            <rect x="1" y="3" width="22" height="5" />
            <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
    )
};

// ─── FILTER TABS ─────────────────────────────────────────────────────
const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'pinned', label: 'Pinned' },
    { key: 'archived', label: 'Archived' }
];

// ─── TRUST SHIELD BADGE ─────────────────────────────────────────────
const TrustBadge = () => (
    <span className={styles.trustBadge}><Icons.shield /></span>
);

// ─── THREAD ITEM ────────────────────────────────────────────────────
const ThreadItem = ({ chat, isActive, onClick }) => {
    const hasUnread = chat.unreadCount > 0;
    const isOnline = chat.user?.is_online;

    const timeStr = useMemo(() => {
        if (!chat.last_message_time) return '';
        try {
            return formatDistanceToNow(new Date(chat.last_message_time), { addSuffix: false });
        } catch { return ''; }
    }, [chat.last_message_time]);

    const wrapperClass = [
        styles.threadItem,
        isActive && styles.threadItemActive,
        hasUnread && !isActive && styles.threadItemUnread
    ].filter(Boolean).join(' ');

    return (
        <div className={wrapperClass} onClick={() => onClick(chat.id)} role="button" tabIndex={0}>
            {/* Avatar */}
            <div className={styles.avatarContainer}>
                {chat.user?.avatar_url ? (
                    <img
                        src={chat.user.avatar_url}
                        alt={chat.user?.username || 'User'}
                        className={`${styles.avatar} ${isOnline ? styles.avatarOnline : ''}`}
                    />
                ) : (
                    <div className={styles.avatarFallback}>
                        {(chat.user?.username?.[0] || '?').toUpperCase()}
                    </div>
                )}
                {isOnline && <div className={styles.onlineDot} />}
            </div>

            {/* Info */}
            <div className={styles.threadInfo}>
                <div className={styles.threadTop}>
                    <span className={styles.threadUsername}>
                        {chat.user?.full_name || chat.user?.username || 'Unknown'}
                        <TrustBadge />
                    </span>
                    <span className={`${styles.threadTime} ${hasUnread ? styles.threadTimeUnread : ''}`}>
                        {timeStr}
                    </span>
                </div>
                <div className={styles.threadBottom}>
                    <p className={`${styles.threadPreview} ${hasUnread ? styles.threadPreviewUnread : ''}`}>
                        {chat.last_message || 'No messages yet'}
                    </p>
                    {hasUnread && (
                        <span className={styles.unreadBadge}>
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── PINNED CHATS SECTION ───────────────────────────────────────────
const PinnedSection = ({ chats, activeChatId, onChatSelect }) => {
    if (!chats.length) return null;
    return (
        <div className={styles.pinnedSection}>
            <div className={styles.pinnedTitle}>
                📌 Pinned
            </div>
            <div className={styles.pinnedScroll}>
                {chats.map(chat => (
                    <div
                        key={chat.id}
                        className={styles.pinnedChip}
                        onClick={() => onChatSelect(chat.id)}
                    >
                        {chat.user?.avatar_url ? (
                            <img src={chat.user.avatar_url} alt="" className={styles.pinnedAvatar} />
                        ) : (
                            <div className={styles.avatarFallback} style={{ width: 28, height: 28, fontSize: 12 }}>
                                {(chat.user?.username?.[0] || '?').toUpperCase()}
                            </div>
                        )}
                        <span className={styles.pinnedName}>
                            {chat.user?.username || 'User'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN INBOX PANE COMPONENT
// ═══════════════════════════════════════════════════════════════════════
const SovereignInboxPane = ({
    chats = [],
    activeChatId,
    onChatSelect,
    onNewMessage,
    currentUserId,
    loading
}) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Simulated pinned/archived (use chat metadata when available)
    const pinnedChats = useMemo(() =>
        chats.filter(c => c.isPinned), [chats]
    );

    // Filter chats
    const filteredChats = useMemo(() => {
        let result = chats;

        // Apply filter tab
        switch (activeFilter) {
            case 'unread':
                result = result.filter(c => c.unreadCount > 0);
                break;
            case 'pinned':
                result = result.filter(c => c.isPinned);
                break;
            case 'archived':
                result = result.filter(c => c.isArchived);
                break;
            default:
                result = result.filter(c => !c.isArchived);
        }

        // Apply search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(c =>
                c.user?.username?.toLowerCase().includes(q) ||
                c.user?.full_name?.toLowerCase().includes(q) ||
                c.last_message?.toLowerCase().includes(q)
            );
        }

        return result;
    }, [chats, activeFilter, searchQuery]);

    return (
        <div className={styles.inboxPane}>
            {/* Header */}
            <div className={styles.inboxHeader}>
                <h1 className={styles.inboxTitle}>Messages</h1>
                <button className={styles.newMsgBtn} onClick={onNewMessage} title="New message">
                    <Icons.compose />
                </button>
            </div>

            {/* Search */}
            <div className={styles.searchContainer}>
                <div className={styles.searchBar}>
                    <span className={styles.searchIcon}><Icons.search /></span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                {FILTERS.map(f => (
                    <button
                        key={f.key}
                        className={`${styles.filterTab} ${activeFilter === f.key ? styles.filterTabActive : ''}`}
                        onClick={() => setActiveFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Pinned Chats (only on 'all' tab) */}
            {activeFilter === 'all' && pinnedChats.length > 0 && (
                <PinnedSection
                    chats={pinnedChats}
                    activeChatId={activeChatId}
                    onChatSelect={onChatSelect}
                />
            )}

            {/* Thread List */}
            <div className={styles.threadList}>
                {loading ? (
                    <div className={styles.loader}>
                        <div className={styles.spinner} />
                        <span className={styles.loaderText}>Loading conversations...</span>
                    </div>
                ) : filteredChats.length === 0 ? (
                    <div className={styles.emptyChat}>
                        <div className={styles.emptyIcon}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p className={styles.emptyTitle}>
                            {activeFilter === 'all' ? 'No conversations' :
                             activeFilter === 'unread' ? 'All caught up' :
                             activeFilter === 'pinned' ? 'No pinned chats' :
                             'No archived chats'}
                        </p>
                        <p className={styles.emptyText}>
                            {activeFilter === 'all'
                                ? 'Start a secure conversation with someone'
                                : 'Nothing to show here yet'}
                        </p>
                    </div>
                ) : (
                    filteredChats.map(chat => (
                        <ThreadItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === activeChatId}
                            onClick={onChatSelect}
                        />
                    ))
                )}
            </div>

            {/* Encryption Footer */}
            <div className={styles.encryptionFooter}>
                <Icons.lock />
                <span>End-to-End Encrypted · Signal Protocol</span>
            </div>
        </div>
    );
};

export default SovereignInboxPane;
