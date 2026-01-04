/* ═══════════════════════════════════════════════════════════════════════
   CHAT HEADER - User info and actions
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './ChatHeader.module.css';

const ChatHeader = ({ conversationId, currentUserId }) => {
    const [conversation, setConversation] = useState(null);
    const [otherUser, setOtherUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            // Fetch conversation
            const { data: conv } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            setConversation(conv);

            // Fetch other user for direct chats
            if (conv?.type === 'direct') {
                const otherUserId = conv.participants.find(id => id !== currentUserId);
                const { data: user } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', otherUserId)
                    .single();

                setOtherUser(user);
            }
        };

        fetchData();
    }, [conversationId, currentUserId]);

    const displayName = conversation?.type === 'group'
        ? conversation.group_name
        : otherUser?.full_name || otherUser?.username || 'Unknown User';

    const avatarUrl = conversation?.type === 'group'
        ? conversation.group_avatar
        : otherUser?.avatar_url;

    return (
        <div className={styles.header}>
            <div className={styles.userInfo}>
                <img
                    src={avatarUrl || '/default-avatar.png'}
                    alt={displayName}
                    className={styles.avatar}
                />
                <div className={styles.info}>
                    <div className={styles.nameContainer}>
                        <h2 className={styles.name}>{displayName}</h2>
                        {otherUser?.verified && (
                            <svg className={styles.verifiedBadge} width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#8b5cf6" strokeWidth="2" fill="#8b5cf6" />
                            </svg>
                        )}
                    </div>
                    <span className={styles.status}>Active now</span>
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.actionButton} aria-label="Voice call">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </button>
                <button className={styles.actionButton} aria-label="Video call">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="2" />
                        <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </button>
                <button className={styles.actionButton} aria-label="More options">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                        <circle cx="12" cy="5" r="1" fill="currentColor" />
                        <circle cx="12" cy="19" r="1" fill="currentColor" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default ChatHeader;
