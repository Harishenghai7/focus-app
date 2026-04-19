/**
 * LikeButton — Focus App
 * 
 * Animated heart button with optimistic UI.
 * Features:
 * - Scale "pop" micro-animation on toggle
 * - Particle burst on first like
 * - Accessible (aria-pressed, aria-label)
 * - Works with usePostLike hook
 */

import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import styles from './LikeButton.module.css';

const LikeButton = ({
    isLiked = false,
    count = 0,
    onToggle,
    isPending = false,
    size = 'md',       // 'sm' | 'md' | 'lg'
    showCount = true,
    className = '',
}) => {
    const btnRef = useRef(null);

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        if (isPending) return;

        // Trigger pop animation
        const btn = btnRef.current;
        if (btn) {
            btn.classList.remove(styles.pop);
            void btn.offsetWidth; // force reflow
            btn.classList.add(styles.pop);
        }

        onToggle?.();
    }, [isPending, onToggle]);

    return (
        <button
            ref={btnRef}
            className={[
                styles.likeBtn,
                styles[`size-${size}`],
                isLiked ? styles.liked : '',
                isPending ? styles.pending : '',
                className,
            ].filter(Boolean).join(' ')}
            onClick={handleClick}
            aria-pressed={isLiked}
            aria-label={isLiked ? 'Unlike' : 'Like'}
            disabled={isPending}
            type="button"
        >
            <motion.span 
                className={styles.heartWrap} 
                aria-hidden="true"
                whileTap={{ scale: 0.8 }}
                animate={isLiked ? { scale: [1, 1.3, 1], transition: { type: "spring", stiffness: 400, damping: 10 } } : { scale: 1 }}
            >
                {/* Filled heart (shown when liked) */}
                <svg
                    className={[styles.heartFilled, isLiked ? styles.heartVisible : ''].join(' ')}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>

                {/* Outline heart (shown when not liked) */}
                <svg
                    className={[styles.heartOutline, !isLiked ? styles.heartVisible : ''].join(' ')}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
            </motion.span>

            {showCount && (
                <span className={styles.count}>
                    {count > 0 ? (count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count) : ''}
                </span>
            )}
        </button>
    );
};

export default LikeButton;
