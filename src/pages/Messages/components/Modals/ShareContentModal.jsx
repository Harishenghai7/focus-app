/* ═══════════════════════════════════════════════════════════════════════
   SHARE CONTENT MODAL - Share posts/boltz/flash to messages
   Phase 3: Social Integration
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './ShareContentModal.module.css';

const ShareContentModal = ({ onClose, contentType, contentId, onShare, currentUserId }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversations, setSelectedConversations] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchConversations();
    }, [currentUserId]);

    const fetchConversations = async () => {
        try {
            const { data } = await supabase
                .from('conversations')
                .select('*')
                .contains('participants', [currentUserId])
                .order('last_message_at', { ascending: false });

            setConversations(data || []);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleConversation = (convId) => {
        setSelectedConversations(prev =>
            prev.includes(convId)
                ? prev.filter(id => id !== convId)
                : [...prev, convId]
        );
    };

    const handleShare = async () => {
        if (selectedConversations.length === 0) return;

        try {
            setSending(true);

            // Share to each selected conversation
            for (const convId of selectedConversations) {
                await onShare(message || null, {
                    type: `${contentType}_share`,
                    content_context: {
                        type: contentType,
                        id: contentId
                    }
                }, convId);
            }

            onClose();
        } catch (error) {
            console.error('Error sharing content:', error);
            alert('Failed to share content');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Share {contentType}</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                <div className={styles.messageInput}>
                    <input
                        type="text"
                        placeholder="Add a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className={styles.input}
                    />
                </div>

                <div className={styles.conversationsList}>
                    {loading ? (
                        <div className={styles.loading}>Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className={styles.empty}>No conversations yet</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`${styles.conversationCard} ${selectedConversations.includes(conv.id) ? styles.selected : ''}`}
                                onClick={() => toggleConversation(conv.id)}
                            >
                                <div className={styles.checkbox}>
                                    {selectedConversations.includes(conv.id) && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" />
                                        </svg>
                                    )}
                                </div>
                                <div className={styles.conversationInfo}>
                                    <span className={styles.name}>
                                        {conv.type === 'group' ? conv.group_name : 'Direct Chat'}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles.actions}>
                    <button onClick={onClose} className={styles.cancelButton} disabled={sending}>
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        className={styles.shareButton}
                        disabled={sending || selectedConversations.length === 0}
                    >
                        {sending ? 'Sharing...' : `Share to ${selectedConversations.length} chat${selectedConversations.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareContentModal;
