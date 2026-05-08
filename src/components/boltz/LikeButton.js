import React, { useState } from 'react';
import styles from './LikeButton.module.css';
import { Heart } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const LikeButton = ({ isLiked, count, onClick, onLongPress }) => {
    const [animating, setAnimating] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setAnimating(true);
        if (navigator.vibrate) navigator.vibrate(isLiked ? 20 : 50);
        setTimeout(() => setAnimating(false), 600);
        onClick?.(e);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onLongPress?.();
    };

    return (
        <button
            className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
        >
            <div className={`${styles.iconWrapper} ${animating ? styles.animating : ''}`}>
                <Heart
                    size={26}
                    fill={isLiked ? 'currentColor' : 'none'}
                    strokeWidth={isLiked ? 0 : 2}
                />
                {animating && isLiked && (
                    <div className={styles.particles}>
                        {[...Array(6)].map((_, i) => (
                            <span key={i} className={styles.particle} style={{ '--i': i }} />
                        ))}
                    </div>
                )}
            </div>
            <span className={`${styles.count} ${animating ? styles.countBounce : ''}`}>
                {formatNumber(count)}
            </span>
        </button>
    );
};

export default LikeButton;
