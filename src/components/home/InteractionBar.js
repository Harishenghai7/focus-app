/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * InteractionBar — Cinematic Universe Edition
 * Tactile spring-physics interactions with optimistic state management.
 * ═══════════════════════════════════════════════════════════════════════════════
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './InteractionBar.module.css';
import { logOptimisticFailure, logOptimisticSuccess } from '../../utils/telemetry';
import { useAudio } from '../../context/AudioProvider';

const springConfig = { type: 'spring', stiffness: 500, damping: 22 };

const InteractionBar = ({
    isLiked,
    likesCount = 0,
    onLike,
    onComment,
    commentsCount = 0,
    onShare,
    isSaved,
    onSave,
}) => {
    const { play } = useAudio();
    const [optimisticLiked, setOptimisticLiked] = useState(Boolean(isLiked));
    const [optimisticSaved, setOptimisticSaved] = useState(Boolean(isSaved));
    const [optimisticLikesCount, setOptimisticLikesCount] = useState(likesCount || 0);
    const [countAnimating, setCountAnimating] = useState(false);

    useEffect(() => {
        setOptimisticLiked(Boolean(isLiked));
        setOptimisticSaved(Boolean(isSaved));
        setOptimisticLikesCount(likesCount || 0);
    }, [isLiked, isSaved, likesCount]);
    
    const formatCount = (count) => {
        if (!count) return '';
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count;
    };

    const handleLike = useCallback(async () => {
        const nextLiked = !optimisticLiked;
        const nextCount = Math.max(0, optimisticLikesCount + (nextLiked ? 1 : -1));
        setOptimisticLiked(nextLiked);
        setOptimisticLikesCount(nextCount);
        setCountAnimating(true);
        setTimeout(() => setCountAnimating(false), 400);

        try {
            await onLike?.();
            if (nextLiked) play('like');
            logOptimisticSuccess('post_like');
        } catch (error) {
            setOptimisticLiked(!nextLiked);
            setOptimisticLikesCount(optimisticLikesCount);
            logOptimisticFailure('post_like', error);
        }
    }, [optimisticLiked, optimisticLikesCount, onLike, play]);

    const handleSave = useCallback(async () => {
        const nextSaved = !optimisticSaved;
        setOptimisticSaved(nextSaved);
        try {
            await onSave?.();
            logOptimisticSuccess('post_save');
        } catch (error) {
            setOptimisticSaved(!nextSaved);
            logOptimisticFailure('post_save', error);
        }
    }, [optimisticSaved, onSave]);

    return (
        <div className={styles.container}>
            <div className={styles.left}>
                {/* LIKE BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    transition={springConfig}
                    className={`${styles.btn} ${optimisticLiked ? styles.liked : ''}`} 
                    onClick={handleLike}
                    aria-label={optimisticLiked ? 'Unlike' : 'Like'}
                >
                    <motion.div
                        animate={optimisticLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <Heart 
                            size={24} 
                            className={styles.icon}
                            fill={optimisticLiked ? "#ff3040" : "none"} 
                            color={optimisticLiked ? "#ff3040" : "currentColor"} 
                        />
                    </motion.div>
                    {optimisticLikesCount > 0 && (
                        <span className={`${styles.count} ${countAnimating ? styles.countBounce : ''}`}>
                            {formatCount(optimisticLikesCount)}
                        </span>
                    )}
                </motion.button>

                {/* COMMENT BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    transition={springConfig}
                    className={styles.btn} 
                    onClick={onComment}
                    aria-label="Comment"
                >
                    <MessageCircle size={24} className={styles.icon} />
                    {commentsCount > 0 && (
                        <span className={styles.count}>{formatCount(commentsCount)}</span>
                    )}
                </motion.button>

                {/* SHARE BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.85, rotate: -15 }}
                    transition={springConfig}
                    className={styles.btn} 
                    onClick={onShare}
                    aria-label="Share"
                >
                    <Send size={24} className={styles.icon} />
                </motion.button>
            </div>

            <div className={styles.right}>
                {/* SAVE BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    transition={springConfig}
                    className={`${styles.btn} ${optimisticSaved ? styles.saved : ''}`} 
                    onClick={handleSave}
                    aria-label={optimisticSaved ? 'Unsave' : 'Save'}
                >
                    <motion.div
                        animate={optimisticSaved ? { y: [0, -4, 0] } : { y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Bookmark 
                            size={24} 
                            className={styles.icon}
                            fill={optimisticSaved ? "currentColor" : "none"} 
                            color="currentColor"
                        />
                    </motion.div>
                </motion.button>
            </div>
        </div>
    );
};

export default InteractionBar;