import React from 'react';
import styles from './InteractionBar.module.css';
import Icon from '../ui/Icon';

const InteractionBar = ({
    isLiked,
    likesCount,
    onLike,
    onComment,
    onShare,
    isSaved,
    onSave,
    animating
}) => {
    return (
        <div className={styles.container}>
            <div className={styles.left}>
                <button
                    className={`${styles.btn} ${isLiked ? styles.liked : ''} ${animating ? styles.animating : ''}`}
                    onClick={onLike}
                >
                    <Icon
                        name="Heart"
                        size={24}
                        fill={isLiked ? "var(--error)" : "none"}
                        color={isLiked ? "var(--error)" : "var(--text-primary)"}
                    />
                </button>

                <button className={styles.btn} onClick={onComment}>
                    <Icon name="MessageCircle" size={24} color="var(--text-primary)" />
                </button>

                <button className={styles.btn} onClick={onShare}>
                    <Icon name="Send" size={24} color="var(--text-primary)" />
                </button>
            </div>

            <div className={styles.right}>
                <button className={styles.btn} onClick={onSave}>
                    <Icon
                        name="Bookmark"
                        size={24}
                        fill={isSaved ? "var(--text-primary)" : "none"}
                        color="var(--text-primary)"
                    />
                </button>
            </div>
        </div>
    );
};

export default InteractionBar;
