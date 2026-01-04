// ═══════════════════════════════════════════════════════════════════════
// SHARE CONTENT TO MESSAGES - Posts, Flash, Boltz
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './ShareToMessages.module.css';

const ShareToMessages = ({ content, contentType, onClose, onShare }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversations, setSelectedConversations] = useState([]);
    const [sending, setSending] = useState(false);

    // Fetch user's conversations
    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('conversation_participants')
                    .select(`
                        conversation_id,
                        conversation:conversations(
                            id,
                            last_message_at,
                            participants:conversation_participants(
                                user:profiles(id, username, full_name, avatar_url)
                            )
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('conversation:last_message_at', { ascending: false });

                if (error) throw error;

                // Format conversations
                const formatted = data.map(item => {
                    const otherUser = item.conversation.participants.find(
                        p => p.user.id !== user.id
                    )?.user;

                    return {
                        id: item.conversation.id,
                        user: otherUser,
                        lastMessageAt: item.conversation.last_message_at
                    };
                }).filter(c => c.user); // Filter out invalid conversations

                setConversations(formatted);
            } catch (err) {
                console.error('Error fetching conversations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    // Filter conversations by search
    const filteredConversations = conversations.filter(conv =>
        conv.user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Toggle conversation selection
    const toggleConversation = (convId) => {
        setSelectedConversations(prev =>
            prev.includes(convId)
                ? prev.filter(id => id !== convId)
                : [...prev, convId]
        );
    };

    // Send to selected conversations
    const handleSend = async () => {
        if (selectedConversations.length === 0) return;

        setSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // Prepare shared content metadata
            const metadata = {
                contentId: content.id,
                contentType: contentType,
                thumbnail: content.media_url || content.image_url || content.thumbnail_url,
                title: content.caption || content.content || 'Shared content',
                author: content.author?.username || content.user?.username,
                likes: content.likes_count || 0
            };

            // Send message to each selected conversation
            const promises = selectedConversations.map(async (conversationId) => {
                const messageData = {
                    conversation_id: conversationId,
                    sender_id: user.id,
                    type: `shared_${contentType}`,
                    content: `Shared a ${contentType}`,
                    metadata: metadata,
                    status: 'sent'
                };

                return supabase
                    .from('messages')
                    .insert(messageData);
            });

            await Promise.all(promises);

            onShare?.(selectedConversations.length);
            onClose();
        } catch (err) {
            console.error('Error sharing content:', err);
            alert('Failed to share content: ' + err.message);
        } finally {
            setSending(false);
        }
    };

    // Render content preview
    const renderContentPreview = () => {
        switch (contentType) {
            case 'post':
                return (
                    <div className={styles.contentPreview}>
                        {content.media_url && (
                            <img src={content.media_url} alt="Post" className={styles.previewImage} />
                        )}
                        <div className={styles.previewInfo}>
                            <div className={styles.previewType}>📸 Post</div>
                            <div className={styles.previewCaption}>
                                {content.caption || 'No caption'}
                            </div>
                            <div className={styles.previewStats}>
                                ❤️ {content.likes_count || 0} likes
                            </div>
                        </div>
                    </div>
                );

            case 'flash':
                return (
                    <div className={styles.contentPreview}>
                        {content.media_url && (
                            <img src={content.media_url} alt="Flash" className={styles.previewImage} />
                        )}
                        <div className={styles.previewInfo}>
                            <div className={styles.previewType}>⚡ Flash Story</div>
                            <div className={styles.previewCaption}>
                                @{content.user?.username}
                            </div>
                            <div className={styles.previewStats}>
                                24h • {content.views_count || 0} views
                            </div>
                        </div>
                    </div>
                );

            case 'boltz':
                return (
                    <div className={styles.contentPreview}>
                        {content.thumbnail_url && (
                            <div className={styles.previewVideoContainer}>
                                <img src={content.thumbnail_url} alt="Boltz" className={styles.previewImage} />
                                <div className={styles.playIcon}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                </div>
                            </div>
                        )}
                        <div className={styles.previewInfo}>
                            <div className={styles.previewType}>🎬 Boltz Reel</div>
                            <div className={styles.previewCaption}>
                                {content.caption || 'No caption'}
                            </div>
                            <div className={styles.previewStats}>
                                ❤️ {content.likes_count || 0} • 💬 {content.comments_count || 0}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.modal}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Share to Messages</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content Preview */}
                {renderContentPreview()}

                {/* Search */}
                <div className={styles.searchContainer}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                {/* Conversations List */}
                <div className={styles.conversationsList}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading conversations...</p>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No conversations found</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div
                                key={conv.id}
                                className={`${styles.conversationItem} ${selectedConversations.includes(conv.id) ? styles.selected : ''
                                    }`}
                                onClick={() => toggleConversation(conv.id)}
                            >
                                <div className={styles.checkbox}>
                                    {selectedConversations.includes(conv.id) && (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                                <img
                                    src={conv.user.avatar_url || '/default-avatar.png'}
                                    alt={conv.user.username}
                                    className={styles.avatar}
                                />
                                <div className={styles.userInfo}>
                                    <div className={styles.username}>{conv.user.username}</div>
                                    {conv.user.full_name && (
                                        <div className={styles.fullName}>{conv.user.full_name}</div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <button
                        className={styles.sendBtn}
                        onClick={handleSend}
                        disabled={selectedConversations.length === 0 || sending}
                    >
                        {sending ? (
                            <>
                                <div className={styles.btnSpinner}></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                                Send to {selectedConversations.length} {selectedConversations.length === 1 ? 'chat' : 'chats'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShareToMessages;
