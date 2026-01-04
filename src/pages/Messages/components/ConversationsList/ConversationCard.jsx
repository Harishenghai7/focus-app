/* ═══════════════════════════════════════════════════════════════════════
   CONVERSATION CARD - Individual conversation in the list
   Visual-first design with rich previews
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { formatMessageTime, getMessagePreview, getUnreadCount } from '../../utils/messageHelpers';
import styles from './ConversationCard.module.css';

const ConversationCard = ({ conversation, isSelected, onClick, currentUserId }) => {
    const [otherUser, setOtherUser] = useState(null);
    const [lastMessage, setLastMessage] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOnline, setIsOnline] = useState(false);

    // Fetch other user data for direct chats
    useEffect(() => {
        const fetchUserData = async () => {
            if (conversation.type === 'direct') {
                const otherUserId = conversation.participants.find(id => id !== currentUserId);

                if (otherUserId) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', otherUserId)
                        .single();

                    setOtherUser(data);
                }
            }
        };

        fetchUserData();
    }, [conversation, currentUserId]);

    // Fetch last message
    useEffect(() => {
        const fetchLastMessage = async () => {
            if (conversation.last_message_id) {
                const { data } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('id', conversation.last_message_id)
                    .single();

                setLastMessage(data);
            }
        };

        fetchLastMessage();
    }, [conversation.last_message_id]);

    // Calculate unread count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            const { data } = await supabase
                .from('messages')
                .select('id')
                .eq('conversation_id', conversation.id)
                .neq('sender_id', currentUserId)
                .not('read_by', 'cs', `{${currentUserId}}`);

            setUnreadCount(data?.length || 0);
        };

        fetchUnreadCount();
    }, [conversation.id, currentUserId]);

    const displayName = conversation.type === 'group'
        ? conversation.group_name
        : otherUser?.full_name || otherUser?.username || 'Unknown User';

    const avatarUrl = conversation.type === 'group'
        ? conversation.group_avatar
        : otherUser?.avatar_url;

    return (
        <div
            className={`${styles.card} ${isSelected ? styles.selected : ''}`}
            onClick={onClick}
        >
            {/* Avatar with online indicator */}
            <div className={styles.avatarContainer}>
                <img
                    src={avatarUrl || '/default-avatar.png'}
                    alt={displayName}
                    className={styles.avatar}
                />
                {conversation.type === 'direct' && isOnline && (
                    <div className={styles.onlineIndicator}></div>
                )}
            </div>

            {/* Content */}
            <div className={styles.content}>
                <div className={styles.header}>
                    <div className={styles.nameContainer}>
                        <span className={styles.name}>{displayName}</span>
                        {otherUser?.verified && (
                            <svg className={styles.verifiedBadge} width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#8b5cf6" strokeWidth="2" fill="#8b5cf6" />
                            </svg>
                        )}
                    </div>
                    {lastMessage && (
                        <span className={styles.time}>
                            {formatMessageTime(lastMessage.created_at)}
                        </span>
                    )}
                </div>

                <div className={styles.preview}>
                    <span className={styles.previewText}>
                        {lastMessage ? getMessagePreview(lastMessage) : 'No messages yet'}
                    </span>
                    {unreadCount > 0 && (
                        <div className={styles.unreadBadge}>{unreadCount}</div>
                    )}
                </div>
            </div>

            {/* Pin indicator */}
            {conversation.pinned && (
                <div className={styles.pinIndicator}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M16 4v6l3 3v2h-6v5l-1 1-1-1v-5H5v-2l3-3V4h8z" fill="currentColor" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default ConversationCard;
