import React from 'react';
import styles from './ShareButton.module.css';
import { Send } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const ShareButton = ({ count = 0, onClick }) => {
    const handleClick = (e) => {
        e.stopPropagation();
        console.log('Share button clicked!');
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button className={styles.actionBtn} onClick={handleClick}>
            <div className={styles.iconWrapper}>
                <Send size={24} color="white" />
            </div>
            <span className={styles.count}>{formatNumber(count)}</span>
        </button>
    );
};

export default ShareButton;
