import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../ui/Modal';
import Avatar from '../shared/Avatar';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import VerifiedBadge from '../shared/VerifiedBadge';
import { linkifyText } from '../../utils/linkifyText';
import { formatNumber } from '../../utils/formatNumber';
import { formatTimeAgo } from '../../utils/formatTimeAgo';
import { useLike } from '../../hooks/useLike';
import { useSave } from '../../hooks/useSave';
import { useComment } from '../../hooks/useComment';
import { supabase } from '../../lib/supabase';
import styles from './PostDetailModal.module.css';

const PostDetailModal = ({ isOpen, onClose, post, onNavigate }) => {
    const navigate = useNavigate();
    const { toggleLike } = useLike();
    const { toggleSave } = useSave();
    const { addComment } = useComment();

    const [postData, setPostData] = useState(post);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

    useEffect(() => {
        setPostData(post);
        if (post && isOpen) {
            fetchComments();
        }
    }, [post, isOpen]);

    const fetchComments = async () => {
        if (!post) return;

        setLoadingComments(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    id,
                    text,
                    created_at,
                    user:profiles(id, username, avatar_url, verified)
                `)
                .eq('post_id', post.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            setComments(data || []);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    const handleProfileClick = (username) => {
        if (username) {
            onClose();
            navigate(`/profile/${username}`);
        }
    };

    const handleLike = async () => {
        await toggleLike(post.id, postData.is_liked, (postId, updates) => {
            setPostData(prev => ({
                ...prev,
                is_liked: updates.is_liked,
                likes_count: prev.likes_count + (updates.is_liked ? 1 : -1)
            }));
        });
    };

    const handleSave = async () => {
        await toggleSave(post.id, postData.is_saved, (postId, updates) => {
            setPostData(prev => ({
                ...prev,
                is_saved: updates.is_saved
            }));
        });
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            const newComment = await addComment(post.id, commentText);
            setComments(prev => [newComment, ...prev]);
            setCommentText('');
            setPostData(prev => ({
                ...prev,
                comments_count: prev.comments_count + 1
            }));
        } catch (err) {
            console.error('Error adding comment:', err);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/p/${post.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out this post on Focus',
                    url
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(url);
            // TODO: Show toast notification
        }
    };

    const handlePrevious = () => {
        if (onNavigate) {
            onNavigate('prev');
        }
    };

    const handleNext = () => {
        if (onNavigate) {
            onNavigate('next');
        }
    };

    const handleMediaNavigation = (direction) => {
        const mediaCount = postData.media?.length || 0;
        if (direction === 'prev' && currentMediaIndex > 0) {
            setCurrentMediaIndex(currentMediaIndex - 1);
        } else if (direction === 'next' && currentMediaIndex < mediaCount - 1) {
            setCurrentMediaIndex(currentMediaIndex + 1);
        }
    };

    if (!postData) return null;

    const currentMedia = postData.media?.[currentMediaIndex];
    const hasMultipleMedia = postData.media?.length > 1;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className={styles.modal}>
            <div className={styles.content}>
                {/* Media Section */}
                <div className={styles.mediaSection}>
                    <div className={styles.mediaContainer}>
                        {currentMedia?.type === 'video' ? (
                            <video
                                src={currentMedia.url}
                                controls
                                className={styles.media}
                                autoPlay
                            />
                        ) : (
                            <img
                                src={currentMedia?.url}
                                alt="Post"
                                className={styles.media}
                            />
                        )}

                        {/* Media Navigation */}
                        {hasMultipleMedia && (
                            <>
                                {currentMediaIndex > 0 && (
                                    <button
                                        className={`${styles.mediaNav} ${styles.mediaNavPrev}`}
                                        onClick={() => handleMediaNavigation('prev')}
                                        aria-label="Previous media"
                                    >
                                        <Icon name="ChevronLeft" size={32} />
                                    </button>
                                )}
                                {currentMediaIndex < postData.media.length - 1 && (
                                    <button
                                        className={`${styles.mediaNav} ${styles.mediaNavNext}`}
                                        onClick={() => handleMediaNavigation('next')}
                                        aria-label="Next media"
                                    >
                                        <Icon name="ChevronRight" size={32} />
                                    </button>
                                )}
                                <div className={styles.mediaIndicators}>
                                    {postData.media.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`${styles.indicator} ${index === currentMediaIndex ? styles.indicatorActive : ''}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Post Navigation */}
                    {onNavigate && (
                        <>
                            <button
                                className={`${styles.postNav} ${styles.postNavPrev}`}
                                onClick={handlePrevious}
                                aria-label="Previous post"
                            >
                                <Icon name="ChevronLeft" size={24} />
                            </button>
                            <button
                                className={`${styles.postNav} ${styles.postNavNext}`}
                                onClick={handleNext}
                                aria-label="Next post"
                            >
                                <Icon name="ChevronRight" size={24} />
                            </button>
                        </>
                    )}
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    {/* Header */}
                    <div className={styles.header}>
                        <div onClick={() => handleProfileClick(postData.user?.username)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                            <Avatar
                                src={postData.user?.avatar_url}
                                alt={postData.user?.username}
                                size="md"
                            />
                        </div>
                        <div className={styles.userInfo}>
                            <div
                                className={styles.username}
                                onClick={() => handleProfileClick(postData.user?.username)}
                                style={{ cursor: 'pointer' }}
                            >
                                {postData.user?.username}
                                {postData.user?.verified && <VerifiedBadge size={14} />}
                            </div>
                            <div className={styles.location}>{postData.location}</div>
                        </div>
                        <Button variant="ghost" size="sm" icon={<Icon name="MoreHorizontal" size={20} />} />
                    </div>

                    {/* Caption */}
                    {postData.caption && (
                        <div className={styles.caption}>
                            <span
                                className={styles.captionUsername}
                                onClick={() => handleProfileClick(postData.user?.username)}
                                style={{ cursor: 'pointer' }}
                            >
                                {postData.user?.username}
                            </span>
                            <span className={styles.captionText}>
                                {linkifyText(postData.caption, styles.link)}
                            </span>
                        </div>
                    )}

                    {/* Comments */}
                    <div className={styles.commentsSection}>
                        {loadingComments ? (
                            <div className={styles.loading}>Loading comments...</div>
                        ) : comments.length === 0 ? (
                            <div className={styles.noComments}>No comments yet</div>
                        ) : (
                            <div className={styles.commentsList}>
                                {comments.map((comment) => (
                                    <div key={comment.id} className={styles.comment}>
                                        <div onClick={() => handleProfileClick(comment.user?.username)} style={{ cursor: 'pointer' }}>
                                            <Avatar
                                                src={comment.user?.avatar_url}
                                                alt={comment.user?.username}
                                                size="sm"
                                            />
                                        </div>
                                        <div className={styles.commentContent}>
                                            <div className={styles.commentText}>
                                                <span
                                                    className={styles.commentUsername}
                                                    onClick={() => handleProfileClick(comment.user?.username)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {comment.user?.username}
                                                    {comment.user?.verified && <VerifiedBadge size={12} />}
                                                </span>
                                                <span>{linkifyText(comment.text, styles.link)}</span>
                                            </div>
                                            <div className={styles.commentMeta}>
                                                {formatTimeAgo(comment.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className={styles.actions}>
                        <div className={styles.actionButtons}>
                            <button
                                className={styles.actionBtn}
                                onClick={handleLike}
                                aria-label={postData.is_liked ? 'Unlike' : 'Like'}
                            >
                                <Icon
                                    name="Heart"
                                    size={24}
                                    fill={postData.is_liked ? 'var(--error)' : 'none'}
                                    color={postData.is_liked ? 'var(--error)' : 'currentColor'}
                                />
                            </button>
                            <button
                                className={styles.actionBtn}
                                onClick={() => document.getElementById('comment-input')?.focus()}
                                aria-label="Comment"
                            >
                                <Icon name="MessageCircle" size={24} />
                            </button>
                            <button
                                className={styles.actionBtn}
                                onClick={handleShare}
                                aria-label="Share"
                            >
                                <Icon name="Send" size={24} />
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.actionBtnSave}`}
                                onClick={handleSave}
                                aria-label={postData.is_saved ? 'Unsave' : 'Save'}
                            >
                                <Icon
                                    name="Bookmark"
                                    size={24}
                                    fill={postData.is_saved ? 'currentColor' : 'none'}
                                />
                            </button>
                        </div>

                        <div className={styles.likes}>
                            {formatNumber(postData.likes_count)} likes
                        </div>

                        <div className={styles.timestamp}>
                            {formatTimeAgo(postData.created_at)}
                        </div>
                    </div>

                    {/* Comment Input */}
                    <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                        <input
                            id="comment-input"
                            type="text"
                            placeholder="Add a comment..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            className={styles.commentInput}
                            disabled={submittingComment}
                        />
                        <button
                            type="submit"
                            className={styles.commentSubmit}
                            disabled={!commentText.trim() || submittingComment}
                        >
                            Post
                        </button>
                    </form>
                </div>
            </div>
        </Modal>
    );
};

export default PostDetailModal;
