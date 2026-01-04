import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MessageBubble from './MessageBubble';
import { formatDateDivider } from '../../utils/formatDateDivider';
import styles from './FavoritesPanel.module.css';

const FavoritesPanel = ({ userId, onClose }) => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, images, videos, links, files

    useEffect(() => {
        fetchFavorites();
    }, [userId, filter]);

    const fetchFavorites = async () => {
        if (!userId) return;

        setLoading(true);
        try {
            let query = supabase
                .from('messages')
                .select('*, sender:profiles!sender_id(*)')
                .eq('is_starred', true)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (filter === 'images') {
                query = query.eq('message_type', 'image');
            } else if (filter === 'videos') {
                query = query.eq('message_type', 'video');
            } else if (filter === 'files') {
                query = query.eq('message_type', 'file');
            } else if (filter === 'links') {
                query = query.like('content', '%http%');
            }

            const { data, error } = await query;

            if (error) throw error;
            setFavorites(data || []);
        } catch (error) {
            console.error('Error fetching favorites:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnstar = async (messageId) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_starred: false })
                .eq('id', messageId);

            if (error) throw error;

            // Remove from local state
            setFavorites(prev => prev.filter(msg => msg.id !== messageId));
        } catch (error) {
            console.error('Error unstarring message:', error);
        }
    };

    const groupByDate = (messages) => {
        const groups = {};
        messages.forEach(message => {
            const date = formatDateDivider(message.created_at);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });
        return groups;
    };

    const groupedFavorites = groupByDate(favorites);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        <h2>Starred Messages</h2>
                    </div>

                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                {/* Filters */}
                <div className={styles.filters}>
                    <button
                        className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'images' ? styles.active : ''}`}
                        onClick={() => setFilter('images')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Photos
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'videos' ? styles.active : ''}`}
                        onClick={() => setFilter('videos')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M23 7l-7 5 7 5V7z" fill="currentColor" />
                            <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Videos
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'files' ? styles.active : ''}`}
                        onClick={() => setFilter('files')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Files
                    </button>
                    <button
                        className={`${styles.filterButton} ${filter === 'links' ? styles.active : ''}`}
                        onClick={() => setFilter('links')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        Links
                    </button>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading starred messages...</p>
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className={styles.empty}>
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <h3>No starred messages</h3>
                            <p>Star important messages to find them easily later</p>
                        </div>
                    ) : (
                        <div className={styles.messagesList}>
                            {Object.entries(groupedFavorites).map(([date, messages]) => (
                                <div key={date} className={styles.dateGroup}>
                                    <div className={styles.dateDivider}>{date}</div>
                                    {messages.map((message) => (
                                        <div key={message.id} className={styles.favoriteItem}>
                                            <MessageBubble
                                                message={message}
                                                isOwn={message.sender_id === userId}
                                                showAvatar={true}
                                                onReply={() => { }}
                                                onReact={() => { }}
                                                onDelete={() => { }}
                                                onEdit={() => { }}
                                            />
                                            <button
                                                className={styles.unstarButton}
                                                onClick={() => handleUnstar(message.id)}
                                                title="Remove from starred"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoritesPanel;
