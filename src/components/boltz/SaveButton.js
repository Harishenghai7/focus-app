import React from 'react';
import styles from './SaveButton.module.css';
import { Bookmark } from 'lucide-react';

const SaveButton = ({ isSaved, onClick }) => {
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
        </button>
    );
};

export default SaveButton;
