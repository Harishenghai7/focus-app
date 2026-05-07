import React from 'react';
import styles from './CommentButton.module.css';
import { MessageCircle } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const CommentButton = ({ count, onClick }) => {
    const handleClick = (e) => {
        e.stopPropagation();

        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button className={styles.actionBtn} onClick={handleClick}>
            <div className={styles.iconWrapper}>
                <MessageCircle size={24} color="white" />
            </div>
            <span className={styles.count}>{formatNumber(count)}</span>
        </button>
    );
};

export default CommentButton;
