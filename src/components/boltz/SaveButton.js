import React from 'react';
import styles from './SaveButton.module.css';
import { Bookmark } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const SaveButton = ({ isSaved, count = 0, onClick }) => {
    const handleClick = (e) => {
        e.stopPropagation();

        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button className={styles.actionBtn} onClick={handleClick}>
            <div className={`${styles.iconWrapper} ${isSaved ? styles.saved : ''}`}>
                <Bookmark
                    size={24}
                    fill={isSaved ? '#fbbf24' : 'none'}
                    color={isSaved ? '#fbbf24' : 'white'}
                />
            </div>
            <span className={styles.count}>{formatNumber(count)}</span>
        </button>
    );
};

export default SaveButton;
