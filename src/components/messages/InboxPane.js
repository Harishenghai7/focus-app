import React, { useState, useMemo } from 'react';
import ThreadSearchBar from './ThreadSearchBar';
import ThreadItem from './ThreadItem';
import NewMessageButton from './NewMessageButton';
import LoadingSkeleton from '../shared/LoadingSkeleton';
import styles from './InboxPane.module.css';

const InboxPane = ({
    threads,
    loading,
    activeThreadId,
    onThreadSelect,
    onNewMessage,
    className = ''
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredThreads = useMemo(() => {
        if (!searchQuery.trim()) return threads;

        const query = searchQuery.toLowerCase();
        return threads.filter(thread => {
            const username = thread.user?.username?.toLowerCase() || '';
            const fullName = thread.user?.full_name?.toLowerCase() || '';
            const lastMessage = thread.lastMessage?.content?.toLowerCase() || '';

            return username.includes(query) ||
                fullName.includes(query) ||
                lastMessage.includes(query);
        });
    }, [threads, searchQuery]);

    const totalUnread = useMemo(() => {
        return threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
    }, [threads]);

    return (
        <div className={`${styles.inboxPane} ${className}`}>
            <div className={styles.inboxHeader}>
                <div className={styles.headerTop}>
                    <h2 className={styles.title}>Messages</h2>
                    {totalUnread > 0 && (
                        <span className={styles.totalUnread}>
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                    )}
                </div>
                <div className={styles.newMessageWrapper}>
                    <NewMessageButton onClick={onNewMessage} />
                </div>
            </div>

            <ThreadSearchBar
                onSearch={setSearchQuery}
                placeholder="Search conversations..."
            />

            <div className={styles.threadsList}>
                {loading ? (
                    <div className={styles.loadingContainer}>
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className={styles.threadSkeleton}>
                                <LoadingSkeleton width={56} height={56} circle />
                                <div className={styles.skeletonContent}>
                                    <LoadingSkeleton width="60%" height={16} />
                                    <LoadingSkeleton width="80%" height={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <path d="M8 53.16V13.33A5.33 5.33 0 0 1 13.33 8h37.34A5.33 5.33 0 0 1 56 13.33v26.67a5.33 5.33 0 0 1-5.33 5.33H21.23a5.33 5.33 0 0 0-4.16 2l-6.22 7.77A1.6 1.6 0 0 1 8 53.16z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        <p className={styles.emptyText}>
                            {searchQuery ? 'No conversations found' : 'No messages yet'}
                        </p>
                        <p className={styles.emptySubtext}>
                            {searchQuery ? 'Try a different search term' : 'Start a conversation to get started'}
                        </p>
                    </div>
                ) : (
                    filteredThreads.map(thread => (
                        <ThreadItem
                            key={thread.id}
                            thread={thread}
                            isActive={thread.id === activeThreadId}
                            onClick={() => onThreadSelect(thread)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default InboxPane;
