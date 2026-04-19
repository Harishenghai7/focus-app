import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PenSquare, Search } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFocusIdentity } from '../../context/FocusIdentityContext';
import { useInboxThreads } from '../../hooks/useInboxThreads';
import { usePresence } from './hooks/usePresence';
import { normalizeHydratedProfile } from '../../utils/identityHydration';
import ChatPane from '../../components/messages/ChatPane';
import NewMessageModal from './components/Modals/NewMessageModal';
import MainLayout from '../../components/layout/MainLayout';
import UserAvatar from '../../components/ui/Avatar';
import focuslyImage from '../../assets/focusly/focusly_reference.png';
import styles from './CompleteMessages.module.css';

const formatTime = (ts) => {
    if (!ts) return '';
    const now = new Date();
    const d = new Date(ts);
    const diffM = Math.floor((now - d) / 60000);
    const diffH = Math.floor(diffM / 60);
    const diffD = Math.floor(diffH / 24);
    if (diffM < 1) return 'now';
    if (diffM < 60) return `${diffM}m`;
    if (diffH < 24) return `${diffH}h`;
    if (diffD < 7) return `${diffD}d`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const SKELETON_COUNT = 6;

const CompleteMessages = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { userId } = useFocusIdentity();
    const { threads, loading, error: threadsError, refetch: refetchThreads } = useInboxThreads(userId);
    const { getUserPresence, fetchUserPresence } = usePresence(userId);

    const [searchQuery, setSearchQuery] = useState('');
    const [showNewMessage, setShowNewMessage] = useState(false);

    const filteredThreads = threads.filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            t.user?.username?.toLowerCase().includes(q) ||
            t.user?.full_name?.toLowerCase().includes(q)
        );
    });

    React.useEffect(() => {
        const ids = threads.map((t) => t.user?.id).filter(Boolean);
        if (ids.length > 0) {
            fetchUserPresence(ids);
        }
    }, [threads, fetchUserPresence]);

    const handleThreadClick = (thread) => {
        navigate(`/messages/${thread.conversationId}`);
    };

    const activeConversation = conversationId
        ? threads.find(t => t.conversationId === conversationId)
        : null;

    return (
        <MainLayout>
            <div className={styles.container}>
                {/* ── Messages Sidebar ──────────────────────── */}
                <motion.div
                    layout
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                    className={styles.messagesSidebar}
                >
                    {/* Header */}
                    <div className={styles.header}>
                        <h1 className={styles.title}>Messages</h1>
                        <button
                            className={styles.composeBtn}
                            onClick={() => setShowNewMessage(true)}
                            aria-label="New message"
                        >
                            <PenSquare size={19} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className={styles.searchWrapper}>
                        <div className={styles.searchBox}>
                            <Search size={16} className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Search messages…"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                        </div>
                    </div>

                    {/* Thread list */}
                    <div className={styles.conversationsList}>
                        {threadsError && (
                            <div className={styles.threadError} role="alert">
                                <span>Could not load conversations.</span>
                                <button type="button" onClick={() => refetchThreads?.()}>
                                    Retry
                                </button>
                            </div>
                        )}
                        {loading ? (
                            Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                                <div key={i} className={styles.skeletonItem}>
                                    <div className={styles.skeletonAv} />
                                    <div className={styles.skeletonInfo}>
                                        <div className={styles.skeletonLn} style={{ width: '50%' }} />
                                        <div className={styles.skeletonLn} style={{ width: '75%' }} />
                                    </div>
                                </div>
                            ))
                        ) : filteredThreads.length === 0 ? (
                            <div className={styles.emptyList}>
                                {searchQuery ? (
                                    <p className={styles.emptyText}>No results for "{searchQuery}"</p>
                                ) : (
                                    <div style={{ textAlign: 'center' }}>
                                        <p className={styles.emptyText}>No conversations yet</p>
                                        <p className={styles.emptyHint}>Start by sending someone a message ✨</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            filteredThreads.map(thread => {
                                const isActive = conversationId === thread.conversationId;
                                const hasUnread = thread.unreadCount > 0;
                                const hydratedUser = normalizeHydratedProfile(thread.user, thread.user?.id);

                                return (
                                    <div
                                        key={thread.conversationId}
                                        className={`${styles.conversationItem} ${isActive ? styles.active : ''}`}
                                        onClick={() => handleThreadClick(thread)}
                                    >
                                        <div className={styles.avatarContainer}>
                                            <UserAvatar
                                                src={hydratedUser?.avatar_url}
                                                username={hydratedUser?.username}
                                                fullName={hydratedUser?.full_name}
                                                size="md"
                                                online={getUserPresence(thread.user?.id).isOnline || thread.user?.is_online}
                                            />
                                        </div>

                                        <div className={styles.conversationInfo}>
                                            <div className={styles.conversationHeader}>
                                                <span className={styles.conversationName}>
                                                    {hydratedUser?.full_name || hydratedUser?.username || 'Focusly User'}
                                                </span>
                                                <span className={styles.timestamp}>
                                                    {formatTime(thread.lastMessage?.created_at)}
                                                </span>
                                            </div>
                                            <div className={styles.lastMessageRow}>
                                                <span className={`${styles.lastMessage} ${hasUnread ? styles.unread : ''}`}>
                                                    {thread.lastMessage?.content || 'No messages yet'}
                                                </span>
                                                {hasUnread && (
                                                    <span className={styles.unreadBadge}>
                                                        {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>

                {/* ── Chat Window ───────────────────────────── */}
                <div className={styles.chatWindow}>
                    <AnimatePresence mode="wait">
                        {conversationId && activeConversation ? (
                            <motion.div
                                key={conversationId}
                                initial={{ opacity: 0, x: 18 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -12 }}
                                transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                                className={styles.chatTransition}
                            >
                                <ChatPane
                                    currentUserId={userId}
                                    otherUserId={activeConversation.user?.id}
                                    conversationId={conversationId}
                                    otherUserData={activeConversation.user}
                                    onBack={() => navigate('/messages')}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="messages-empty"
                                initial={{ opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className={styles.emptyState}
                            >
                            <div className={styles.emptyContent}>
                                <div className={styles.mascotContainer}>
                                    <img
                                        src={focuslyImage}
                                        alt="Focusly"
                                        className={styles.mascotImage}
                                        onError={e => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'block';
                                        }}
                                    />
                                    <div className={styles.mascotFallback}>
                                        <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
                                            <circle cx="45" cy="45" r="43" stroke="url(#g1)" strokeWidth="2.5" />
                                            <path d="M45 20L58 45L45 70L32 45L45 20Z" fill="none" stroke="url(#g1)" strokeWidth="2.5" />
                                            <defs>
                                                <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#7C3AED" />
                                                    <stop offset="100%" stopColor="#A78BFA" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                    </div>
                                </div>
                                <h2 className={styles.emptyTitle}>Your messages</h2>
                                <p className={styles.emptyDesc}>
                                    Connect with friends and stay focused on what matters. Start a conversation! ✨
                                </p>
                                <button
                                    className={styles.newMessageBtn}
                                    onClick={() => setShowNewMessage(true)}
                                >
                                    <PenSquare size={18} />
                                    New Message
                                </button>
                            </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {showNewMessage && (
                <NewMessageModal
                    onClose={() => setShowNewMessage(false)}
                    currentUserId={userId}
                />
            )}
        </MainLayout>
    );
};

export default CompleteMessages;
