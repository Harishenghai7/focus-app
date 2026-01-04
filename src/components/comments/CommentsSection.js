// CommentsSection Component - Main comments interface
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchComments, postComment } from '../../lib/commentApi';
import CommentItem from './CommentItem';
import CommentInput from './CommentInput';
import { toast } from 'react-toastify';
import styles from './CommentsSection.module.css';

const CommentsSection = ({
    targetId,
    targetType = 'post', // 'post', 'boltz', or 'flash'
    postOwnerId = null,
    onCommentCountChange
}) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'top'
    const [expandedReplies, setExpandedReplies] = useState(new Set());

    const COMMENTS_PER_PAGE = 20;

    // Fetch comments
    const loadComments = useCallback(async (offset = 0, append = false) => {
        try {
            if (offset === 0) setLoading(true);
            else setLoadingMore(true);

            const { data, error } = await fetchComments(targetId, targetType, {
                limit: COMMENTS_PER_PAGE,
                offset
            });

            if (error) throw error;

            if (append) {
                setComments(prev => [...prev, ...(data || [])]);
            } else {
                setComments(data || []);
            }

            setHasMore(data && data.length === COMMENTS_PER_PAGE);

            // Update comment count
            if (onCommentCountChange && !append) {
                onCommentCountChange(data?.length || 0);
            }

        } catch (error) {
            console.error('Error loading comments:', error);
            toast.error('Failed to load comments');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [targetId, targetType, onCommentCountChange]);

    // Initial load
    useEffect(() => {
        loadComments();
    }, [loadComments]);

    // Handle new comment
    const handleSubmitComment = async (content) => {
        if (!user) {
            toast.error('Please login to comment');
            return;
        }

        const commentData = {
            user_id: user.id,
            content,
            parent_id: replyingTo?.id || null
        };

        // Set target based on type
        if (targetType === 'post') commentData.post_id = targetId;
        else if (targetType === 'boltz') commentData.boltz_id = targetId;
        else if (targetType === 'flash') commentData.flash_id = targetId;

        const { data, error } = await postComment(commentData);

        if (error) {
            toast.error('Failed to post comment');
            return;
        }

        // Add user data to comment
        const newComment = {
            ...data,
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                avatar_url: user.avatar_url,
                verified: user.verified
            },
            likes_count: 0,
            replies_count: 0
        };

        if (replyingTo) {
            // Add as reply
            setComments(prev => prev.map(c =>
                c.id === replyingTo.id
                    ? { ...c, replies_count: c.replies_count + 1 }
                    : c
            ));

            // Expand replies to show new reply
            setExpandedReplies(prev => new Set([...prev, replyingTo.id]));

            toast.success('Reply posted!');
        } else {
            // Add as top-level comment
            setComments(prev => [newComment, ...prev]);
            toast.success('Comment posted!');
        }

        setReplyingTo(null);
    };

    // Handle delete
    const handleDeleteComment = (commentId) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
    };

    // Handle update
    const handleUpdateComment = (updatedComment) => {
        setComments(prev => prev.map(c =>
            c.id === updatedComment.id ? { ...c, ...updatedComment } : c
        ));
    };

    // Load more
    const handleLoadMore = () => {
        loadComments(comments.length, true);
    };

    // Toggle replies
    const toggleReplies = async (commentId) => {
        const newExpanded = new Set(expandedReplies);

        if (newExpanded.has(commentId)) {
            newExpanded.delete(commentId);
        } else {
            newExpanded.add(commentId);

            // Load replies if not loaded yet
            const comment = comments.find(c => c.id === commentId);
            if (comment && !comment.replies) {
                const { data } = await fetchComments(targetId, targetType, {
                    parentId: commentId
                });

                setComments(prev => prev.map(c =>
                    c.id === commentId ? { ...c, replies: data || [] } : c
                ));
            }
        }

        setExpandedReplies(newExpanded);
    };

    // Sort comments
    const sortedComments = [...comments].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        if (sortBy === 'top') {
            return b.likes_count - a.likes_count;
        }
        return new Date(b.created_at) - new Date(a.created_at);
    });

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}>⏳</div>
                    <p>Loading comments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>
                    Comments {comments.length > 0 && `(${comments.length})`}
                </h3>

                <div className={styles.sortButtons}>
                    <button
                        className={sortBy === 'newest' ? styles.active : ''}
                        onClick={() => setSortBy('newest')}
                    >
                        Newest
                    </button>
                    <button
                        className={sortBy === 'top' ? styles.active : ''}
                        onClick={() => setSortBy('top')}
                    >
                        Top
                    </button>
                </div>
            </div>

            {/* Comments List */}
            <div className={styles.commentsList}>
                {sortedComments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>💬</span>
                        <p>No comments yet</p>
                        <span className={styles.emptySubtext}>Be the first to comment!</span>
                    </div>
                ) : (
                    sortedComments.map(comment => (
                        <div key={comment.id}>
                            <CommentItem
                                comment={comment}
                                onReply={setReplyingTo}
                                onDelete={handleDeleteComment}
                                onUpdate={handleUpdateComment}
                                isPostOwner={user?.id === postOwnerId}
                                level={0}
                            />

                            {/* Replies */}
                            {comment.replies_count > 0 && (
                                <div className={styles.repliesSection}>
                                    <button
                                        className={styles.viewRepliesButton}
                                        onClick={() => toggleReplies(comment.id)}
                                    >
                                        {expandedReplies.has(comment.id) ? '▼' : '▶'}
                                        {expandedReplies.has(comment.id) ? 'Hide' : 'View'}
                                        {' '}{comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
                                    </button>

                                    {expandedReplies.has(comment.id) && comment.replies && (
                                        <div className={styles.repliesList}>
                                            {comment.replies.map(reply => (
                                                <CommentItem
                                                    key={reply.id}
                                                    comment={reply}
                                                    onReply={setReplyingTo}
                                                    onDelete={handleDeleteComment}
                                                    onUpdate={handleUpdateComment}
                                                    isPostOwner={user?.id === postOwnerId}
                                                    level={1}
                                                    showReplies={false}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Load More */}
                {hasMore && (
                    <button
                        className={styles.loadMoreButton}
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Loading...' : 'Load more comments'}
                    </button>
                )}
            </div>

            {/* Input */}
            <CommentInput
                onSubmit={handleSubmitComment}
                placeholder={replyingTo ? `Reply to @${replyingTo.user?.username}...` : "Add a comment..."}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
            />
        </div>
    );
};

export default CommentsSection;
