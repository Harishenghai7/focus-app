import React, { useState, useEffect } from 'react';
import { useMessageSearch } from '../../hooks/useMessageSearch';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../ui/Avatar';
import styles from './MessageSearchPanel.module.css';

const MessageSearchPanel = ({ conversationId, onClose, onSelectMessage }) => {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const { searching, results, searchMessages, searchByMediaType, clearResults } = useMessageSearch();

    useEffect(() => {
        if (query.length >= 2) {
            if (activeFilter === 'all') {
                searchMessages(query, { conversationId });
            } else {
                searchByMediaType(activeFilter, conversationId);
            }
        } else {
            clearResults();
        }
    }, [query, activeFilter, conversationId]);

    const filters = [
        { id: 'all', label: 'All', icon: '💬' },
        { id: 'image', label: 'Photos', icon: '📷' },
        { id: 'video', label: 'Videos', icon: '🎥' },
        { id: 'audio', label: 'Audio', icon: '🎵' },
        { id: 'file', label: 'Files', icon: '📎' }
    ];

    const handleSelectMessage = (message) => {
        onSelectMessage?.(message);
        onClose();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <h2>Search Messages</h2>
                <button className={styles.closeButton} onClick={onClose}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            <div className={styles.searchBar}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <input
                    type="text"
                    placeholder="Search in conversation..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
                {query && (
                    <button className={styles.clearButton} onClick={() => setQuery('')}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                )}
            </div>

            <div className={styles.filters}>
                {filters.map(filter => (
                    <button
                        key={filter.id}
                        className={`${styles.filterButton} ${activeFilter === filter.id ? styles.active : ''}`}
                        onClick={() => setActiveFilter(filter.id)}
                    >
                        <span className={styles.filterIcon}>{filter.icon}</span>
                        <span className={styles.filterLabel}>{filter.label}</span>
                    </button>
                ))}
            </div>

            <div className={styles.results}>
                {searching ? (
                    <div className={styles.loading}>
                        <div className={styles.spinner}></div>
                        <p>Searching...</p>
                    </div>
                ) : results.length > 0 ? (
                    <>
                        <div className={styles.resultCount}>
                            {results.length} {results.length === 1 ? 'result' : 'results'}
                        </div>
                        {results.map(message => (
                            <div
                                key={message.id}
                                className={styles.resultItem}
                                onClick={() => handleSelectMessage(message)}
                            >
                                <Avatar
                                    src={message.sender?.avatar_url}
                                    alt={message.sender?.username}
                                    size="sm"
                                    fallback={message.sender?.username?.[0]?.toUpperCase()}
                                />
                                <div className={styles.resultContent}>
                                    <div className={styles.resultHeader}>
                                        <span className={styles.resultSender}>
                                            {message.sender?.full_name || message.sender?.username}
                                        </span>
                                        <span className={styles.resultDate}>
                                            {formatDate(message.created_at)}
                                        </span>
                                    </div>
                                    <div className={styles.resultText}>
                                        {message.message_type === 'text' ? (
                                            message.content
                                        ) : (
                                            <span className={styles.mediaType}>
                                                {message.message_type === 'image' && '📷 Photo'}
                                                {message.message_type === 'video' && '🎥 Video'}
                                                {message.message_type === 'audio' && '🎵 Audio'}
                                                {message.message_type === 'file' && '📎 File'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                ) : query.length >= 2 ? (
                    <div className={styles.empty}>
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                            <path d="M32 20v16M32 44h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p>No messages found</p>
                        <span>Try a different search term</span>
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <circle cx="28" cy="28" r="16" stroke="currentColor" strokeWidth="2" />
                            <path d="M42 42l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <p>Search messages</p>
                        <span>Type at least 2 characters to search</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageSearchPanel;
