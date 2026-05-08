import React, { useState } from 'react';
import styles from './CommentButton.module.css';
import { MessageCircle } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const CommentButton = ({ count, onClick, isActive }) => {
    const [animating, setAnimating] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setAnimating(true);
        setTimeout(() => setAnimating(false), 400);
        onClick?.(e);
    };

    return (
        <button
            className={`${styles.actionBtn} ${isActive ? styles.active : ''}`}
            onClick={handleClick}
        >
            <div className={`${styles.iconWrapper} ${animating ? styles.animating : ''}`}>
                <MessageCircle size={26} strokeWidth={2} />
            </div>
            <span className={styles.count}>{formatNumber(count)}</span>
        </button>
    );
};

export default CommentButton;
