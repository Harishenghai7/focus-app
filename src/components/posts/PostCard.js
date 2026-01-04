/**
 * PostCard Component
 * Main post display with all premium interactions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useInteractions } from '../../hooks/useInteractions';
import MediaCarousel from './MediaCarousel';
import VideoPlayer from './VideoPlayer';
import LikesModal from './LikesModal';
import PostDetailModal from '../modals/PostDetailModal';
import ShareModal from '../modals/ShareModal';
import PostOptionsModal from '../modals/PostOptionsModal';
import styles from './PostCard.module.css';

const PostCard = ({ post: initialPost }) => {
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    // Local state for post data (synced with React Query via useInteractions)
    const [post, setPost] = useState(initialPost);
    const { toggleLike, toggleSave, likeAnimating } = useInteractions(post.id, 'post');

    // Sync with prop changes (for likes/saves from React Query)
    useEffect(() => {
        setPost(initialPost);
    }, [initialPost]);

    const [showLikesModal, setShowLikesModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showOptionsModal, setShowOptionsModal] = useState(false);
    const [showFullCaption, setShowFullCaption] = useState(false);

    const handlePostUpdate = (postId, updates) => {
        setPost(prev => {
            if (prev.id !== postId) return prev;
            const newPost = { ...prev, ...updates };
            if (updates.likes_count_delta !== undefined) {
                newPost.likes_count = (prev.likes_count || 0) + updates.likes_count_delta;
            }
            if (updates.saves_count_delta !== undefined) {
                newPost.saves_count = (prev.saves_count || 0) + updates.saves_count_delta;
            }
            if (updates.comments_count_delta !== undefined) {
                newPost.comments_count = (prev.comments_count || 0) + updates.comments_count_delta;
            }
            return newPost;
        });
    };

    const author = post.profiles || post.user || {};

    const handleProfileClick = (e) => {
        e.stopPropagation();
        if (author?.username) {
            navigate(`/profile/${author.username}`);
        }
    };

    const handleLike = () => {
        toggleLike(post.is_liked, handlePostUpdate);
    };

    const handleSave = () => {
        toggleSave(post.is_saved, handlePostUpdate);
    };

    const handleDoubleTap = () => {
        if (!post.is_liked) {
            handleLike();
        }
    };

    // Format caption with hashtags and mentions
    const formatCaption = (text) => {
        if (!text) return '';

        return text.split(' ').map((word, i) => {
            if (word.startsWith('#')) {
                return <span key={i} className={styles.hashtag}>{word} </span>;
            } else if (word.startsWith('@')) {
                return <span key={i} className={styles.mention}>{word} </span>;
            }
            return word + ' ';
        });
    };

    const isVideo = post.media_types?.[0] === 'video' || post.type === 'video';
    const hasMultipleMedia = post.media_urls?.length > 1;
    const mediaUrl = post.media_urls?.[0] || post.media_url || post.media?.[0]?.url;

    return (
        <>
            <article className={styles.postCard}>
                {/* Header */}
                <header className={styles.postHeader}>
                    <div className={styles.userInfo} onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
                        <img
                            src={author?.avatar_url || '/default-avatar.png'}
                            alt={author?.username}
                            className={styles.avatar}
                        />
                        <div className={styles.userMeta}>
                            <span className={styles.username}>
                                {author?.username}
                                {(author?.is_verified || author?.verified) && (
                                    <span className={styles.verified}>✓</span>
                                )}
                            </span>
                            {post.location && (
                                <span className={styles.location}>{post.location}</span>
                            )}
                        </div>
                    </div>
                    <button className={styles.menuBtn} onClick={() => setShowOptionsModal(true)}>•••</button>
                </header>

                {/* Media */}
                <div
                    className={styles.mediaContainer}
                    onDoubleClick={handleDoubleTap}
                >
                    {isVideo ? (
                        <VideoPlayer src={post.media_urls?.[0] || post.media_url} />
                    ) : hasMultipleMedia ? (
                        <MediaCarousel
                            media={post.media_urls}
                            onImageClick={() => setShowDetailModal(true)}
                        />
                    ) : mediaUrl ? (
                        <img
                            src={mediaUrl}
                            alt={post.caption || 'Post image'}
                            className={styles.media}
                            loading="lazy"
                            onClick={() => setShowDetailModal(true)}
                        />
                    ) : null}

                    {/* Double-tap heart animation */}
                    <AnimatePresence>
                        {likeAnimating && (
                            <motion.div
                                className={styles.likeAnimation}
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1.5, opacity: 1 }}
                                exit={{ scale: 2, opacity: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="#ef4444">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <div className={styles.primaryActions}>
                        <button
                            className={`${styles.actionBtn} ${post.is_liked ? styles.liked : ''}`}
                            onClick={handleLike}
                            aria-label={post.is_liked ? 'Unlike' : 'Like'}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={post.is_liked ? '#ef4444' : 'none'} stroke={post.is_liked ? '#ef4444' : 'currentColor'} strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowDetailModal(true)}
                            aria-label="Comment"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowShareModal(true)}
                            aria-label="Share"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="18" cy="5" r="3" />
                                <circle cx="6" cy="12" r="3" />
                                <circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                            </svg>
                        </button>
                    </div>
                    <button
                        className={`${styles.actionBtn} ${post.is_saved ? styles.saved : ''}`}
                        onClick={handleSave}
                        aria-label={post.is_saved ? 'Unsave' : 'Save'}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill={post.is_saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                        </svg>
                    </button>
                </div>

                {/* Engagement */}
                {(post.likes_count > 0) && (
                    <div
                        className={styles.likes}
                        onClick={() => setShowLikesModal(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        <strong>{(post.likes_count || 0).toLocaleString()}</strong> {post.likes_count === 1 ? 'like' : 'likes'}
                    </div>
                )}

                {/* Caption */}
                {post.caption && (
                    <div className={styles.caption}>
                        <strong onClick={handleProfileClick} style={{ cursor: 'pointer' }}>{author?.username}</strong>{' '}
                        <span className={styles.captionText}>
                            {showFullCaption || (post.caption?.length || 0) <= 100
                                ? formatCaption(post.caption)
                                : <>
                                    {formatCaption(post.caption.substring(0, 100))}...
                                    <button
                                        className={styles.moreBtn}
                                        onClick={() => setShowFullCaption(true)}
                                    >
                                        more
                                    </button>
                                </>
                            }
                        </span>
                    </div>
                )}

                {/* Comments Preview */}
                {(post.comments_count > 0) && (
                    <button
                        className={styles.viewComments}
                        onClick={() => setShowDetailModal(true)}
                    >
                        View all {post.comments_count} comments
                    </button>
                )}

                {/* Timestamp */}
                <time className={styles.timestamp}>
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </time>
            </article>

            {/* Modals */}
            {showLikesModal && (
                <LikesModal
                    postId={post.id}
                    onClose={() => setShowLikesModal(false)}
                />
            )}

            {showDetailModal && (
                <PostDetailModal
                    post={post}
                    onClose={() => setShowDetailModal(false)}
                    onUpdate={handlePostUpdate}
                />
            )}

            {showShareModal && (
                <ShareModal
                    item={post}
                    type="post"
                    onClose={() => setShowShareModal(false)}
                />
            )}

            {showOptionsModal && (
                <PostOptionsModal
                    postId={post.id}
                    postData={post}
                    isOwn={currentUser?.id === post.user_id}
                    onClose={() => setShowOptionsModal(false)}
                    onUpdate={(updatedData) => handlePostUpdate(post.id, updatedData)}
                />
            )}
        </>
    );
};

export default PostCard;
