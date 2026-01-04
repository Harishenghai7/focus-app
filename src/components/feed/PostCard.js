import React, { useState } from 'react';
import styles from './PostCard.module.css';
import Card from '../ui/Card';
import Avatar from '../ui/Avatar';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import CommentsSection from '../posts/CommentsSection';
import { useLike } from '../../hooks/useLike';
import { useSave } from '../../hooks/useSave';

const PostCard = ({ post }) => {
    const [localPost, setLocalPost] = useState(post);
    const [showComments, setShowComments] = useState(false);
    const { toggleLike, showHeartAnimation } = useLike();
    const { toggleSave } = useSave();

    // Update handler for optimistic updates
    const handleUpdate = (postId, updates) => {
        setLocalPost(prev => {
            const newPost = { ...prev };

            if (updates.is_liked !== undefined) {
                newPost.is_liked = updates.is_liked;
            }
            if (updates.is_saved !== undefined) {
                newPost.is_saved = updates.is_saved;
            }
            if (updates.likes_count_delta !== undefined) {
                newPost.likes_count = (prev.likes_count || 0) + updates.likes_count_delta;
            }
            if (updates.saves_count_delta !== undefined) {
                newPost.saves_count = (prev.saves_count || 0) + updates.saves_count_delta;
            }

            return newPost;
        });
    };

    const handleLike = () => {
        toggleLike(localPost.id, localPost.is_liked, 'post', handleUpdate);
    };

    const handleSave = () => {
        toggleSave(localPost.id, localPost.is_saved, 'post', handleUpdate);
    };

    const handleComment = () => {
        setShowComments(true);
    };

    return (
        <>
            <Card className={styles.postCard}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.userInfo}>
                        <Avatar src={localPost.profiles?.avatar_url} size="md" />
                        <div className={styles.userMeta}>
                            <span className={styles.username}>
                                {localPost.profiles?.username}
                                {localPost.profiles?.is_verified && <Icon name="BadgeCheck" size={14} className={styles.verifiedBadge} />}
                            </span>
                            <span className={styles.timeAgo}>{formatTimeAgo(localPost.created_at)}</span>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={<Icon name="MoreHorizontal" size={20} />} />
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {localPost.content && <p className={styles.caption}>{localPost.content}</p>}
                    {localPost.media_urls && localPost.media_urls.length > 0 && (
                        <div className={styles.mediaContainer}>
                            <img
                                src={localPost.media_urls[0]}
                                alt="Post content"
                                className={styles.media}
                                onError={(e) => {
                                    e.target.src = '/placeholder-image.png';
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <div className={styles.leftActions}>
                        <Button
                            variant="ghost"
                            className={`${styles.actionBtn} ${localPost.is_liked ? styles.liked : ''}`}
                            onClick={handleLike}
                        >
                            <Icon name="Heart" size={24} fill={localPost.is_liked ? "currentColor" : "none"} />
                            <span>{localPost.likes_count || 0}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className={styles.actionBtn}
                            onClick={handleComment}
                        >
                            <Icon name="MessageCircle" size={24} />
                            <span>{localPost.comments_count || 0}</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className={styles.actionBtn}
                        >
                            <Icon name="Send" size={24} />
                        </Button>
                    </div>
                    <div className={styles.rightActions}>
                        <Button
                            variant="ghost"
                            className={`${styles.actionBtn} ${localPost.is_saved ? styles.saved : ''}`}
                            onClick={handleSave}
                        >
                            <Icon name="Bookmark" size={24} fill={localPost.is_saved ? "currentColor" : "none"} />
                        </Button>
                    </div>
                </div>

                {/* Heart Animation */}
                {showHeartAnimation && (
                    <div className={styles.heartAnimation}>
                        <Icon name="Heart" size={80} fill="currentColor" />
                    </div>
                )}
            </Card>

            {/* Comments Modal */}
            {showComments && (
                <CommentsSection
                    postId={localPost.id}
                    onClose={() => setShowComments(false)}
                />
            )}
        </>
    );
};

// Helper function to format time ago
const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now - postTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
};

export default PostCard;

