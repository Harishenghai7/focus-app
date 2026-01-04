/* ═══════════════════════════════════════════════════════════════════════
   CONVERSATIONS LIST - Left column showing all conversations
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useMemo } from 'react';
import ConversationCard from './ConversationCard';
import FlashRepliesSection from './FlashRepliesSection';
import { filterConversations, sortConversations } from '../../utils/messageHelpers';
import styles from './ConversationsList.module.css';

const ConversationsList = ({
    conversations,
    selectedConversationId,
    onSelectConversation,
    searchQuery,
    loading,
    currentUserId
}) => {
    // Filter and sort conversations
    const filteredConversations = useMemo(() => {
        let filtered = conversations;

        if (searchQuery) {
            filtered = filterConversations(conversations, searchQuery, []);
        }

        // Separate pinned and unpinned
        const pinned = filtered.filter(c => c.pinned);
        const unpinned = filtered.filter(c => !c.pinned);

        return [
            ...sortConversations(pinned),
            ...sortConversations(unpinned)
        ];
    }, [conversations, searchQuery]);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading conversations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Flash Replies Section */}
            <FlashRepliesSection currentUserId={currentUserId} />

            {/* Conversations */}
            <div className={styles.conversationsList}>
                {filteredConversations.length === 0 ? (
                    <div className={styles.emptyState}>
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" className={styles.emptyIcon}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <p>No conversations yet</p>
                        <span>Start a new conversation!</span>
                    </div>
                ) : (
                    filteredConversations.map(conversation => (
                        <ConversationCard
                            key={conversation.id}
                            conversation={conversation}
                            isSelected={conversation.id === selectedConversationId}
                            onClick={() => onSelectConversation(conversation.id)}
                            currentUserId={currentUserId}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ConversationsList;
