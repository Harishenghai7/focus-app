import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import MessageBubble from './MessageBubble';
import { formatDateDivider } from '../../utils/formatDateDivider';
import styles from './PinnedMessagesPanel.module.css';

const PinnedMessagesPanel = ({ currentUserId, otherUserId, onClose, onJumpToMessage }) => {
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPinnedMessages();

        // Subscribe to changes
        const subscription = supabase
            .channel(`pinned-messages:${currentUserId}:${otherUserId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'messages',
                filter: `is_pinned=eq.true`
            }, () => {
                fetchPinnedMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [currentUserId, otherUserId]);

    const fetchPinnedMessages = async () => {
        if (!currentUserId || !otherUserId) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*, sender:profiles!sender_id(*)')
                .eq('is_pinned', true)
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPinnedMessages(data || []);
        } catch (error) {
            console.error('Error fetching pinned messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnpin = async (messageId) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ is_pinned: false })
                .eq('id', messageId);

            if (error) throw error;
            setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
        } catch (error) {
            console.error('Error unpinning message:', error);
        }
    };

    const handleJumpToMessage = (message) => {
        onJumpToMessage(message);
        onClose();
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

    const groupedMessages = groupByDate(pinnedMessages);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                        </svg>
                        <h2>Pinned Messages</h2>
                    </div>

                    <button className={styles.closeButton} onClick={onClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading pinned messages...</p>
                        </div>
                    ) : pinnedMessages.length === 0 ? (
                        <div className={styles.empty}>
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                                <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" stroke="currentColor" strokeWidth="2" />
                            </svg>
                            <h3>No pinned messages</h3>
                            <p>Pin important messages to find them easily later</p>
                        </div>
                    ) : (
                        <div className={styles.messagesList}>
                            {Object.entries(groupedMessages).map(([date, messages]) => (
                                <div key={date} className={styles.dateGroup}>
                                    <div className={styles.dateDivider}>{date}</div>
                                    {messages.map((message) => (
                                        <div key={message.id} className={styles.pinnedItem}>
                                            <div className={styles.messageWrapper}>
                                                <MessageBubble
                                                    message={message}
                                                    isOwn={message.sender_id === currentUserId}
                                                    showAvatar={true}
                                                    onReply={() => { }}
                                                    onReact={() => { }}
                                                    onDelete={() => { }}
                                                    onEdit={() => { }}
                                                />
                                            </div>

                                            <div className={styles.actions}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={() => handleJumpToMessage(message)}
                                                    title="Jump to message"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Jump to message
                                                </button>

                                                <button
                                                    className={styles.unpinButton}
                                                    onClick={() => handleUnpin(message.id)}
                                                    title="Unpin message"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M16 12V4H17V2H7V4H8V12L6 14V16H11.2V22H12.8V16H18V14L16 12Z" />
                                                    </svg>
                                                    Unpin
                                                </button>
                                            </div>
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

export default PinnedMessagesPanel;
