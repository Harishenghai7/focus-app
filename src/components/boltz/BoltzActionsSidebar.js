import React from 'react';
import styles from './BoltzActionsSidebar.module.css';
import LikeButton from './LikeButton';
import CommentButton from './CommentButton';
import ShareButton from './ShareButton';
import SaveButton from './SaveButton';
import MusicDisc from './MusicDisc';
import { MoreVertical, Sparkles } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const BoltzActionsSidebar = ({
    boltz,
    onLike,
    onComment,
    onShare,
    onSave,
    onOpenOptions,
    onOpenMusic,
    onToggleReactionPicker,
    playing,
    reactions = {},
    userReaction,
}) => {
    const totalReactions = Object.values(reactions).reduce((s, c) => s + c, 0);

    return (
        <div className={styles.container}>
            <div className={styles.buttonGroup}>
                <LikeButton
                    isLiked={boltz.is_liked}
                    count={boltz.likes_count}
                    onClick={onLike}
                    onLongPress={onToggleReactionPicker}
                />
            </div>

            <div className={styles.buttonGroup} style={{ '--stagger': '50ms' }}>
                <CommentButton
                    count={boltz.comments_count}
                    onClick={onComment}
                />
            </div>

            <div className={styles.buttonGroup} style={{ '--stagger': '100ms' }}>
                {/* Reaction Button */}
                <button
                    className={`${styles.actionBtn} ${userReaction ? styles.reacted : ''}`}
                    onClick={onToggleReactionPicker}
                >
                    <div className={styles.iconWrapper}>
                        <Sparkles size={24} />
                    </div>
                    <span className={styles.count}>
                        {totalReactions > 0 ? formatNumber(totalReactions) : 'React'}
                    </span>
                </button>
            </div>

            <div className={styles.buttonGroup} style={{ '--stagger': '150ms' }}>
                <ShareButton count={boltz.shares_count} onClick={onShare} />
            </div>

            <div className={styles.buttonGroup} style={{ '--stagger': '200ms' }}>
                <SaveButton
                    isSaved={boltz.is_saved}
                    count={boltz.saves_count}
                    onClick={onSave}
                />
            </div>

            <div className={styles.buttonGroup} style={{ '--stagger': '250ms' }}>
                <button className={styles.actionBtn} onClick={onOpenOptions}>
                    <div className={styles.iconWrapper}>
                        <MoreVertical size={24} />
                    </div>
                </button>
            </div>

            {boltz.music && (
                <div className={styles.buttonGroup} style={{ '--stagger': '300ms' }}>
                    <MusicDisc
                        imageUrl={boltz.music.cover_url}
                        playing={playing}
                        onClick={onOpenMusic}
                    />
                </div>
            )}
        </div>
    );
};

export default BoltzActionsSidebar;
