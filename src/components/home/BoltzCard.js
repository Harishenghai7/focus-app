import React, { useRef, useEffect, useState } from 'react';
import styles from './BoltzCard.module.css';
import Icon from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { useLike } from '../../hooks/useLike';
import { useSave } from '../../hooks/useSave';
import { formatNumber } from '../../utils/formatNumber';

const BoltzCard = ({ post, onCommentClick, onShareClick }) => {
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const { isLiked, likesCount, toggleLike, animating } = useLike(post, 'boltz');
    const { isSaved, toggleSave } = useSave(post, 'boltz');

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    videoRef.current?.play().catch(() => { });
                    setIsPlaying(true);
                } else {
                    videoRef.current?.pause();
                    setIsPlaying(false);
                }
            },
            { threshold: 0.6 }
        );

        if (videoRef.current) {
            observer.observe(videoRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => {
                    if (e.name !== 'AbortError') {
                        console.error('Play error:', e);
                    }
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.videoContainer} onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={post.media[0].url}
                    className={styles.video}
                    loop
                    muted
                    playsInline
                />
                {!isPlaying && (
                    <div className={styles.playOverlay}>
                        <Icon name="Play" size={48} color="white" fill="white" />
                    </div>
                )}

                <div className={styles.overlay}>
                    <div className={styles.userInfo}>
                        <Avatar src={post.user.avatar_url} size="sm" />
                        <span className={styles.username}>{post.user.username}</span>
                    </div>

                    <div className={styles.actions}>
                        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); toggleLike(); }}>
                            <Icon
                                name="Heart"
                                size={28}
                                fill={isLiked ? "var(--error)" : "none"}
                                color={isLiked ? "var(--error)" : "white"}
                                className={animating ? styles.animating : ''}
                            />
                            <span className={styles.count}>{formatNumber(likesCount)}</span>
                        </button>

                        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onCommentClick && onCommentClick(post); }}>
                            <Icon name="MessageCircle" size={28} color="white" />
                            <span className={styles.count}>{formatNumber(post.comments_count)}</span>
                        </button>

                        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); onShareClick && onShareClick(post); }}>
                            <Icon name="Share2" size={28} color="white" />
                        </button>

                        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); toggleSave(); }}>
                            <Icon
                                name="Bookmark"
                                size={28}
                                fill={isSaved ? "white" : "none"}
                                color="white"
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoltzCard;
