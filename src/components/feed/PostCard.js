import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
    Heart, MessageCircle, Send, Bookmark, 
    MoreHorizontal, BadgeCheck 
} from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';
import styles from './PostCard.module.css';

const PostCard = ({ post, onShare }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // 1. Safe Data Extraction
    const authorProfile = Array.isArray(post.profiles) ? post.profiles[0] : post.profiles;
    const author = authorProfile || post.author || {};
    
    const username = author.username || 'Focus User';
    const avatarUrl = author.avatar_url;
    const isVerified = author.is_verified || false;
    
    // 2. Optimistic State
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(post.likes_count || 0);
    const [isSaved, setIsSaved] = useState(post.is_saved || false);
    const [imageError, setImageError] = useState(false);
    const [heartAnim, setHeartAnim] = useState(false);

    // 3. Initial Check
    useEffect(() => {
        if (user && post.likes) {
            const userHasLiked = Array.isArray(post.likes) 
                ? post.likes.some(l => (l.user_id === user.id || l === user.id)) 
                : post.is_liked; 
            setIsLiked(!!userHasLiked);
        }
    }, [user, post]);

    // 4. Like Handler
    const handleLike = async (e) => {
        e && e.stopPropagation();
        if (!user) return;

        const previousLiked = isLiked;
        setIsLiked(!previousLiked);
        setLikeCount(prev => !previousLiked ? prev + 1 : prev - 1);
        
        if (!previousLiked) triggerHeartAnimation();

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
    };

    const handleSave = (e) => {
        e.stopPropagation();
        setIsSaved(!isSaved);
        // Supabase save logic would go here
    };

    const triggerHeartAnimation = () => {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 1000);
    };

    const timeAgo = post.created_at 
        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true }).replace('about ', '') 
        : 'Just now';

    return (
        <article className={styles.card}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.userInfo} onClick={() => navigate(`/profile/${username}`)}>
                    <div className={styles.avatarContainer}>
                        {avatarUrl && !imageError ? (
                            <img 
                                src={avatarUrl} 
                                alt={username} 
                                className={styles.avatar}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className={styles.avatarFallback}>
                                {username.slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className={styles.meta}>
                        <div className={styles.nameRow}>
                            <span className={styles.username}>{username}</span>
                            {isVerified && <BadgeCheck size={16} className={styles.verified} fill="#0095f6" color="white" />}
                        </div>
                        <span className={styles.timestamp}>{timeAgo}</span>
                    </div>
                </div>
                <button className={styles.moreBtn}>
                    <MoreHorizontal size={20} />
                </button>
            </header>

            {/* Content */}
            <div className={styles.content}>
                {post.caption && <p className={styles.caption}>{post.caption}</p>}
                
                {(post.media_url || (post.media_urls && post.media_urls.length > 0)) && (
                    <div className={styles.mediaWrapper} onDoubleClick={handleLike}>
                        {post.media_type === 'video' ? (
                            <video 
                                src={post.media_url || post.media_urls[0]} 
                                controls 
                                className={styles.media} 
                            />
                        ) : (
                            <img 
                                src={post.media_url || post.media_urls[0]} 
                                alt="Post content" 
                                className={styles.media}
                                loading="lazy"
                            />
                        )}
                        <div className={`${styles.popHeart} ${heartAnim ? styles.pop : ''}`}>
                            <Heart size={90} fill="#ff3040" color="#ff3040" />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer / Interaction Bar */}
            <footer className={styles.footer}>
                <div className={styles.actionsLeft}>
                    <button onClick={handleLike} className={styles.actionBtn}>
                        <Heart 
                            size={26} 
                            className={`${styles.icon} ${isLiked ? styles.likedHeart : ''}`}
                            fill={isLiked ? "#ff3040" : "none"}
                            color={isLiked ? "#ff3040" : "white"}
                        />
                        {/* COUNT IS HERE - ENSURE TEXT COLOR IS WHITE IN CSS */}
                        <span className={styles.count}>{likeCount > 0 ? likeCount : ''}</span>
                    </button>

                    <button className={styles.actionBtn} onClick={() => navigate(`/post/${post.id}`)}>
                        <MessageCircle size={26} className={styles.icon} />
                        <span className={styles.count}>{post.comments_count || ''}</span>
                    </button>

                    <button className={styles.actionBtn} onClick={() => onShare && onShare(post)}>
                        <Send size={26} className={styles.icon} />
                    </button>
                </div>

                <div className={styles.actionsRight}>
                    <button onClick={handleSave} className={styles.actionBtn}>
                        <Bookmark 
                            size={26} 
                            className={styles.icon} 
                            fill={isSaved ? "white" : "none"} 
                        />
                    </button>
                </div>
            </footer>
        </article>
    );
};

export default PostCard;