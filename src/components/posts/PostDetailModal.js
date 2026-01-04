/**
 * PostDetailModal Component
 * Fullscreen post view with embedded comments
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { usePostLike } from '../../hooks/usePostLike';
import { usePostSave } from '../../hooks/usePostSave';
import { usePostShare } from '../../hooks/usePostShare';
import CommentsSection from '../comments/CommentsSection';
import MediaCarousel from './MediaCarousel';
import VideoPlayer from './VideoPlayer';
import styles from './PostDetailModal.module.css';

const PostDetailModal = ({ post, onClose }) => {
    const navigate = useNavigate();
    const { toggleLike } = usePostLike();
    const { toggleSave } = usePostSave();
    const [showShareModal, setShowShareModal] = useState(false);

    const handleProfileClick = (e) => {
        e.stopPropagation();
        if (post.profiles?.username) {
            onClose();
            navigate(`/profile/${post.profiles.username}`);
        }
    };

    const handleLike = () => {
        toggleLike({
            postId: post.id,
            isLiked: post.is_liked,
            postUserId: post.user_id,
        });
    };

    const handleSave = () => {
        toggleSave({
            postId: post.id,
            isSaved: post.is_saved,
        });
    };

    const isVideo = post?.media_types?.[0] === 'video' || post?.type === 'boltz';
    const hasMultipleMedia = post?.media_urls?.length > 1;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className={styles.closeBtn}>✕</button>

                <div className={styles.content}>
                    {/* Media Section */}
                    <div className={styles.mediaSection}>
                        {isVideo ? (
                            <VideoPlayer src={post.media_urls[0]} />
                        ) : hasMultipleMedia ? (
                            <MediaCarousel media={post.media_urls} />
                        ) : (
                            <img
                                src={post.media_urls[0]}
                                alt={post.caption}
                                className={styles.singleImage}
                            />
                        )}
                    </div>

                    {/* Details Section */}
                    <div className={styles.detailsSection}>
                        {/* Header */}
                        <div className={styles.header}>
                            <img
                                src={post.profiles?.avatar_url || '/default-avatar.png'}
                                alt={post.profiles?.username}
                                className={styles.avatar}
                                onClick={handleProfileClick}
                                style={{ cursor: 'pointer' }}
                            />
                            <div className={styles.userInfo} onClick={handleProfileClick} style={{ cursor: 'pointer' }}>
                                <span className={styles.username}>
                                    {post.profiles?.username}
                                    {post.profiles?.is_verified && (
                                        <span className={styles.verified}>✓</span>
                                    )}
                                </span>
                                {post.location && (
                                    <span className={styles.location}>{post.location}</span>
                                )}
                            </div>
                        </div>

                        {/* Caption */}
                        {post.caption && (
                            <div className={styles.caption}>
                                <strong onClick={handleProfileClick} style={{ cursor: 'pointer' }}>{post.profiles?.username}</strong> {post.caption}
                            </div>
                        )}

                        {/* Comments */}
                        <div className={styles.commentsWrapper}>
                            <CommentsSection
                                targetId={post.id}
                                targetType="post"
                                postOwnerId={post.user_id}
                            />
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            <div className={styles.primaryActions}>
                                <button
                                    className={`${styles.actionBtn} ${post.is_liked ? styles.liked : ''}`}
                                    onClick={handleLike}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill={post.is_liked ? '#ef4444' : 'none'} stroke="currentColor" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </button>
                                <button className={styles.actionBtn} onClick={() => setShowShareModal(true)}>
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
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill={post.is_saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                                </svg>
                            </button>
                        </div>

                        {/* Likes */}
                        {!post.likes_hidden && post.analytics?.likes_count > 0 && (
                            <div className={styles.likes}>
                                <strong>{post.analytics.likes_count.toLocaleString()}</strong> {post.analytics.likes_count === 1 ? 'like' : 'likes'}
                            </div>
                        )}

                        {/* Timestamp */}
                        <time className={styles.timestamp}>
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </time>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PostDetailModal;
