// CommentItem Component - Individual comment with all features
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { likeComment, unlikeComment, deleteComment, updateComment, togglePinComment, checkCommentLike } from '../../lib/commentApi';
import { linkifyText } from '../../utils/linkifyText';
import { toast } from 'react-toastify';
import styles from './CommentItem.module.css';

const CommentItem = ({
    comment,
    onReply,
    onDelete,
    onUpdate,
    isPostOwner = false,
    showReplies = true,
    level = 0
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [isLiked, setIsLiked] = useState(comment.is_liked || false);
    const [likesCount, setLikesCount] = useState(comment.likes_count || 0);
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.content);
    const [showOptions, setShowOptions] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let active = true;
        if (!user?.id || !comment?.id) return undefined;
        (async () => {
            const { isLiked: liked } = await checkCommentLike(comment.id, user.id);
            if (active) setIsLiked(Boolean(liked));
        })();
        return () => {
            active = false;
        };
    }, [comment?.id, user?.id]);

    const isOwner = user?.id === comment.user_id;
    const canEdit = isOwner && !comment.deleted_at;
    const canDelete = isOwner || isPostOwner;
    const canPin = isPostOwner && level === 0; // Only top-level comments

    const handleLike = async () => {
        if (!user) {
            toast.error('Please login to like comments');
            return;
        }

        const newLiked = !isLiked;
        setIsLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));

        const { error } = newLiked
            ? await likeComment(comment.id, user.id)
            : await unlikeComment(comment.id, user.id);

        if (error) {
            // Revert on error
            setIsLiked(!newLiked);
            setLikesCount(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
            toast.error('Failed to update like');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Delete this comment?')) return;

        setIsDeleting(true);
        const { error } = await deleteComment(comment.id);

        if (error) {
            toast.error('Failed to delete comment');
            setIsDeleting(false);
        } else {
            toast.success('Comment deleted');
            if (onDelete) onDelete(comment.id);
        }
    };

    const handleEdit = async () => {
        if (!editText.trim()) return;

        const { data, error } = await updateComment(comment.id, editText.trim());

        if (error) {
            toast.error('Failed to update comment');
        } else {
            setIsEditing(false);
            if (onUpdate) onUpdate(data);
            toast.success('Comment updated');
        }
    };

    const handlePin = async () => {
        const newPinned = !comment.is_pinned;
        const { error } = await togglePinComment(comment.id, newPinned);

        if (error) {
            toast.error('Failed to pin comment');
        } else {
            toast.success(newPinned ? 'Comment pinned' : 'Comment unpinned');
            if (onUpdate) onUpdate({ ...comment, is_pinned: newPinned });
        }
        setShowOptions(false);
    };

    const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });
    const isEdited = comment.updated_at && comment.updated_at !== comment.created_at;
    const profileSlug = comment.user?.username || comment.user?.id || '';
    const avatarSrc = comment.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(profileSlug || comment.user_id || 'focus')}`;
    const displayUsername = comment.user?.username || comment.user?.full_name || 'user';

    if (isDeleting) {
        return (
            <div className={styles.deletedComment}>
                <span className={styles.deletedText}>Comment deleted</span>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${level > 0 ? styles.reply : ''}`}>
            {comment.is_pinned && (
                <div className={styles.pinnedBadge}>
                    📌 Pinned
                </div>
            )}

            <div className={styles.content}>
                <img
                    src={avatarSrc}
                    alt={displayUsername}
                    className={styles.avatar}
                    onClick={() => profileSlug && navigate(`/profile/${profileSlug}`)}
                />

                <div className={styles.main}>
                    <div className={styles.header}>
                        <div className={styles.userInfo}>
                            <span
                                className={styles.username}
                                onClick={() => profileSlug && navigate(`/profile/${profileSlug}`)}
                            >
                                {displayUsername}
                                {comment.user?.verified && <span className={styles.verified}>✓</span>}
                            </span>
                            <span className={styles.time}>
                                {timeAgo}
                                {isEdited && <span className={styles.edited}> (edited)</span>}
                            </span>
                        </div>

                        <button
                            className={styles.optionsButton}
                            onClick={() => setShowOptions(!showOptions)}
                        >
                            ⋯
                        </button>

                        {showOptions && (
                            <div className={styles.optionsMenu}>
                                {canEdit && (
                                    <button onClick={() => { setIsEditing(true); setShowOptions(false); }}>
                                        ✏️ Edit
                                    </button>
                                )}
                                {canPin && (
                                    <button onClick={handlePin}>
                                        {comment.is_pinned ? '📌 Unpin' : '📌 Pin'}
                                    </button>
                                )}
                                {canDelete && (
                                    <button onClick={handleDelete} className={styles.deleteOption}>
                                        🗑️ Delete
                                    </button>
                                )}
                                {!isOwner && (
                                    <button onClick={() => { toast.info('Report feature coming soon'); setShowOptions(false); }}>
                                        🚩 Report
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className={styles.editContainer}>
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className={styles.editInput}
                                maxLength={2200}
                                autoFocus
                            />
                            <div className={styles.editActions}>
                                <button onClick={() => setIsEditing(false)} className={styles.cancelButton}>
                                    Cancel
                                </button>
                                <button onClick={handleEdit} className={styles.saveButton}>
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className={styles.text}>{linkifyText(comment.content, styles.mention)}</p>
                    )}

                    <div className={styles.actions}>
                        <button
                            className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                            onClick={handleLike}
                        >
                            {isLiked ? '❤️' : '🤍'} {likesCount > 0 && likesCount}
                        </button>

                        {level < 2 && ( // Max 2 levels of nesting
                            <button
                                className={styles.replyButton}
                                onClick={() => onReply && onReply(comment)}
                            >
                                Reply
                            </button>
                        )}

                        {comment.replies_count > 0 && showReplies && (
                            <button className={styles.viewReplies}>
                                View {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentItem;
