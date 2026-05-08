import React, { useState } from 'react';
import styles from './ShareButton.module.css';
import { Send } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const ShareButton = ({ count = 0, onClick }) => {
    const [animating, setAnimating] = useState(false);

    const handleClick = (e) => {
        e.stopPropagation();
        setAnimating(true);
        if (navigator.vibrate) navigator.vibrate(30);
        setTimeout(() => setAnimating(false), 500);
        onClick?.(e);
    };

    return (
        <button className={styles.actionBtn} onClick={handleClick}>
            <div className={`${styles.iconWrapper} ${animating ? styles.animating : ''}`}>
                <Send size={24} strokeWidth={2} />
                {animating && <div className={styles.ripple} />}
            </div>
            <span className={styles.count}>{count > 0 ? formatNumber(count) : 'Share'}</span>
        </button>
    );
};

export default ShareButton;
