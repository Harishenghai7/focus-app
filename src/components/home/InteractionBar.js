import React from 'react';
import { Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './InteractionBar.module.css';
import { logOptimisticFailure, logOptimisticSuccess } from '../../utils/telemetry';
import { useAudio } from '../../context/AudioProvider';

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
    const [optimisticLiked, setOptimisticLiked] = React.useState(Boolean(isLiked));
    const [optimisticSaved, setOptimisticSaved] = React.useState(Boolean(isSaved));
    const [optimisticLikesCount, setOptimisticLikesCount] = React.useState(likesCount || 0);

    React.useEffect(() => {
        setOptimisticLiked(Boolean(isLiked));
        setOptimisticSaved(Boolean(isSaved));
        setOptimisticLikesCount(likesCount || 0);
    }, [isLiked, isSaved, likesCount]);
    
    // Helper to format numbers (e.g. 1200 -> 1.2k)
    const formatCount = (count) => {
        if (!count) return '';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'k';
        return count;
    };

    const handleLike = async () => {
        const nextLiked = !optimisticLiked;
        const nextCount = Math.max(0, optimisticLikesCount + (nextLiked ? 1 : -1));
        setOptimisticLiked(nextLiked);
        setOptimisticLikesCount(nextCount);
        try {
            await onLike?.();
            if (nextLiked) play('like');
            logOptimisticSuccess('post_like');
        } catch (error) {
            setOptimisticLiked(!nextLiked);
            setOptimisticLikesCount(optimisticLikesCount);
            logOptimisticFailure('post_like', error);
        }
    };

    const handleSave = async () => {
        const nextSaved = !optimisticSaved;
        setOptimisticSaved(nextSaved);
        try {
            await onSave?.();
            logOptimisticSuccess('post_save');
        } catch (error) {
            setOptimisticSaved(!nextSaved);
            logOptimisticFailure('post_save', error);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.left}>
                {/* LIKE BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 430, damping: 20 }}
                    className={`${styles.btn} ${optimisticLiked ? styles.liked : ''}`} 
                    onClick={handleLike}
                    aria-label="Like"
                >
                    <Heart 
                        size={26} 
                        className={styles.icon}
                        fill={optimisticLiked ? "#ff3040" : "none"} 
                        color={optimisticLiked ? "#ff3040" : "currentColor"} 
                    />
                    {optimisticLikesCount > 0 && (
                        <span className={styles.count}>{formatCount(optimisticLikesCount)}</span>
                    )}
                </motion.button>

                {/* COMMENT BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 430, damping: 20 }}
                    className={styles.btn} 
                    onClick={onComment}
                    aria-label="Comment"
                >
                    <MessageCircle size={26} className={styles.icon} />
                    {commentsCount > 0 && (
                        <span className={styles.count}>{formatCount(commentsCount)}</span>
                    )}
                </motion.button>

                {/* SHARE BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 430, damping: 20 }}
                    className={styles.btn} 
                    onClick={onShare}
                    aria-label="Share"
                >
                    <Send size={26} className={styles.icon} />
                </motion.button>
            </div>

            <div className={styles.right}>
                {/* SAVE BUTTON */}
                <motion.button
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 430, damping: 20 }}
                    className={`${styles.btn} ${optimisticSaved ? styles.saved : ''}`} 
                    onClick={handleSave}
                    aria-label="Save"
                >
                    <Bookmark 
                        size={26} 
                        className={styles.icon}
                        fill={optimisticSaved ? "white" : "none"} 
                        color="currentColor"
                    />
                </motion.button>
            </div>
        </div>
    );
};

export default InteractionBar;