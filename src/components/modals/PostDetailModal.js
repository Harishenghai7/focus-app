import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import styles from './PostDetailModal.module.css';
import Avatar from '../shared/Avatar';
import InteractionBar from '../home/InteractionBar';
import { useLike } from '../../hooks/useLike';
import { useSave } from '../../hooks/useSave';
import { useComment } from '../../hooks/useComment';
import LoadingSpinner from '../shared/LoadingSpinner';

import ShareModal from './ShareModal';

const PostDetailModal = ({ post, onClose, onUpdate }) => {
    const [commentText, setCommentText] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);
    const { toggleLike, animating } = useLike();
    const { toggleSave } = useSave();
    const { comments, loading, posting, loadComments, addComment } = useComment(post?.id, 'post');

    useEffect(() => {
        if (post?.id) {
            loadComments();
        }
    }, [post?.id, loadComments]);

    if (!post) return null;

    const user = post.user || post.profiles;

    const handleLike = () => {
        toggleLike(post.id, post.is_liked, 'post', onUpdate);
    };

    const handleSave = () => {
        toggleSave(post.id, post.is_saved, 'post', onUpdate);
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || posting) return;

        const { error } = await addComment(commentText);
        if (!error) {
            setCommentText('');
            if (onUpdate) {
                onUpdate(post.id, { comments_count_delta: 1 });
            }
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.mediaContainer}>
                    {post.type === 'video' || post.type === 'boltz' ? (
                        <video
                            src={post.media_url}
                            controls
                            autoPlay
                            className={styles.media}
                        />
                    ) : (
                        <img
                            src={post.media_url}
                            alt={post.caption}
                            className={styles.media}
                        />
                    )}
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.header}>
                        <div className={styles.userInfo}>
                            <Avatar src={user?.avatar_url} size="md" />
                            <div className={styles.userMeta}>
                                <span className={styles.username}>{user?.username}</span>
                                {user?.verified && <span className={styles.verified}>✓</span>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.comments}>
                        <div className={styles.captionBlock}>
                            <Avatar src={user?.avatar_url} size="sm" />
                            <div className={styles.captionContent}>
                                <p className={styles.captionText}>
                                    <span className={styles.username}>{user?.username}</span>
                                    {' '}{post.caption}
                                </p>
                                <span className={styles.timestamp}>
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className={styles.commentsList}>
                            {loading ? (
                                <div className={styles.spinnerContainer}>
                                    <LoadingSpinner size="sm" />
                                </div>
                            ) : comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className={styles.commentItem}>
                                        <Avatar src={comment.user?.avatar_url} size="sm" />
                                        <div className={styles.commentContent}>
                                            <p className={styles.commentText}>
                                                <span className={styles.username}>{comment.user?.username}</span>
                                                {' '}{comment.content}
                                            </p>
                                            <span className={styles.timestamp}>
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyComments}>No comments yet. Be the first!</p>
                            )}
                        </div>
                    </div>

                    <div className={styles.footer}>
                        <InteractionBar
                            isLiked={post.is_liked}
                            likesCount={post.likes_count}
                            onLike={handleLike}
                            onComment={() => document.getElementById('commentInput').focus()}
                            onShare={() => setShowShareModal(true)}
                            isSaved={post.is_saved}
                            onSave={handleSave}
                            animating={animating}
                        />

                        <div className={styles.stats}>
                            <span className={styles.likesCount}>{post.likes_count || 0} likes</span>
                        </div>

                        <form className={styles.commentForm} onSubmit={handleSubmitComment}>
                            <input
                                id="commentInput"
                                type="text"
                                placeholder="Add a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className={styles.commentInput}
                                disabled={posting}
                            />
                            <button
                                type="submit"
                                className={styles.sendButton}
                                disabled={!commentText.trim() || posting}
                            >
                                {posting ? <LoadingSpinner size="xs" /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            {showShareModal && (
                <ShareModal
                    item={post}
                    type="post"
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </div>
    );
};

export default PostDetailModal;
