import React from 'react';
import styles from './BoltzActionsSidebar.module.css';
import LikeButton from './LikeButton';
import CommentButton from './CommentButton';
import ShareButton from './ShareButton';
import SaveButton from './SaveButton';
import MusicDisc from './MusicDisc';
import { MoreVertical } from 'lucide-react';

const BoltzActionsSidebar = ({
    boltz,
    onLike,
    onComment,
    onShare,
    onSave,
    onOpenOptions,
    onOpenMusic,
    playing
}) => {
    return (
        <div className={styles.container}>
            <LikeButton
                isLiked={boltz.is_liked}
                count={boltz.likes_count}
                onClick={onLike}
            />

            <CommentButton
                count={boltz.comments_count}
                onClick={onComment}
            />

            <ShareButton count={boltz.shares_count} onClick={onShare} />

            <SaveButton
                isSaved={boltz.is_saved}
                count={boltz.saves_count}
                onClick={onSave}
            />

            <button className={styles.actionBtn} onClick={onOpenOptions}>
                <div className={styles.iconWrapper}>
                    <MoreVertical size={24} />
                </div>
            </button>

            {boltz.music && (
                <MusicDisc
                    imageUrl={boltz.music.cover_url}
                    playing={playing}
                    onClick={onOpenMusic}
                />
            )}
        </div>
    );
};

export default BoltzActionsSidebar;
