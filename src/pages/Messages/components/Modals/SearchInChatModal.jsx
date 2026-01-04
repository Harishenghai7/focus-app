/* ═══════════════════════════════════════════════════════════════════════
   SEARCH IN CHAT MODAL - Search messages within conversation
   Phase 4: Advanced Features
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { formatMessageTime } from '../../utils/messageHelpers';
import styles from './SearchInChatModal.module.css';

const SearchInChatModal = ({ onClose, conversationId, onSelectMessage }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setResults([]);
            return;
        }

        const searchMessages = async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .eq('deleted', false)
                    .ilike('content', `%${searchQuery}%`)
                    .order('created_at', { ascending: false })
                    .limit(50);

                setResults(data || []);
            } catch (error) {
                console.error('Error searching messages:', error);
            } finally {
                setLoading(false);
            }
        };

        const debounce = setTimeout(searchMessages, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, conversationId]);

    const handleSelectMessage = (message) => {
        onSelectMessage(message);
        onClose();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Search Messages</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                <div className={styles.searchContainer}>
                    <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                        <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search in conversation..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                        autoFocus
                    />
                </div>

                <div className={styles.results}>
                    {loading ? (
                        <div className={styles.loading}>Searching...</div>
                    ) : results.length === 0 ? (
                        <div className={styles.empty}>
                            {searchQuery.trim().length < 2
                                ? 'Type at least 2 characters to search'
                                : 'No messages found'}
                        </div>
                    ) : (
                        results.map(message => (
                            <div
                                key={message.id}
                                className={styles.resultCard}
                                onClick={() => handleSelectMessage(message)}
                            >
                                <div className={styles.messageContent}>
                                    {message.content}
                                </div>
                                <div className={styles.messageTime}>
                                    {formatMessageTime(message.created_at)}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchInChatModal;
