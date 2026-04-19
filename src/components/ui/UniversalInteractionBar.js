/**
 * UniversalInteractionBar — Focus Platform
 * Premium glassmorphic Like / Comment / Share / Save bar.
 * Works across Posts and Boltz. 100% Optimistic UI.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { useFocusUser } from '../../context/FocusUserContext';
import { useInteractions } from '../../hooks/useInteractions';
import { playLike, playUnlike, playSave } from '../../utils/audioFX';
import { triggerHaptic } from '../../utils/haptics';
import { toast } from 'react-toastify';
import styles from './UniversalInteractionBar.module.css';

/** Format numbers eg: 12345 → 12.3K (always returns a string; 0 → "0") */
const fmt = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x) || x < 0) return '0';
    if (x === 0) return '0';
    if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1)}M`;
    if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
    return String(x);
};

const UniversalInteractionBar = ({
    postId,
    contentType = 'post', // 'post' | 'boltz'
    isLiked: initialLiked = false,
    likeCount: initialLikeCount = 0,
    isSaved: initialSaved = false,
    commentCount = 0,
    shareCount = 0,
    savesCount = 0,
    onCommentClick,
    onShareClick,
    onUpdate,
    className = '',
}) => {
    const { user } = useFocusUser();
    const { toggleLike, toggleSave } = useInteractions(postId, contentType);

    const [isLiked, setIsLiked] = useState(initialLiked);
    const [likeCount, setLikeCount] = useState(initialLikeCount);
    const [isSaved, setIsSaved] = useState(initialSaved);
    const [likeAnim, setLikeAnim] = useState(false);
    const [saveAnim, setSaveAnim] = useState(false);
    const longPressTimerRef = useRef(null);

    // Sync from parent if prop changes (e.g. realtime update)
    useEffect(() => {
        setIsLiked(initialLiked);
        setLikeCount(initialLikeCount);
        setIsSaved(initialSaved);
    }, [initialLiked, initialLikeCount, initialSaved]);

    const handleLike = useCallback(async () => {
        if (!user) {
            toast.info('Sign in to like posts');
            return;
        }
        const prev = isLiked;
        setIsLiked(!prev);
        setLikeCount(c => prev ? Math.max(0, c - 1) : c + 1);
        triggerHaptic(12);
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 450);
        prev ? playUnlike() : playLike();
        await toggleLike(prev, onUpdate);
    }, [user, isLiked, toggleLike, onUpdate]);

    const handleSave = useCallback(async () => {
        if (!user) {
            toast.info('Sign in to save posts');
            return;
        }
        const prev = isSaved;
        setIsSaved(!prev);
        triggerHaptic(10);
        setSaveAnim(true);
        setTimeout(() => setSaveAnim(false), 450);
        playSave();
        await toggleSave(prev, onUpdate);
    }, [user, isSaved, toggleSave, onUpdate]);

    const handleLongPressStart = useCallback(() => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
            triggerHaptic(24);
        }, 450);
    }, []);

    const handleLongPressEnd = useCallback(() => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    }, []);

    return (
        <div className={`${styles.bar} ${className}`}>
            {/* Left cluster */}
            <div className={styles.left}>
                {/* Like */}
                <motion.button
                    id={`like-btn-${postId}`}
                    className={`${styles.btn} ${isLiked ? styles.liked : ''}`}
                    onClick={handleLike}
                    onPointerDown={handleLongPressStart}
                    onPointerUp={handleLongPressEnd}
                    onPointerLeave={handleLongPressEnd}
                    whileTap={{ scale: 0.82 }}
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    aria-pressed={isLiked}
                >
                    <motion.span
                        className={styles.iconWrap}
                        animate={likeAnim ? { scale: [1, 1.45, 1] } : { scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                    >
                        <Heart
                            size={23}
                            fill={isLiked ? 'var(--color-like, #ff3040)' : 'none'}
                            stroke={isLiked ? 'var(--color-like, #ff3040)' : 'currentColor'}
                            strokeWidth={2}
                        />
                    </motion.span>
                    <AnimatePresence mode="popLayout">
                        <motion.span
                            key={likeCount}
                            className={`${styles.count} ${isLiked ? styles.countActive : ''}`}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.15 }}
                        >
                            {fmt(likeCount)}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>

                {/* Comment */}
                <motion.button
                    id={`comment-btn-${postId}`}
                    className={styles.btn}
                    onClick={onCommentClick}
                    onPointerDown={handleLongPressStart}
                    onPointerUp={handleLongPressEnd}
                    onPointerLeave={handleLongPressEnd}
                    whileTap={{ scale: 0.85 }}
                    aria-label="Comment"
                >
                    <span className={styles.iconWrap}>
                        <MessageCircle size={23} strokeWidth={2} />
                    </span>
                    <span className={styles.count}>{fmt(commentCount)}</span>
                </motion.button>

                {/* Share */}
                <motion.button
                    id={`share-btn-${postId}`}
                    className={styles.btn}
                    onClick={onShareClick}
                    onPointerDown={handleLongPressStart}
                    onPointerUp={handleLongPressEnd}
                    onPointerLeave={handleLongPressEnd}
                    whileTap={{ scale: 0.85 }}
                    aria-label="Share"
                >
                    <span className={styles.iconWrap}>
                        <Send size={21} strokeWidth={2} />
                    </span>
                    <span className={styles.count}>{fmt(shareCount)}</span>
                </motion.button>
            </div>

            {/* Right — Save */}
            <motion.button
                id={`save-btn-${postId}`}
                className={`${styles.btn} ${isSaved ? styles.saved : ''}`}
                onClick={handleSave}
                onPointerDown={handleLongPressStart}
                onPointerUp={handleLongPressEnd}
                onPointerLeave={handleLongPressEnd}
                whileTap={{ scale: 0.82 }}
                aria-label={isSaved ? 'Unsave' : 'Save'}
                aria-pressed={isSaved}
            >
                <motion.span
                    className={styles.iconWrap}
                    animate={saveAnim ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 12 }}
                >
                    <Bookmark
                        size={23}
                        fill={isSaved ? 'currentColor' : 'none'}
                        strokeWidth={2}
                    />
                </motion.span>
                <span className={`${styles.count} ${isSaved ? styles.countActive : ''}`}>
                    {fmt(savesCount)}
                </span>
            </motion.button>
        </div>
    );
};

export default UniversalInteractionBar;
