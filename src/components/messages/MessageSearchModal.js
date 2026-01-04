import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import useDebounce from '../../hooks/useDebounce';
import { formatDateDivider } from '../../utils/formatDateDivider';
import styles from './MessageSearchModal.module.css';

const MessageSearchModal = ({ currentUserId, onClose, onSelectMessage }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        sender: '',
        dateFrom: '',
        dateTo: '',
        mediaType: 'all' // all, image, video, audio, file
    });

    const debouncedSearch = useDebounce(searchQuery, 400);

    useEffect(() => {
        if (debouncedSearch) {
            searchMessages();
        } else {
            setResults([]);
        }
    }, [debouncedSearch, filters]);

    const searchMessages = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('messages')
                .select('*, sender:profiles!sender_id(*), receiver:profiles!receiver_id(*)')
                .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
                .ilike('content', `%${debouncedSearch}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            // Apply filters
            if (filters.sender) {
                query = query.or(`sender_id.eq.${filters.sender},receiver_id.eq.${filters.sender}`);
            }

            if (filters.dateFrom) {
                query = query.gte('created_at', new Date(filters.dateFrom).toISOString());
            }

            if (filters.dateTo) {
                query = query.lte('created_at', new Date(filters.dateTo).toISOString());
            }

            if (filters.mediaType !== 'all') {
                query = query.eq('message_type', filters.mediaType);
            }

            const { data, error } = await query;

            if (error) throw error;
            setResults(data || []);
        } catch (error) {
            console.error('Error searching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const highlightText = (text, query) => {
        if (!query || !text) return text;

        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === query.toLowerCase() ?
                <mark key={index} className={styles.highlight}>{part}</mark> :
                part
        );
    };

    const handleSelectMessage = (message) => {
        const otherUserId = message.sender_id === currentUserId ? message.receiver_id : message.sender_id;
        onSelectMessage(message, otherUserId);
        onClose();
    };

    const clearFilters = () => {
        setFilters({
            sender: '',
            dateFrom: '',
            dateTo: '',
            mediaType: 'all'
        });
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Search Messages</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.searchSection}>
                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search in messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className={styles.filters}>
                        <select
                            value={filters.mediaType}
                            onChange={(e) => setFilters(prev => ({ ...prev, mediaType: e.target.value }))}
                            className={styles.filterSelect}
                        >
                            <option value="all">All Types</option>
                            <option value="text">Text Only</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                            <option value="audio">Audio</option>
                            <option value="file">Files</option>
                        </select>

                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                            placeholder="From date"
                            className={styles.filterInput}
                        />

                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                            placeholder="To date"
                            className={styles.filterInput}
                        />

                        {(filters.dateFrom || filters.dateTo || filters.mediaType !== 'all') && (
                            <button className={styles.clearFilters} onClick={clearFilters}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                <div className={styles.results}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Searching...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className={styles.resultsList}>
                            <p className={styles.resultsCount}>
                                Found {results.length} {results.length === 1 ? 'message' : 'messages'}
                            </p>
                            {results.map((message) => {
                                const isOwn = message.sender_id === currentUserId;
                                const otherUser = isOwn ? message.receiver : message.sender;

                                return (
                                    <div
                                        key={message.id}
                                        className={styles.resultItem}
                                        onClick={() => handleSelectMessage(message)}
                                    >
                                        <div className={styles.resultHeader}>
                                            <div className={styles.userInfo}>
                                                <div className={styles.avatar}>
                                                    {otherUser?.avatar_url ? (
                                                        <img src={otherUser.avatar_url} alt={otherUser.username} />
                                                    ) : (
                                                        <div className={styles.avatarPlaceholder}>
                                                            {otherUser?.username?.[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className={styles.username}>
                                                        {isOwn ? 'You' : otherUser?.username}
                                                    </span>
                                                    <span className={styles.arrow}>→</span>
                                                    <span className={styles.username}>
                                                        {isOwn ? otherUser?.username : 'You'}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className={styles.date}>
                                                {formatDateDivider(message.created_at)}
                                            </span>
                                        </div>

                                        <div className={styles.messageContent}>
                                            {message.message_type === 'image' && (
                                                <span className={styles.mediaTag}>📷 Image</span>
                                            )}
                                            {message.message_type === 'video' && (
                                                <span className={styles.mediaTag}>🎥 Video</span>
                                            )}
                                            {message.message_type === 'audio' && (
                                                <span className={styles.mediaTag}>🎵 Audio</span>
                                            )}
                                            {message.message_type === 'file' && (
                                                <span className={styles.mediaTag}>📎 File</span>
                                            )}
                                            <p>{highlightText(message.content, searchQuery)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : searchQuery ? (
                        <div className={styles.empty}>
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p>No messages found</p>
                            <span>Try different keywords or adjust filters</span>
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <p>Search your messages</p>
                            <span>Enter keywords to search across all conversations</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageSearchModal;
