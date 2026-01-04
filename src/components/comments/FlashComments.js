// FlashComments - Fully Functional Professional System
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { fetchComments, postComment } from '../../lib/commentApi';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import styles from './FlashComments.module.css';

const FlashComments = ({ flashId, flashOwnerId, onClose }) => {
    const { user } = useAuth();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [posting, setPosting] = useState(false);
    const commentsEndRef = useRef(null);

    const MAX_LENGTH = 200;

    // Load comments
    useEffect(() => {
        loadComments();
    }, [flashId]);

    // Auto-scroll to bottom when new comments arrive
    useEffect(() => {
        scrollToBottom();
    }, [comments]);

    const scrollToBottom = () => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadComments = async () => {
        setLoading(true);
        const { data, error } = await fetchComments(flashId, 'flash', { limit: 100 });

        if (!error && data) {
            setComments(data);
        }
        setLoading(false);
    };

    // Post comment
    const handleSubmit = async (e) => {
        e?.preventDefault();

        if (!newComment.trim() || posting) return;

        if (!user) {
            toast.error('Please login to comment');
            return;
        }

        setPosting(true);

        const { data, error } = await postComment({
            flash_id: flashId,
            user_id: user.id,
            content: newComment.trim()
        });

        if (error) {
            console.error('Error posting comment:', error);
            toast.error('Failed to post comment');
        } else if (data) {
            // Add to list with user data
            const newCommentData = {
                ...data,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                    verified: user.verified
                }
            };
            setComments(prev => [...prev, newCommentData]);
            setNewComment('');
            toast.success('Comment posted!');
        }

        setPosting(false);
    };

    // Quick reactions
    const quickReactions = ['🔥', '❤️', '😂', '😍', '👏', '🙌'];

    const handleQuickReaction = async (emoji) => {
        if (posting || !user) {
            if (!user) toast.error('Please login to react');
            return;
        }

        setPosting(true);

        const { data, error } = await postComment({
            flash_id: flashId,
            user_id: user.id,
            content: emoji
        });

        if (!error && data) {
            const newCommentData = {
                ...data,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                    verified: user.verified
                }
            };
            setComments(prev => [...prev, newCommentData]);
        } else {
            toast.error('Failed to post reaction');
        }

        setPosting(false);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const remainingChars = MAX_LENGTH - newComment.length;
    const isNearLimit = remainingChars < 20;

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>⏳</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Quick Reactions */}
            <div className={styles.quickReactions}>
                {quickReactions.map(emoji => (
                    <button
                        key={emoji}
                        className={styles.reactionBtn}
                        onClick={() => handleQuickReaction(emoji)}
                        disabled={posting}
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Comments List */}
            <div className={styles.commentsList}>
                {comments.length === 0 ? (
                    <div className={styles.empty}>
                        <span>💬</span>
                        <p>No comments yet</p>
                    </div>
                ) : (
                    <>
                        {comments.map(comment => (
                            <div key={comment.id} className={styles.comment}>
                                <img
                                    src={comment.user?.avatar_url || '/default-avatar.png'}
                                    alt={comment.user?.username}
                                    className={styles.avatar}
                                />
                                <div className={styles.bubble}>
                                    <div className={styles.username}>
                                        {comment.user?.username}
                                        {comment.user?.verified && <span className={styles.verified}>✓</span>}
                                    </div>
                                    <div className={styles.text}>{comment.content}</div>
                                    <div className={styles.time}>
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={commentsEndRef} />
                    </>
                )}
            </div>

            {/* Input */}
            <form className={styles.inputForm} onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Send a message..."
                    className={styles.input}
                    maxLength={MAX_LENGTH}
                    disabled={posting}
                />
                {isNearLimit && (
                    <span className={`${styles.charCount} ${remainingChars < 10 ? styles.warning : ''}`}>
                        {remainingChars}
                    </span>
                )}
                <button
                    type="submit"
                    className={styles.sendBtn}
                    disabled={!newComment.trim() || posting}
                >
                    {posting ? '⏳' : '➤'}
                </button>
            </form>
        </div>
    );
};

export default FlashComments;
