import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
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
import { useFollow } from '../../hooks/useFollow';
import { useComment } from '../../hooks/useComment';
import { supabase } from '../../lib/supabase';
import styles from './BoltzDetailModal.module.css';

const BoltzDetailModal = ({ isOpen, onClose, boltz, onNavigate }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const { toggleLike } = useLike();
    const { toggleSave } = useSave();
    const { toggleFollow } = useFollow();
    const { addComment } = useComment();

    const [boltzData, setBoltzData] = useState(boltz);
    const [isPlaying, setIsPlaying] = useState(true);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        setBoltzData(boltz);
        if (boltz && isOpen) {
            // Auto-play video when modal opens
            if (videoRef.current) {
                videoRef.current.play().catch(err => console.log('Auto-play prevented:', err));
            }
        }
    }, [boltz, isOpen]);

    useEffect(() => {
        if (showComments && boltz) {
            fetchComments();
        }
    }, [showComments, boltz]);

    const fetchComments = async () => {
        if (!boltz) return;

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
                .eq('post_id', boltz.id)
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

    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(e => {
                    // Ignore errors caused by pausing immediately after playing
                    if (e.name !== 'AbortError') {
                        console.error('Play error:', e);
                    }
                });
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleMuteToggle = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleLike = async () => {
        await toggleLike(boltz.id, boltzData.is_liked, (postId, updates) => {
            setBoltzData(prev => ({
                ...prev,
                is_liked: updates.is_liked,
                likes_count: prev.likes_count + (updates.is_liked ? 1 : -1)
            }));
        });
    };

    const handleSave = async () => {
        await toggleSave(boltz.id, boltzData.is_saved, (postId, updates) => {
            setBoltzData(prev => ({
                ...prev,
                is_saved: updates.is_saved
            }));
        });
    };

    const handleFollow = async () => {
        await toggleFollow(boltzData.user?.id, boltzData.is_following, (userId, updates) => {
            setBoltzData(prev => ({
                ...prev,
                is_following: updates.is_following
            }));
        });
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        setSubmittingComment(true);
        try {
            const newComment = await addComment(boltz.id, commentText);
            setComments(prev => [newComment, ...prev]);
            setCommentText('');
            setBoltzData(prev => ({
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
        const url = `${window.location.origin}/boltz/${boltz.id}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Check out this Boltz on Focus',
                    url
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(url);
        }
    };

    const handleProfileClick = () => {
        navigate(`/profile/${boltzData.user?.username}`);
        onClose();
    };

    // Swipe handlers for navigation
    const swipeHandlers = useSwipeable({
        onSwipedUp: () => onNavigate && onNavigate('next'),
        onSwipedDown: () => onNavigate && onNavigate('prev'),
        preventScrollOnSwipe: true,
        trackMouse: false
    });

    if (!boltzData) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} className={styles.modal}>
            <div className={styles.content} {...swipeHandlers}>
                {/* Video */}
                <div className={styles.videoContainer} onClick={handlePlayPause}>
                    <video
                        ref={videoRef}
                        src={boltzData.media?.[0]?.url}
                        className={styles.video}
                        loop
                        playsInline
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />

                    {/* Play/Pause Overlay */}
                    {!isPlaying && (
                        <div className={styles.playOverlay}>
                            <Icon name="Play" size={64} />
                        </div>
                    )}

                    {/* Mute Button */}
                    <button
                        className={styles.muteBtn}
                        onClick={(e) => { e.stopPropagation(); handleMuteToggle(); }}
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        <Icon name={isMuted ? 'VolumeX' : 'Volume2'} size={20} />
                    </button>
                </div>

                {/* Sidebar Actions */}
                <div className={styles.sidebar}>
                    {/* User Info */}
                    <div className={styles.userSection}>
                        <button className={styles.avatarBtn} onClick={handleProfileClick}>
                            <Avatar
                                src={boltzData.user?.avatar_url}
                                alt={boltzData.user?.username}
                                size="lg"
                            />
                            {!boltzData.is_following && boltzData.user?.id !== boltzData.current_user_id && (
                                <div className={styles.followBadge} onClick={(e) => { e.stopPropagation(); handleFollow(); }}>
                                    <Icon name="Plus" size={16} />
                                </div>
                            )}
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actions}>
                        <button
                            className={styles.actionBtn}
                            onClick={handleLike}
                            aria-label={boltzData.is_liked ? 'Unlike' : 'Like'}
                        >
                            <Icon
                                name="Heart"
                                size={32}
                                fill={boltzData.is_liked ? 'var(--error)' : 'none'}
                                color={boltzData.is_liked ? 'var(--error)' : 'white'}
                            />
                            <span className={styles.actionCount}>
                                {formatNumber(boltzData.likes_count)}
                            </span>
                        </button>

                        <button
                            className={styles.actionBtn}
                            onClick={() => setShowComments(!showComments)}
                            aria-label="Comments"
                        >
                            <Icon name="MessageCircle" size={32} />
                            <span className={styles.actionCount}>
                                {formatNumber(boltzData.comments_count)}
                            </span>
                        </button>

                        <button
                            className={styles.actionBtn}
                            onClick={handleSave}
                            aria-label={boltzData.is_saved ? 'Unsave' : 'Save'}
                        >
                            <Icon
                                name="Bookmark"
                                size={32}
                                fill={boltzData.is_saved ? 'white' : 'none'}
                            />
                        </button>

                        <button
                            className={styles.actionBtn}
                            onClick={handleShare}
                            aria-label="Share"
                        >
                            <Icon name="Share2" size={32} />
                        </button>
                    </div>

                    {/* Views Count */}
                    {boltzData.views_count !== undefined && (
                        <div className={styles.views}>
                            <Icon name="Eye" size={20} />
                            <span>{formatNumber(boltzData.views_count)}</span>
                        </div>
                    )}
                </div>

                {/* Bottom Info */}
                <div className={styles.bottomInfo}>
                    <div className={styles.username} onClick={handleProfileClick}>
                        @{boltzData.user?.username}
                        {boltzData.user?.verified && <VerifiedBadge size={16} />}
                    </div>
                    {boltzData.caption && (
                        <div className={styles.caption}>
                            {linkifyText(boltzData.caption, styles.link)}
                        </div>
                    )}
                    <div className={styles.timestamp}>
                        {formatTimeAgo(boltzData.created_at)}
                    </div>
                </div>

                {/* Navigation Hints */}
                {onNavigate && (
                    <div className={styles.navHints}>
                        <div className={styles.navHint}>
                            <Icon name="ChevronUp" size={20} />
                            <span>Swipe up</span>
                        </div>
                        <div className={styles.navHint}>
                            <Icon name="ChevronDown" size={20} />
                            <span>Swipe down</span>
                        </div>
                    </div>
                )}

                {/* Comments Drawer */}
                {showComments && (
                    <div className={styles.commentsDrawer}>
                        <div className={styles.commentsHeader}>
                            <h3>Comments</h3>
                            <button onClick={() => setShowComments(false)}>
                                <Icon name="X" size={24} />
                            </button>
                        </div>

                        <div className={styles.commentsList}>
                            {loadingComments ? (
                                <div className={styles.loading}>Loading comments...</div>
                            ) : comments.length === 0 ? (
                                <div className={styles.noComments}>No comments yet</div>
                            ) : (
                                comments.map((comment) => (
                                    <div key={comment.id} className={styles.comment}>
                                        <Avatar
                                            src={comment.user?.avatar_url}
                                            alt={comment.user?.username}
                                            size="sm"
                                        />
                                        <div className={styles.commentContent}>
                                            <div className={styles.commentText}>
                                                <span className={styles.commentUsername}>
                                                    {comment.user?.username}
                                                </span>
                                                <span>{linkifyText(comment.text, styles.link)}</span>
                                            </div>
                                            <div className={styles.commentMeta}>
                                                {formatTimeAgo(comment.created_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                            <input
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
                                <Icon name="Send" size={20} />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default BoltzDetailModal;
