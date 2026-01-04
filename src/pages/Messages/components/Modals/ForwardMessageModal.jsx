/* ═══════════════════════════════════════════════════════════════════════
   FORWARD MESSAGE MODAL - Forward messages to other conversations
   Phase 4: Advanced Features
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './ForwardMessageModal.module.css';

const ForwardMessageModal = ({ onClose, message, currentUserId, onForward }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedConversations, setSelectedConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [forwarding, setForwarding] = useState(false);

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

    const handleForward = async () => {
        if (selectedConversations.length === 0) return;

        try {
            setForwarding(true);

            for (const convId of selectedConversations) {
                await onForward(message, convId);
            }

            onClose();
        } catch (error) {
            console.error('Error forwarding message:', error);
            alert('Failed to forward message');
        } finally {
            setForwarding(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Forward Message</h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                    </button>
                </div>

                <div className={styles.messagePreview}>
                    <div className={styles.previewLabel}>Forwarding:</div>
                    <div className={styles.previewContent}>
                        {message.content || '📷 Media'}
                    </div>
                </div>

                <div className={styles.conversationsList}>
                    {loading ? (
                        <div className={styles.loading}>Loading conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className={styles.empty}>No conversations available</div>
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
                    <button onClick={onClose} className={styles.cancelButton} disabled={forwarding}>
                        Cancel
                    </button>
                    <button
                        onClick={handleForward}
                        className={styles.forwardButton}
                        disabled={forwarding || selectedConversations.length === 0}
                    >
                        {forwarding ? 'Forwarding...' : `Forward to ${selectedConversations.length} chat${selectedConversations.length !== 1 ? 's' : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForwardMessageModal;
