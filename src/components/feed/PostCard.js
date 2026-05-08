/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PostCard — Cinematic Universe Edition
 * Premium glassmorphism card with trust badges, particle heart burst,
 * progressive blur-up image loading, and engagement quality signals.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
    Heart, MessageCircle, Send, Bookmark, 
    MoreHorizontal, BadgeCheck, Shield, Clock
} from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import styles from './PostCard.module.css';

const PostCard = ({ post, onShare }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const doubleTapRef = useRef(null);

    // 1. Safe Data Extraction
    const authorProfile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
    const author = authorProfile || post.author || {};
    
    const username = author.username || 'Focus User';
    const fullName = author.full_name || username;
    const avatarUrl = author.avatar_url;
    const isVerified = author.is_verified || false;
    
    // 2. Optimistic State
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [isSaved, setIsSaved] = useState(post.is_saved || false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [heartBurst, setHeartBurst] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    // 3. Initial Check
    useEffect(() => {
        if (user && post.likes) {
            const userHasLiked = Array.isArray(post.likes) 
                ? post.likes.some(l => (l.user_id === user.id || l === user.id)) 
                : post.is_liked; 
            setIsLiked(!!userHasLiked);
        }
    }, [user, post]);

    // 4. Like Handler with optimistic update
    const handleLike = useCallback(async (e) => {
        e && e.stopPropagation();
        if (!user) return;

        const previousLiked = isLiked;
        setIsLiked(!previousLiked);
        setLikeCount(prev => !previousLiked ? prev + 1 : prev - 1);
        
        if (!previousLiked) triggerHeartBurst();

        try {
            if (!previousLiked) {
                await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
            } else {
                await supabase.from('likes').delete().match({ user_id: user.id, post_id: post.id });
            }
        } catch (err) {
            setIsLiked(previousLiked);
            setLikeCount(prev => previousLiked ? prev + 1 : prev - 1);
        }
    }, [user, isLiked, post.id]);

    const handleSave = (e) => {
        e.stopPropagation();
        setIsSaved(!isSaved);
    };

    // Double-tap to like
    const handleDoubleTap = useCallback(() => {
        if (!isLiked) handleLike();
        else triggerHeartBurst();
    }, [isLiked, handleLike]);

    const triggerHeartBurst = () => {
        setHeartBurst(true);
        setTimeout(() => setHeartBurst(false), 1000);
    };

    // Reading time estimate
    const readingTime = post.caption ? Math.max(1, Math.ceil(post.caption.split(/\s+/).length / 200)) : 0;

    const timeAgo = post.created_at 
        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace('about ', '') 
        : 'Just now';

    const formatCount = (n) => {
        if (!n) return '';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n;
    };

    const mediaUrl = post.media_url || (post.media_urls && post.media_urls[0]);
    const hasMedia = mediaUrl && !imageError;

    return (
        <article className={styles.card}>
            {/* ═══ HEADER ═══ */}
            <header className={styles.header}>
                <div className={styles.userInfo} onClick={() => navigate(`/profile/${username}`)}>
                    <div className={styles.avatarContainer}>
                        {avatarUrl && !imageError ? (
                            <img src={avatarUrl} alt={username} className={styles.avatar} onError={() => setImageError(true)} />
                        ) : (
                            <div className={styles.avatarFallback}>
                                {username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                        {isVerified && (
                            <span className={styles.verifiedRing} />
                        )}
                    </div>
                    <div className={styles.meta}>
                        <div className={styles.nameRow}>
                            <span className={styles.displayName}>{fullName}</span>
                            {isVerified && (
                                <BadgeCheck size={15} className={styles.verifiedBadge} fill="#8b5cf6" color="white" />
                            )}
                        </div>
                        <div className={styles.subRow}>
                            <span className={styles.username}>@{username}</span>
                            <span className={styles.dot}>·</span>
                            <span className={styles.timestamp}>{timeAgo}</span>
                        </div>
                    </div>
                </div>

                {/* Trust indicator */}
                {isVerified && (
                    <div className={styles.trustPill}>
                        <Shield size={11} />
                        Trusted
                    </div>
                )}

                <button className={styles.moreBtn} onClick={() => setShowOptions(!showOptions)}>
                    <MoreHorizontal size={20} />
                </button>
            </header>

            {/* ═══ CAPTION ═══ */}
            {post.caption && (
                <div className={styles.captionArea}>
                    <p className={styles.caption}>{post.caption}</p>
                    {readingTime > 1 && (
                        <span className={styles.readTime}>
                            <Clock size={11} /> {readingTime} min read
                        </span>
                    )}
                </div>
            )}

            {/* ═══ MEDIA ═══ */}
            {hasMedia && (
                <div className={styles.mediaWrapper} onDoubleClick={handleDoubleTap}>
                    {post.media_type === 'video' ? (
                        <video 
                            src={mediaUrl} 
                            controls 
                            className={styles.media}
                            playsInline
                            preload="metadata"
                        />
                    ) : (
                        <>
                            {/* Progressive blur-up */}
                            <div className={`${styles.mediaBlur} ${imageLoaded ? styles.mediaBlurHidden : ''}`} />
                            <img 
                                src={mediaUrl} 
                                alt="Post content" 
                                className={`${styles.media} ${imageLoaded ? styles.mediaLoaded : ''}`}
                                loading="lazy"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                            />
                        </>
                    )}

                    {/* Heart burst overlay */}
                    <div className={`${styles.heartBurst} ${heartBurst ? styles.heartBurstActive : ''}`}>
                        <Heart size={80} fill="#ff3040" color="#ff3040" />
                        {/* Particles */}
                        {heartBurst && (
                            <div className={styles.particles}>
                                {[...Array(6)].map((_, i) => (
                                    <span key={i} className={styles.particle} style={{ '--angle': `${i * 60}deg` }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ FOOTER — Interaction Bar ═══ */}
            <footer className={styles.footer}>
                <div className={styles.actionsLeft}>
                    <button onClick={handleLike} className={`${styles.actionBtn} ${isLiked ? styles.actionLiked : ''}`}>
                        <Heart 
                            size={24} 
                            className={`${styles.icon} ${isLiked ? styles.likedHeart : ''}`}
                            fill={isLiked ? "#ff3040" : "none"}
                            color={isLiked ? "#ff3040" : "currentColor"}
                        />
                        <span className={styles.count}>{formatCount(likeCount)}</span>
                    </button>

                    <button className={styles.actionBtn} onClick={() => navigate(`/post/${post.id}`)}>
                        <MessageCircle size={24} className={styles.icon} />
                        <span className={styles.count}>{formatCount(post.comments_count)}</span>
                    </button>

                    <button className={styles.actionBtn} onClick={() => onShare && onShare(post)}>
                        <Send size={24} className={styles.icon} />
                    </button>
                </div>

                <div className={styles.actionsRight}>
                    <button onClick={handleSave} className={`${styles.actionBtn} ${isSaved ? styles.actionSaved : ''}`}>
                        <Bookmark 
                            size={24} 
                            className={styles.icon} 
                            fill={isSaved ? "currentColor" : "none"} 
                        />
                    </button>
                </div>
            </footer>
        </article>
    );
};

export default PostCard;