import React, { useState } from 'react';
import styles from './SaveButton.module.css';
import { Bookmark } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const SaveButton = ({ isSaved, count = 0, onClick }) => {
    const [animating, setAnimating] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setAnimating(true);
        if (navigator.vibrate) navigator.vibrate(isSaved ? 20 : 40);
        setTimeout(() => setAnimating(false), 500);
        onClick?.(e);
    };

    return (
        <button
            className={`${styles.actionBtn} ${isSaved ? styles.saved : ''}`}
            onClick={handleClick}
        >
            <div className={`${styles.iconWrapper} ${animating ? styles.animating : ''}`}>
                <Bookmark
                    size={26}
                    fill={isSaved ? 'currentColor' : 'none'}
                    strokeWidth={isSaved ? 0 : 2}
                />
            </div>
            <span className={styles.count}>{formatNumber(count)}</span>
        </button>
    );
};

export default SaveButton;
