import React from 'react';
import styles from './SaveButton.module.css';
import { Bookmark } from 'lucide-react';
import { formatNumber } from '../../utils/formatNumber';

const SaveButton = ({ isSaved, count = 0, onClick }) => {
    const handleClick = (e) => {
        e.stopPropagation();
        console.log('Save button clicked!', { isSaved });
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <button className={styles.actionBtn} onClick={handleClick}>
            <div className={styles.iconWrapper}>
                <Bookmark
                    size={24}
                    fill={isSaved ? 'white' : 'none'}
                    color="white"
                />
            </div>
            <span className={styles.count}>{formatNumber(count)}</span>
        </button>
    );
};

export default SaveButton;
