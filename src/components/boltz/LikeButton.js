import React from 'react';
import styles from './LikeButton.module.css';
import { Heart } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const LikeButton = ({ isLiked, count, onClick }) => {
    const handleClick = (e) => {
        e.stopPropagation();
        console.log('Like button clicked!', { isLiked, count });
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button className={styles.actionBtn} onClick={handleClick}>
            <div className={`${styles.iconWrapper} ${isLiked ? styles.liked : ''}`}>
                <Heart
                    size={24}
                    fill={isLiked ? '#FF0000' : 'none'}
                    color={isLiked ? '#FF0000' : 'white'}
                />
            </div>
            <span className={styles.count}>{formatNumber(count)}</span>
        </button>
    );
};

export default LikeButton;
