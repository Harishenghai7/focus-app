import React, { useState } from 'react';
import styles from './MessageReactions.module.css';

const MessageReactions = ({ reactions = [], onReactionClick, currentUserId }) => {
    const [showTooltip, setShowTooltip] = useState(null);

    if (!reactions || reactions.length === 0) return null;

    // Group reactions by emoji
    const groupedReactions = reactions.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
                hasReacted: false
            };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.user_id);
        if (reaction.user_id === currentUserId) {
            acc[reaction.emoji].hasReacted = true;
        }
        return acc;
    }, {});

    const reactionGroups = Object.values(groupedReactions);

    return (
        <div className={styles.reactions}>
            {reactionGroups.map(({ emoji, count, hasReacted, users }) => (
                <button
                    key={emoji}
                    className={`${styles.reaction} ${hasReacted ? styles.hasReacted : ''}`}
                    onClick={() => onReactionClick?.(emoji)}
                    onMouseEnter={() => setShowTooltip(emoji)}
                    onMouseLeave={() => setShowTooltip(null)}
                    aria-label={`${emoji} ${count}`}
                >
                    <span className={styles.emoji}>{emoji}</span>
                    {count > 1 && <span className={styles.count}>{count}</span>}

                    {showTooltip === emoji && (
                        <div className={styles.tooltip}>
                            {users.length === 1 ? '1 person' : `${users.length} people`} reacted
                        </div>
                    )}
                </button>
            ))}
        </div>
    );
};

export default MessageReactions;
