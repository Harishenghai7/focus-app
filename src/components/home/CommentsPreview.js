import React from 'react';
import styles from './CommentsPreview.module.css';

const CommentsPreview = ({ commentsCount, comments, onShowAll }) => {
    if (!commentsCount || commentsCount === 0) return null;

    return (
        <div className={styles.container}>
            <button className={styles.viewAllBtn} onClick={onShowAll}>
                View all {commentsCount} comments
            </button>

            {comments && comments.slice(0, 2).map(comment => (
                <div key={comment.id} className={styles.comment}>
                    <span className={styles.username}>{comment.user.username}</span>
                    <span className={styles.text}>{comment.text}</span>
                </div>
            ))}
        </div>
    );
};

export default CommentsPreview;
