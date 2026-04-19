import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './PostDetailModal.module.css';
import UserAvatar from '../ui/Avatar';
import UniversalInteractionBar from '../ui/UniversalInteractionBar';
import CommentsDrawer from '../post/CommentsDrawer';
import ShareModal from './ShareModal';
import { normalizeHydratedProfile } from '../../utils/identityHydration';

const PostDetailModal = ({ post, onClose, onUpdate, initialOpenComments = false }) => {
    const [viewPost, setViewPost] = useState(post);
    const [showComments, setShowComments] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    useEffect(() => {
        setViewPost(post);
    }, [post]);

    useEffect(() => {
        if (initialOpenComments) {
            setShowComments(true);
        }
    }, [initialOpenComments, viewPost?.id]);

    const contentType = viewPost?.type === 'boltz' ? 'boltz' : 'post';
    const mediaUrl =
        viewPost?.media_url ||
        viewPost?.media_urls?.[0] ||
        viewPost?.thumbnail_url ||
        viewPost?.video_url ||
        null;
    const author = useMemo(
        () => viewPost ? normalizeHydratedProfile(viewPost?.profiles || viewPost?.user, viewPost?.user_id) : {},
        [viewPost]
    );

    if (!post) return null;

    const handleLocalUpdate = (contentId, updates) => {
        setViewPost((prev) => {
            if (!prev || prev.id !== contentId) return prev;
            const next = { ...prev, ...updates };
            if (updates.likes_count_delta !== undefined) {
                next.likes_count = Math.max(0, (prev.likes_count || 0) + updates.likes_count_delta);
            }
            if (updates.saves_count_delta !== undefined) {
                next.saves_count = Math.max(0, (prev.saves_count || 0) + updates.saves_count_delta);
            }
            if (updates.comments_count_delta !== undefined) {
                next.comments_count = Math.max(0, (prev.comments_count || 0) + updates.comments_count_delta);
            }
            if (updates.shares_count_delta !== undefined) {
                next.shares_count = Math.max(0, (prev.shares_count || 0) + updates.shares_count_delta);
            }
            onUpdate?.(contentId, updates);
            return next;
        });
    };

    const isVideo = contentType === 'boltz' || viewPost?.type === 'video';

    return (
        <AnimatePresence>
            <motion.div
                className={styles.overlay}
                onClick={onClose}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
            <motion.div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                layoutId={`content-detail-${contentType}-${viewPost?.id}`}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
                <button className={styles.closeButton} onClick={onClose}>
                    <X size={24} />
                </button>

                <div className={styles.mediaContainer}>
                    {isVideo ? (
                        <video src={mediaUrl} controls autoPlay className={styles.media} />
                    ) : (
                        <img src={mediaUrl} alt={viewPost?.caption || 'Post'} className={styles.media} />
                    )}
                </div>

                <div className={styles.sidebar}>
                    <div className={styles.header}>
                        <div className={styles.userInfo}>
                            <UserAvatar src={author.avatar_url} username={author.username} size="md" />
                            <div className={styles.userMeta}>
                                <span className={styles.username}>{author.username}</span>
                                {author.is_verified && <span className={styles.verified}>✓</span>}
                            </div>
                        </div>
                    </div>

                    <div className={styles.comments}>
                        {viewPost?.caption && (
                            <div className={styles.captionBlock}>
                                <UserAvatar src={author.avatar_url} username={author.username} size="sm" />
                                <div className={styles.captionContent}>
                                    <p className={styles.captionText}>
                                        <span className={styles.username}>{author.username}</span> {viewPost.caption}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.footer}>
                        <UniversalInteractionBar
                            postId={viewPost?.id}
                            contentType={contentType}
                            isLiked={Boolean(viewPost?.is_liked)}
                            likeCount={viewPost?.likes_count || 0}
                            isSaved={Boolean(viewPost?.is_saved)}
                            commentCount={viewPost?.comments_count || 0}
                            shareCount={viewPost?.shares_count || 0}
                            savesCount={viewPost?.saves_count || 0}
                            onCommentClick={() => setShowComments(true)}
                            onShareClick={() => setShowShareModal(true)}
                            onUpdate={handleLocalUpdate}
                        />
                    </div>
                </div>
            </motion.div>
            {showShareModal && (
                <ShareModal
                    item={viewPost}
                    type={contentType}
                    onClose={() => setShowShareModal(false)}
                />
            )}
            {showComments && (
                <CommentsDrawer
                    targetId={viewPost?.id}
                    targetType={contentType}
                    onClose={() => setShowComments(false)}
                />
            )}
            </motion.div>
        </AnimatePresence>
    );
};

export default PostDetailModal;
