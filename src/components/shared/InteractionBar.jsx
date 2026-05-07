import React from 'react';
import { useSovereignPulse } from '../../hooks/useSovereignPulse';
import universalShare from '../../utils/universalShare';
import styles from './InteractionBar.module.css';

const InteractionBar = ({ item, type, onCommentsClick }) => {
    const { togglePulse, getOptimisticState, isOptimisticLoading } = useSovereignPulse();
    
    const { liked: isPulsed, count: pulseCount } = getOptimisticState(
        item.id,
        type,
        item.likes_count || 0,
        item.is_liked || false
    );
    
    const loading = isOptimisticLoading(item.id, type);

    const handlePulse = (e) => {
        e.stopPropagation();
        togglePulse(item.id, type, item.likes_count || 0, item.is_liked || false);
    };

    const handleShare = (e) => {
        e.stopPropagation();
        universalShare({
            type,
            id: item.id,
            title: item.caption || item.title || 'Focus',
            description: item.caption || item.content || 'Check this out on Focus'
        });
    };

    return (
        <div className={styles.interactionBar}>
            <button
                onClick={handlePulse}
                disabled={loading}
                className={`${styles.pulseBtn} ${isPulsed ? styles.pulsed : ''}`}
            >
                <span className={styles.pulseIcon}>♥</span>
                <span className={styles.count}>{pulseCount}</span>
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onCommentsClick && onCommentsClick();
                }}
                className={styles.commentBtn}
            >
                <span className={styles.commentIcon}>💬</span>
                <span className={styles.count}>{item.comments_count || 0}</span>
            </button>

            <button
                onClick={handleShare}
                className={styles.shareBtn}
            >
                <span className={styles.shareIcon}>↗</span>
            </button>
        </div>
    );
};

export default InteractionBar;
