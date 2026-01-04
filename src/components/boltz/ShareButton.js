import React from 'react';
import styles from './ShareButton.module.css';
import { Send } from 'lucide-react';

const ShareButton = ({ onClick }) => {
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
        </button>
    );
};

export default ShareButton;
