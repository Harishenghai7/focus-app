import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { MoreHorizontal, BadgeCheck } from 'lucide-react';
import { Heart } from 'lucide-react';
import { useInteractions } from '../../hooks/useInteractions';
import UserAvatar from '../ui/Avatar';
import FocusIDBadge from '../ui/FocusIDBadge';
import CommentsDrawer from './CommentsDrawer';
import ShareModal from './ShareModal';
import UniversalInteractionBar from '../ui/UniversalInteractionBar';
import UniversalActionMenu from '../ui/UniversalActionMenu';
import { pickDisplayLabel } from '../../utils/displayName';
import styles from './PostCard.module.css';

const PostCard = ({ post }) => {
    const navigate = useNavigate();

    // ── Author — works with new `profiles` relation or legacy `author` ──
    const safeProfiles = Array.isArray(post?.profiles) ? post.profiles[0] : post?.profiles;
    const safeUser = Array.isArray(post?.user) ? post.user[0] : post?.user;
    const author     = safeProfiles || safeUser || post?.author || {};
    const username   = author.username   || '';
    const fullName   = author.full_name  || '';
    const displayLabel = pickDisplayLabel(
        fullName,
        username,
        author?.id ? `user_${String(author.id).slice(0, 8)}` : 'Member'
    );
    const profileSlug = username || author.id || '';
    const fallback   = `https://api.dicebear.com/7.x/bottts/svg?seed=${author.id || username}`;
    const avatarUrl  = author.avatar_url || fallback;
    const isVerified = author.is_verified || false;
    const trustTier  = author.trust_tier  || 0;

    const [showComments, setShowComments]   = useState(false);
    const [showShare, setShowShare]         = useState(false);
    const [showActions, setShowActions]     = useState(false);
    const [heartBurst, setHeartBurst]       = useState(false);
    const { toggleLike } = useInteractions(post?.id, 'post');
    const lastTap = useRef(0);
    const moreBtnRef = useRef(null);

    const timeAgo = post?.created_at
        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace('about ', '')
        : 'Just now';

    const mediaUrl   = post?.media_url || post?.media_urls?.[0];
    const mediaType =
        post?.media_type ||
        (post?.type === 'video' || post?.media_types?.[0] === 'video' ? 'video' : 'image');
    const captionText = post?.caption || post?.content;

    // ── Double-tap to like ────────────────────────────────
    const handleMediaTap = useCallback(() => {
        const now = Date.now();
        if (now - lastTap.current < 310) {
            if (!post?.is_liked) {
                toggleLike(Boolean(post?.is_liked));
                setHeartBurst(true);
                setTimeout(() => setHeartBurst(false), 900);
            }
        }
        lastTap.current = now;
    }, [post?.is_liked, toggleLike]);

    return (
        <>
            <article className={styles.card}>
                {/* ── Header ──────────────────────────────── */}
                <header className={styles.header}>
                    <div
                        className={styles.userInfo}
                        onClick={() => profileSlug && navigate(`/profile/${profileSlug}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && profileSlug && navigate(`/profile/${profileSlug}`)}
                    >
                        <UserAvatar
                            src={avatarUrl}
                            username={username || profileSlug}
                            fullName={fullName}
                            size="md"
                            className={styles.avatar}
                        />
                        <div className={styles.meta}>
                            <div className={styles.nameRow}>
                                <span className={styles.username}>{displayLabel}</span>
                                {isVerified && (
                                    <BadgeCheck size={14} className={styles.verified} />
                                )}
                                <FocusIDBadge tier={trustTier} size="xs" />
                            </div>
                            <span className={styles.timestamp}>{timeAgo}</span>
                        </div>
                    </div>
                    <button
                        ref={moreBtnRef}
                        className={styles.moreBtn}
                        aria-label="More options"
                        onClick={() => setShowActions(true)}
                    >
                        <MoreHorizontal size={20} />
                    </button>
                </header>

                {/* ── Caption ─────────────────────────────── */}
                {captionText && (
                    <p className={styles.caption}>{captionText}</p>
                )}

                {/* ── Media ───────────────────────────────── */}
                {mediaUrl && (
                    <div className={styles.mediaWrapper} onClick={handleMediaTap}>
                        {mediaType === 'video' ? (
                            <video
                                src={mediaUrl}
                                controls
                                className={styles.media}
                                playsInline
                            />
                        ) : (
                            <img
                                src={mediaUrl}
                                alt="Post content"
                                className={styles.media}
                                loading="lazy"
                            />
                        )}

                        {/* Double-tap heart burst */}
                        <motion.div
                            className={styles.heartBurst}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={heartBurst
                                ? { scale: [0, 1.25, 1], opacity: [0, 1, 0] }
                                : { scale: 0, opacity: 0 }
                            }
                            transition={{ duration: 0.55 }}
                        >
                            <Heart size={72} fill="#ff3040" stroke="none" />
                        </motion.div>
                    </div>
                )}

                {/* ── Universal Interaction Bar ──────────── */}
                <UniversalInteractionBar
                    postId={post?.id}
                    contentType="post"
                    isLiked={post?.is_liked || false}
                    likeCount={post?.likes_count || 0}
                    isSaved={post?.is_saved || false}
                    commentCount={post?.comments_count || 0}
                    shareCount={post?.shares_count ?? 0}
                    savesCount={post?.saves_count ?? 0}
                    onCommentClick={() => setShowComments(true)}
                    onShareClick={() => setShowShare(true)}
                />
            </article>

            {/* ── Comments Drawer ─── */}
            {showComments && (
                <CommentsDrawer
                    postId={post.id}
                    onClose={() => setShowComments(false)}
                />
            )}

            {/* ── Share Modal ──────── */}
            {showShare && (
                <ShareModal
                    post={post}
                    onClose={() => setShowShare(false)}
                />
            )}

            {/* ── Universal Action Menu (3-dot) ─── */}
            <UniversalActionMenu
                isOpen={showActions}
                onClose={() => setShowActions(false)}
                contentId={post?.id}
                contentType="post"
                authorId={post?.user_id}
                anchorRef={moreBtnRef}
                onNotInterested={() => {/* parent feed can remove post */}}
            />
        </>
    );
};

export default PostCard;