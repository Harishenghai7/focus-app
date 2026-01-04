/**
 * CommentsSection Component
 * Threaded comments with real-time updates
 */

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { usePostComments } from '../../hooks/usePostComments';
import { useRealtimeComments } from '../../hooks/useRealtimeComments';
import { useAuth } from '../../hooks/useAuth';
import styles from './CommentsSection.module.css';

const CommentsSection = ({ postId, onClose }) => {
    const { user } = useAuth();
    const { comments, isLoading, addComment, deleteComment, isAdding } = usePostComments(postId);
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);

    // Enable real-time updates
    useRealtimeComments(postId);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        addComment({
            text: commentText,
            parentCommentId: replyingTo?.id || null,
        });

        setCommentText('');
        setReplyingTo(null);
    };

    const handleReply = (comment) => {
        setReplyingTo(comment);
        setCommentText(`@${comment.profiles?.username} `);
    };

    const handleDelete = (commentId) => {
        if (window.confirm('Delete this comment?')) {
            deleteComment(commentId);
        }
    };

    // Organize comments into threads
    const topLevelComments = comments.filter(c => !c.parent_comment_id);
    const getReplies = (commentId) => comments.filter(c => c.parent_comment_id === commentId);

    return (
        <div className={styles.commentsSection}>
            <div className={styles.header}>
                <h3>Comments</h3>
                <button onClick={onClose} className={styles.closeBtn}>✕</button>
            </div>

            <div className={styles.commentsList}>
                {isLoading ? (
                    <div className={styles.loading}>Loading comments...</div>
                ) : comments.length === 0 ? (
                    <div className={styles.empty}>
                        <p>No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    topLevelComments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replies={getReplies(comment.id)}
                            onReply={handleReply}
                            onDelete={handleDelete}
                            currentUserId={user?.id}
                        />
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className={styles.commentForm}>
                {replyingTo && (
                    <div className={styles.replyingTo}>
                        Replying to @{replyingTo.profiles?.username}
                        <button
                            type="button"
                            onClick={() => {
                                setReplyingTo(null);
                                setCommentText('');
                            }}
                            className={styles.cancelReply}
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div className={styles.inputWrapper}>
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Add a comment..."
                        className={styles.input}
                        maxLength={2200}
                    />
                    <button
                        type="submit"
                        disabled={!commentText.trim() || isAdding}
                        className={styles.submitBtn}
                    >
                        {isAdding ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Individual comment item
const CommentItem = ({ comment, replies, onReply, onDelete, currentUserId }) => {
    const isOwn = comment.user_id === currentUserId;

    return (
        <div className={styles.commentItem}>
            <img
                src={comment.profiles?.avatar_url || '/default-avatar.png'}
                alt={comment.profiles?.username}
                className={styles.avatar}
            />
            <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                    <span className={styles.username}>
                        {comment.profiles?.username}
                        {comment.profiles?.is_verified && (
                            <span className={styles.verified}>✓</span>
                        )}
                    </span>
                    <span className={styles.timestamp}>
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                    </span>
                </div>
                <p className={styles.commentText}>{comment.text}</p>
                <div className={styles.commentActions}>
                    <button onClick={() => onReply(comment)} className={styles.actionBtn}>
                        Reply
                    </button>
                    {isOwn && (
                        <button
                            onClick={() => onDelete(comment.id)}
                            className={styles.actionBtn}
                        >
                            Delete
                        </button>
                    )}
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                    <div className={styles.replies}>
                        {replies.map(reply => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                replies={[]}
                                onReply={onReply}
                                onDelete={onDelete}
                                currentUserId={currentUserId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentsSection;
