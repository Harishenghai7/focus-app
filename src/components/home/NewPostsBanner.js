import React from 'react';
import styles from './NewPostsBanner.module.css';
import Icon from '../ui/Icon';

const NewPostsBanner = ({ count, onClick }) => {
    if (!count || count === 0) return null;

    return (
        <div className={styles.banner} onClick={onClick}>
            <span className={styles.text}>
                {count} new post{count > 1 ? 's' : ''} available
            </span>
            <Icon name="ArrowUp" size={16} color="white" />
        </div>
    );
};

export default NewPostsBanner;
