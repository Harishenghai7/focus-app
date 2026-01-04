/* ═══════════════════════════════════════════════════════════════════════
   FLASH REPLIES SECTION - Horizontal scrollable Flash reactions
   Unique Focus feature - see who reacted to your Flash/Story
   ═══════════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import styles from './FlashRepliesSection.module.css';

const FlashRepliesSection = ({ currentUserId }) => {
    const [flashReplies, setFlashReplies] = useState([]);

    useEffect(() => {
        const fetchFlashReplies = async () => {
            // Fetch notifications where someone reacted to user's Flash
            const { data } = await supabase
                .from('notifications')
                .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(*)
        `)
                .eq('recipient_id', currentUserId)
                .eq('type', 'flash_reaction')
                .order('created_at', { ascending: false })
                .limit(10);

            setFlashReplies(data || []);
        };

        if (currentUserId) {
            fetchFlashReplies();
        }
    }, [currentUserId]);

    if (!flashReplies.length) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>Flash Replies</h3>
                <span className={styles.count}>{flashReplies.length}</span>
            </div>

            <div className={styles.scrollContainer}>
                {flashReplies.map(reply => (
                    <div key={reply.id} className={styles.replyCard}>
                        <div className={styles.avatarContainer}>
                            <img
                                src={reply.sender?.avatar_url || '/default-avatar.png'}
                                alt={reply.sender?.username}
                                className={styles.avatar}
                            />
                            <div className={styles.reactionEmoji}>
                                {reply.metadata?.reaction || '❤️'}
                            </div>
                        </div>
                        <span className={styles.username}>
                            {reply.sender?.username}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FlashRepliesSection;
